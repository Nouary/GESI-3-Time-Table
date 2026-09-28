-- =====================================================================
-- GESI 3 — Semestre 5 — ENSA Fès — 2026/2027
-- Fichier d'initialisation complet Supabase (Tables + RLS + Seed)
-- Intègre :
--   * Table 'modules' (regroupement avec parent_code)
--   * Table 'sessions' (créneaux réguliers S1..S11)
--   * Table 'reports' (reports avec new_week + support annulation pure)
--   * Table 'documents' (avec file_path pour suppression propre du storage)
--   * RLS sécurisée (lecture publique, écriture admin authentifié)
--   * Policies pour le bucket Supabase Storage 'documents'
--   * Données initiales (Seed) de l'emploi du temps officiel
-- =====================================================================

-- ---------- 1. CRÉATION DES TABLES ----------

create table if not exists modules (
  module_code text primary key,      -- ex: 'M354-1'
  parent_code text not null,         -- ex: 'M354' (regroupement pour les filtres d'UI)
  name text not null
);

create table if not exists sessions (
  id uuid primary key default gen_random_uuid(),
  module_code text not null references modules(module_code) on update cascade,
  session_type text not null check (session_type in ('cours', 'td', 'cours_td', 'tp', 'ap')),
  day text not null check (day in ('lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi')),
  start_time text not null,          -- ex: '08:30'
  end_time text not null,            -- ex: '12:30'
  week_from int not null check (week_from between 1 and 11),
  week_to int not null check (week_to between 1 and 11),
  room text,
  professor text,
  student_group text check (student_group in ('Gr1', 'Gr2')),
  created_at timestamptz default now()
);

create table if not exists reports (
  id uuid primary key default gen_random_uuid(),
  original_session_id uuid not null references sessions(id) on delete cascade,
  original_week int not null check (original_week between 1 and 11),
  status text not null default 'reported' check (status in ('reported', 'cancelled')),
  new_week int check (new_week between 1 and 11),  -- semaine cible (null si annulé)
  new_day text check (new_day in ('lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi')),
  new_date date,                                  -- date calendaire exacte (ex: 2026-11-12)
  new_start_time text,                            -- ex: '14:30'
  new_end_time text,                              -- ex: '18:30'
  new_room text,
  note text,                                      -- commentaire optionnel
  created_at timestamptz default now()
);

create table if not exists documents (
  id uuid primary key default gen_random_uuid(),
  module_code text not null references modules(module_code) on update cascade,
  tag text not null check (tag in ('cours', 'td', 'correction_td', 'tp', 'autre')),
  title text not null,
  file_path text not null,                        -- chemin dans le bucket storage pour suppression propre
  file_url text not null,                         -- URL publique retournée par Supabase Storage
  file_size_bytes int,
  uploaded_at timestamptz default now()
);

-- ---------- 2. ROW LEVEL SECURITY (RLS) ----------

alter table modules enable row level security;
alter table sessions enable row level security;
alter table reports enable row level security;
alter table documents enable row level security;

-- Nettoyage préventif des policies si ré-exécuté
drop policy if exists "public read modules" on modules;
drop policy if exists "public read sessions" on sessions;
drop policy if exists "public read reports" on reports;
drop policy if exists "public read documents" on documents;
drop policy if exists "admin write modules" on modules;
drop policy if exists "admin write sessions" on sessions;
drop policy if exists "admin write reports" on reports;
drop policy if exists "admin write documents" on documents;

-- Policies de lecture publique (visiteurs et élèves, pas de login requis)
create policy "public read modules" on modules for select using (true);
create policy "public read sessions" on sessions for select using (true);
create policy "public read reports" on reports for select using (true);
create policy "public read documents" on documents for select using (true);

-- Policies d'écriture admin (utilisateur connecté via Supabase Auth)
create policy "admin write modules" on modules for all to authenticated using (true) with check (true);
create policy "admin write sessions" on sessions for all to authenticated using (true) with check (true);
create policy "admin write reports" on reports for all to authenticated using (true) with check (true);
create policy "admin write documents" on documents for all to authenticated using (true) with check (true);

-- ---------- 3. STORAGE BUCKET & POLICIES ----------
-- Crée le bucket 'documents' en mode public s'il n'existe pas déjà

insert into storage.buckets (id, name, public)
values ('documents', 'documents', true)
on conflict (id) do update set public = true;

drop policy if exists "Public read documents storage" on storage.objects;
drop policy if exists "Admin insert documents storage" on storage.objects;
drop policy if exists "Admin delete documents storage" on storage.objects;

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

-- ---------- 4. SEED : MODULES ----------

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

-- ---------- 5. SEED : SESSIONS (Semaines 1 à 11) ----------

truncate table sessions restart identity cascade;

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
