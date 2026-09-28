# Spécification technique — Site de gestion d'emploi du temps + partage de documents (GESI3, ENSA Fès)

## 1. Contexte et objectif

Site web destiné à une classe universitaire (GESI 3ème année, Semestre 5, 2026/2027, semestre de 11 semaines à l'ENSA de Fès). Deux fonctionnalités principales :

1. **Emploi du temps interactif** navigable par semaine (1 à 11), avec gestion des séances **reportées** (déplacées à une autre date par un professeur) et **annulées**.
2. **Partage de documents** par matière, taggés par type (cours, TD, correction TD, TP, autre).

Un seul utilisateur "responsable de classe" a les droits d'écriture (créer/modifier séances, marquer un report ou annulation, uploader et supprimer des fichiers). Tous les autres visiteurs sont en **lecture seule**, sans compte requis.

---

## 2. Stack technique

| Couche | Choix | Raison |
|---|---|---|
| Backend / DB | **Supabase** (Postgres + Auth + Storage) | Gratuit jusqu'à 500 Mo DB / 1 Go storage / 50k MAU ; API auto-générée |
| Frontend | **React** (Vite) + CSS Tokens (Design Multi-Style) | Rapide, léger, reproduction fidèle de la maquette (Zine, Éditorial, Terminal) |
| Hébergement frontend | **Vercel** ou **Netlify** (plan gratuit) | Déploiement automatique depuis GitHub, HTTPS gratuit, domaine `*.vercel.app` inclus |
| Auth | Supabase Auth — **un seul compte admin** (email/mot de passe) | Aucun compte requis pour les élèves (lecture publique) |
| Stockage fichiers | Supabase Storage (bucket `documents`, public en lecture) | Intégré nativement à Supabase, suppression synchronisée via `file_path` |

Aucune dépendance payante n'est nécessaire pour un usage à l'échelle d'une classe.

---

## 3. Modèle de données (Postgres / Supabase)

### 3.1 Table `modules` (modules et sous-modules)

Permet de gérer les sous-modules (ex: M352-1 Véhicule Électrique et M352-2 Véhicule Intelligent) tout en conservant le regroupement parent (`parent_code`) pour l'affichage des filtres et onglets de l'UI.

```sql
create table modules (
  module_code text primary key,      -- ex: 'M354-1', 'M351'
  parent_code text not null,         -- ex: 'M354', 'M351' (pour regrouper dans l'UI)
  name text not null                 -- ex: 'Véhicule Électrique'
);
```

### 3.2 Table `sessions` (emploi du temps de base)

```sql
create table sessions (
  id uuid primary key default gen_random_uuid(),
  module_code text not null references modules(module_code),
  session_type text not null check (session_type in ('cours', 'td', 'cours_td', 'tp', 'ap')),
  day text not null check (day in ('lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi')),
  start_time text not null,          -- '08:30'
  end_time text not null,            -- '12:30'
  week_from int not null check (week_from between 1 and 11),
  week_to int not null check (week_to between 1 and 11),
  room text,
  professor text,
  student_group text check (student_group in ('Gr1', 'Gr2')), -- null si toute la promo
  created_at timestamptz default now()
);
```

### 3.3 Table `reports` (séances reportées et annulations)

Intègre les recommandations d'architecture :
- `status` : `'reported'` (séance déplacée) ou `'cancelled'` (séance annulée, avec ou sans date de rattrapage fixée).
- `new_week` : numéro de semaine cible (1 à 11) pour requêter instantanément la semaine d'affichage.
- Champs de destination (`new_week`, `new_day`, `new_date`, etc.) nullables en cas d'annulation pure.

```sql
create table reports (
  id uuid primary key default gen_random_uuid(),
  original_session_id uuid not null references sessions(id) on delete cascade,
  original_week int not null check (original_week between 1 and 11),
  status text not null default 'reported' check (status in ('reported', 'cancelled')),
  new_week int check (new_week between 1 and 11),
  new_day text check (new_day in ('lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi')),
  new_date date,                     -- date réelle du report (ex: '2026-11-12')
  new_start_time text,               -- '14:30'
  new_end_time text,                 -- '18:30'
  new_room text,
  note text,                         -- commentaire optionnel du responsable
  created_at timestamptz default now()
);
```

#### Logique d'affichage des reports :
- **À l'emplacement d'origine** (semaine `original_week`, jour de la séance) : afficher la séance barrée + badge :
  - Si `status = 'reported'` : badge "Reporté au [new_date]" (ou "Reporté en Semaine [new_week]") avec lien vers le nouvel emplacement.
  - Si `status = 'cancelled'` : badge "Séance annulée".
- **À l'emplacement cible** (`new_week`, `new_day`) : afficher une carte de séance injectée avec badge "Rattrapage (Semaine [original_week])" + lien de retour.

### 3.4 Table `documents` (fichiers partagés)

Intègre `file_path` pour permettre une suppression propre dans Supabase Storage sans fichiers orphelins.

```sql
create table documents (
  id uuid primary key default gen_random_uuid(),
  module_code text not null references modules(module_code),
  tag text not null check (tag in ('cours', 'td', 'correction_td', 'tp', 'autre')),
  title text not null,
  file_path text not null,           -- chemin interne dans le bucket (ex: 'M357/1695849203_cours1.pdf')
  file_url text not null,            -- URL publique Supabase Storage
  file_size_bytes int,
  uploaded_at timestamptz default now()
);
```

### 3.5 Bucket Supabase Storage

- **Nom** : `documents`
- **Accès** : lecture publique, écriture et suppression réservées au rôle authentifié.
- **Taille max par fichier** : 50 Mo (limite du plan gratuit).

### 3.6 Row Level Security (RLS)

```sql
-- Activation RLS sur toutes les tables
alter table modules enable row level security;
alter table sessions enable row level security;
alter table reports enable row level security;
alter table documents enable row level security;

-- Policies de lecture publique (élèves et visiteurs)
create policy "public read modules" on modules for select using (true);
create policy "public read sessions" on sessions for select using (true);
create policy "public read reports" on reports for select using (true);
create policy "public read documents" on documents for select using (true);

-- Policies d'écriture admin (authentifié uniquement)
create policy "admin write modules" on modules for all to authenticated using (true) with check (true);
create policy "admin write sessions" on sessions for all to authenticated using (true) with check (true);
create policy "admin write reports" on reports for all to authenticated using (true) with check (true);
create policy "admin write documents" on documents for all to authenticated using (true) with check (true);

-- Storage bucket RLS policies (bucket 'documents')
create policy "Public read documents storage"
  on storage.objects for select
  using (bucket_id = 'documents');

create policy "Admin insert documents storage"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'documents');

create policy "Admin delete documents storage"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'documents');
```

---

## 4. Données initiales (Seed complet — S5 GESI3 ENSA Fès)

### 4.1 Modules
```sql
insert into modules (module_code, parent_code, name) values
  ('M351',   'M351', 'Smart Grids'),
  ('M352-1', 'M352', 'Véhicule Électrique'),
  ('M352-2', 'M352', 'Véhicule Intelligent'),
  ('M353',   'M353', 'Gestion d''Énergie Multisources'),
  ('M354-1', 'M354', 'Confort Thermique'),
  ('M354-2', 'M354', 'Dimensionnement Énergétique'),
  ('M355-1', 'M355', 'Français'),
  ('M355-2', 'M355', 'Anglais'),
  ('M356',   'M356', 'Entrepreneuriat et Management de Projets'),
  ('M357',   'M357', 'Efficacité et Audit Énergétique')
on conflict (module_code) do update set
  parent_code = excluded.parent_code,
  name = excluded.name;
```

### 4.2 Séances régulières (Semaines 1 à 11)
```sql
insert into sessions
  (module_code, session_type, day, start_time, end_time, week_from, week_to, room, professor, student_group)
values
  -- ===== LUNDI =====
  ('M352-2', 'cours',    'lundi', '08:30', '12:30',  1,  5, 'Salle 1.6', 'El Aafou', null),
  ('M352-1', 'cours',    'lundi', '08:30', '12:30',  6, 11, 'Salle 1.6', 'Salhi',    null),
  ('M353',   'tp',       'lundi', '14:30', '18:30',  7, 11, 'Atelier Électrotechnique', 'Hihi', 'Gr2'),

  -- ===== MARDI =====
  ('M355-2', 'cours',    'mardi', '08:30', '12:30',  1,  4, 'Salle 0.7', 'Achahbar', null),
  ('M355-1', 'cours',    'mardi', '08:30', '12:30',  8, 11, 'Salle 0.7', 'Nasri',    null),
  ('M357',   'cours_td', 'mardi', '14:30', '18:30',  1,  9, 'Salle 0.2', 'J. El Haini', null),
  ('M357',   'tp',       'mardi', '14:30', '18:30', 10, 11, 'Salle 0.2', 'J. El Haini', 'Gr1'),

  -- ===== MERCREDI =====
  ('M351',   'cours_td', 'mercredi', '08:30', '12:30',  1,  7, 'Salle 2.13', 'M. Salhi', null),
  ('M351',   'cours_td', 'mercredi', '08:30', '12:30',  8,  9, 'Salle 1.8',  'M. Salhi', null),
  ('M351',   'tp',       'mercredi', '08:30', '12:30', 10, 10, 'Salle 1.8',  'M. Salhi', null),
  ('M351',   'ap',       'mercredi', '08:30', '12:30', 11, 11, 'Salle 1.8',  'M. Salhi', null),
  ('M354-2', 'cours_td', 'mercredi', '14:30', '18:30',  6,  9, 'Salle 0.2', 'El Hammami', null),
  ('M354-2', 'tp',       'mercredi', '14:30', '18:30', 10, 11, 'Salle 0.2', 'El Hammami', 'Gr1'),

  -- ===== JEUDI =====
  ('M353',   'cours_td', 'jeudi', '08:30', '12:30',  1,  4, 'Salle 2.11', 'Hihi', null),
  ('M353',   'cours_td', 'jeudi', '08:30', '12:30',  5,  6, 'Salle 1.6',  'Hihi', null),
  ('M353',   'tp',       'jeudi', '08:30', '12:30',  7, 11, 'Atelier Électrotechnique', 'Hihi', 'Gr1'),
  ('M354-2', 'tp',       'jeudi', '14:30', '18:30', 10, 11, 'Salle 1.7', 'El Hammami', 'Gr2'),

  -- ===== VENDREDI =====
  ('M354-1', 'cours_td', 'vendredi', '08:30', '12:30',  6,  9, 'Salle 1.6', 'Ouhaibi', null),
  ('M354-1', 'tp',       'vendredi', '08:30', '12:30', 10, 11, 'Salle 1.6', 'Ouhaibi', 'Gr1'),
  ('M356',   'cours',    'vendredi', '14:30', '16:30',  1,  8, 'Salle 1.1', 'Alla', null),
  ('M357',   'tp',       'vendredi', '14:30', '16:30', 10, 11, 'Salle 1.6', 'J. El Haini', 'Gr2'),
  ('M354-1', 'tp',       'vendredi', '16:30', '18:30', 10, 11, 'Salle 2.13', 'Ouhaibi', 'Gr2'),

  -- ===== SAMEDI =====
  ('M355-2', 'ap', 'samedi', '14:30', '16:30', 4, 7, null, 'Elogha', null),
  ('M355-1', 'ap', 'samedi', '16:30', '18:30', 4, 7, null, 'Elogha', null);
```

---

## 5. Structure des pages et interactions (frontend)

| Route / Vue | Contenu |
|---|---|
| `/` (ou onglet Planning) | Emploi du temps de la semaine courante avec navigation ‹ Semaine N › (1 à 11) |
| `/documents` (ou onglet Documents) | Liste des documents par matière (`parent_code` ou nom de module), filtrable par tag |
| `/admin` | Connexion administrateur + tableau de bord (report, annulation, upload/gestion documents, gestion séances) |

### 5.1 Dock de contrôle multi-style (Responsive)
- **Sur Desktop (> 640px)** : dock vertical fixe à droite (`top: 50%; right: 14px; transform: translateY(-50%)`), marge droite de 90px sur le contenu.
- **Sur Mobile (<= 640px)** :
  - Le contenu reprend sa largeur normale (`padding: 14px 16px 80px 16px`).
  - Le dock de contrôle passe en **bouton flottant discret** ou en barre inférieure compacte pour ne pas comprimer les cartes de cours.
- Supporte les 3 directions visuelles (Zine Étudiant, Éditorial Technique, Terminal / Blueprint) en mode Clair et Sombre (6 combinaisons), persisté dans `localStorage`.

### 5.2 Onglet Planning
- Sélecteur de semaine (1 à 11) synchronisé avec le tampon en-tête.
- Pour chaque jour (Lundi au Samedi) :
  - Liste des séances valides (`week_from <= semaine <= week_to`).
  - Si une séance est annulée : barrée avec badge rouge "Annulée".
  - Si une séance est reportée : barrée avec badge "Reportée en Semaine [N]" (et date si renseignée) + lien vers le jour de report.
  - Séances de rattrapage injectées pour la semaine affichée (`where new_week = semaine`).
  - Mention "Pas de cours ce jour-là" si aucune séance n'est programmée.

### 5.3 Onglet Documents
- Chips de matières regroupées par module parent (Smart Grids, Véhicule, Énergie Multisources, Confort / Dimensionnement, Langues, Management, Audit Énergétique).
- Filtres rapides par type : Tous, Cours, TD, Correction TD, TP, Autre.
- Cartes de documents adaptées à l'identité visuelle active avec nom, taille, date et bouton de téléchargement direct.

### 5.4 Espace Administration (`/admin`)
- Formulaire d'authentification Supabase (Email/Mot de passe).
- **Module Report / Annulation** :
  - Choisir une séance existante et la semaine concernée.
  - Choisir l'action : *Reporter* ou *Annuler*.
  - Si report : saisir la semaine cible (`new_week`), jour, date, créneau horaire, salle optionnelle.
  - Commentaire optionnel (ex: "Rattrapage demandé par Pr. Hihi").
- **Module Documents** :
  - Sélectionner le module et le tag.
  - Déposer le fichier (upload direct dans Supabase Storage bucket `documents`).
  - Enregistrer la ligne en base avec `file_path` et `file_url`.
  - Bouton de suppression qui efface simultanément l'entrée en base et le blob dans le bucket Storage.

---

## 6. Déploiement

1. **Supabase** :
   - Créer un projet Supabase.
   - Exécuter le script complet `supabase_setup.sql`.
   - Créer le bucket public `documents`.
   - Créer un utilisateur administrateur dans **Authentication > Users**.
2. **Frontend React** :
   - Développer le projet React (Vite) avec `@supabase/supabase-js`.
   - Variables d'environnement dans `.env` :
     ```env
     VITE_SUPABASE_URL=https://votre-projet.supabase.co
     VITE_SUPABASE_ANON_KEY=votre-cle-anon
     ```
3. **Vercel / Netlify** :
   - Connecter le dépôt GitHub.
   - Configurer les deux variables d'environnement dans le panneau de déploiement.