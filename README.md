# GESI3 — Emploi du Temps Interactif & Partage de Documents
**Promotion GESI 3ème année — Semestre 5 (2026/2027) — ENSA Fès**

> 💡 **Note de l'auteur :**  
> Ce site web a été créé bénévolement dans le but d'aider à organiser et simplifier la vie étudiante de la classe GESI 3.  
> Il s'agit d'un projet personnel (*side project*) développé avec l'aide de l'IA sur mon temps libre.  
> **Créé par :** NOUARY Lhoussaine  
> **Date :** 28 Septembre 2026

Application web moderne, réactive et multi-styles conçue pour la classe GESI3 :
1. **Emploi du temps interactif** : navigation fluide par semaine (Semaines 1 à 11), gestion visuelle des séances régulières, des **séances reportées**, des **séances annulées** et injection des **créneaux de rattrapage**.
2. **Partage de documents** : cours, TD, corrections, TP classés par matière avec téléchargement direct.
3. **Système de design multi-identités** : 3 directions visuelles interchangeables en direct (**Zine Étudiant** avec post-its et washi tape, **Éditorial Technique**, **Terminal / Blueprint**) déclinées en mode **Clair** et **Sombre** (6 rendus).
4. **Accès libre pour les étudiants** (aucun compte requis) et espace administrateur réservé au responsable de classe.

---

## 🚀 Démarrage rapide en local

### Prérequis
- [Node.js](https://nodejs.org/) (v18 ou supérieur)

### Installation et lancement
```bash
# 1. Installer les dépendances
npm install

# 2. Lancer le serveur de développement local
npm run dev
```

L'application est immédiatement accessible sur `http://localhost:5173/`.  
*Note : Même sans compte Supabase configuré, l'application démarre en mode démo réactif avec toutes les données officielles GESI3 déjà chargées.*

---

## 🗄️ Configuration de Supabase (Production)

L'application utilise **Supabase** (PostgreSQL, Auth et Storage) pour la persistance en ligne.

### Étape 1 : Initialiser la base de données
1. Créez un projet gratuit sur [supabase.com](https://supabase.com).
2. Rendez-vous dans **SQL Editor** dans le tableau de bord Supabase.
3. Ouvrez le fichier local [`supabase_setup.sql`](./supabase_setup.sql) et copiez son contenu dans l'éditeur SQL, puis cliquez sur **Run**.
   - Ce script crée automatiquement les 4 tables (`modules`, `sessions`, `reports`, `documents`).
   - Active la sécurité RLS (Row Level Security).
   - Crée le bucket de stockage `documents` avec ses politiques d'accès.
   - Insère le jeu de données officiel initial (modules et emploi du temps complet S1..S11).

### Étape 2 : Créer le compte responsable (Admin)
Dans le panneau Supabase, allez dans **Authentication** > **Users** > **Add User** :
- Renseignez l'email du responsable (ex: `admin@gesi3.ensa`) et un mot de passe sécurisé.

### Étape 3 : Configurer les variables d'environnement
Créez ou modifiez le fichier `.env` à la racine :
```env
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre-cle-anon-publique
```

---

## 🌐 Déploiement sur Vercel ou Netlify

1. Poussez votre code sur votre dépôt GitHub :
   ```bash
   git add .
   git commit -m "feat: application GESI3 timetable and documents"
   git push origin main
   ```
2. Sur **Vercel** ou **Netlify** :
   - Importez le dépôt GitHub.
   - Framework preset : **Vite**.
   - Build command : `npm run build`.
   - Output directory : `dist`.
   - Ajoutez les variables d'environnement dans les paramètres du projet :
     - `VITE_SUPABASE_URL`
     - `VITE_SUPABASE_ANON_KEY`
3. Cliquez sur **Deploy**. Votre site est en ligne en HTTPS avec un nom de domaine gratuit (`*.vercel.app` ou `*.netlify.app`).

---

## 📁 Architecture du projet

```
├── public/                 # Assets statiques
├── src/
│   ├── components/         # Composants d'interface
│   │   ├── AdminView.jsx   # Espace d'administration (reports, annulations, documents)
│   │   ├── ControlsDock.jsx# Dock multi-styles et thème clair/sombre
│   │   ├── DocumentsView.jsx# Consultation et filtrage des documents
│   │   ├── Footer.jsx      # Pied de page dynamique
│   │   ├── Header.jsx      # Logo dynamique, sous-titre et tampon date/semaine
│   │   ├── PlanningView.jsx# Grille hebdomadaire, post-its, badges et rattrapages
│   │   ├── TabsNav.jsx     # Navigation par onglets (Planning / Documents / Admin)
│   │   └── WeekStrip.jsx   # Sélecteur de semaine (1 à 11)
│   ├── context/
│   │   └── ThemeContext.jsx# Moteur des 3 styles (Zine, Éditorial, Terminal) + Thème
│   ├── data/
│   │   └── initialData.js  # Données officielles de l'emploi du temps S1..S11
│   ├── lib/
│   │   ├── dataService.js  # Couche unifiée Supabase Live + Fallback réactif
│   │   └── supabase.js     # Client Supabase
│   ├── App.jsx             # Composant racine
│   ├── index.css           # Design tokens, variables CSS, typographies, responsive
│   └── main.jsx            # Point d'entrée React
├── index.html              # HTML avec safe-areas et meta tags
├── supabase_setup.sql      # Script SQL complet tables + RLS + storage + seed
└── technique.md            # Spécification technique complète
```
