-- Backend communautaire optionnel de GRAVITAS (Supabase / PostgreSQL).
-- Renseigne ensuite l'URL du projet et la clé publique dans Réglages → Données en ligne.

create table if not exists public.competitions (
  id text primary key,
  name text not null,
  city text not null default '',
  country text not null default 'France',
  lat double precision not null,
  lng double precision not null,
  start date not null,
  "end" date,
  disciplines text[] not null default '{}',
  organizer text,
  url text,
  source text,
  verified boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.coaches (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.competitions enable row level security;
alter table public.coaches enable row level security;

-- Lecture publique, ajout ouvert (les compétitions arrivent non vérifiées).
create policy "competitions lisibles" on public.competitions for select using (true);
create policy "competitions ajoutables" on public.competitions for insert with check (verified = false);

create policy "coachs lisibles" on public.coaches for select using (true);
create policy "coachs publiables" on public.coaches for insert with check (true);
create policy "coachs modifiables" on public.coaches for update using (true) with check (true);
