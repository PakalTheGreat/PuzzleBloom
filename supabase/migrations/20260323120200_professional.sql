-- CWG Phase 1: professional catalog + specialist professional data

create table public.specialties (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name_pt text not null,
  description_pt text,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.specialist_specialties (
  id uuid primary key default gen_random_uuid(),
  specialist_profile_id uuid not null references public.specialist_profiles (id) on delete cascade,
  specialty_id uuid not null references public.specialties (id) on delete restrict,
  is_primary boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  unique (specialist_profile_id, specialty_id)
);

create table public.professional_credentials (
  id uuid primary key default gen_random_uuid(),
  specialist_profile_id uuid not null references public.specialist_profiles (id) on delete cascade,
  kind text not null,
  title text not null,
  issuer text,
  credential_number text,
  issued_on date,
  expires_on date,
  is_public boolean not null default true,
  verified_by_admin boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create trigger professional_credentials_set_updated_at
before update on public.professional_credentials
for each row execute function public.set_updated_at();

create table public.service_areas (
  id uuid primary key default gen_random_uuid(),
  specialist_profile_id uuid not null references public.specialist_profiles (id) on delete cascade,
  state text not null,
  city text,
  region text,
  created_at timestamptz not null default timezone('utc', now())
);

create index service_areas_state_city_idx on public.service_areas (state, city);

create table public.professional_portfolio_items (
  id uuid primary key default gen_random_uuid(),
  specialist_profile_id uuid not null references public.specialist_profiles (id) on delete cascade,
  title text not null,
  description text,
  media_url text,
  sort_order integer not null default 0,
  is_public boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create trigger professional_portfolio_items_set_updated_at
before update on public.professional_portfolio_items
for each row execute function public.set_updated_at();

alter table public.specialties enable row level security;
alter table public.specialist_specialties enable row level security;
alter table public.professional_credentials enable row level security;
alter table public.service_areas enable row level security;
alter table public.professional_portfolio_items enable row level security;

create policy specialties_select_all on public.specialties
  for select using (is_active = true or public.is_admin());

create policy specialties_admin_write on public.specialties
  for all using (public.is_admin())
  with check (public.is_admin());

create policy specialist_specialties_select_public on public.specialist_specialties
  for select using (true);

create policy specialist_specialties_write_own on public.specialist_specialties
  for all using (
    public.is_admin()
    or exists (
      select 1 from public.specialist_profiles sp
      where sp.id = specialist_profile_id and sp.user_id = auth.uid()
    )
  )
  with check (
    public.is_admin()
    or exists (
      select 1 from public.specialist_profiles sp
      where sp.id = specialist_profile_id and sp.user_id = auth.uid()
    )
  );

create policy credentials_select_public_or_owner on public.professional_credentials
  for select using (
    is_public = true
    or public.is_admin()
    or exists (
      select 1 from public.specialist_profiles sp
      where sp.id = specialist_profile_id and sp.user_id = auth.uid()
    )
  );

create policy credentials_write_own on public.professional_credentials
  for all using (
    public.is_admin()
    or exists (
      select 1 from public.specialist_profiles sp
      where sp.id = specialist_profile_id and sp.user_id = auth.uid()
    )
  )
  with check (
    public.is_admin()
    or exists (
      select 1 from public.specialist_profiles sp
      where sp.id = specialist_profile_id and sp.user_id = auth.uid()
    )
  );

create policy service_areas_select_public on public.service_areas
  for select using (true);

create policy service_areas_write_own on public.service_areas
  for all using (
    public.is_admin()
    or exists (
      select 1 from public.specialist_profiles sp
      where sp.id = specialist_profile_id and sp.user_id = auth.uid()
    )
  )
  with check (
    public.is_admin()
    or exists (
      select 1 from public.specialist_profiles sp
      where sp.id = specialist_profile_id and sp.user_id = auth.uid()
    )
  );

create policy portfolio_select_public_or_owner on public.professional_portfolio_items
  for select using (
    is_public = true
    or public.is_admin()
    or exists (
      select 1 from public.specialist_profiles sp
      where sp.id = specialist_profile_id and sp.user_id = auth.uid()
    )
  );

create policy portfolio_write_own on public.professional_portfolio_items
  for all using (
    public.is_admin()
    or exists (
      select 1 from public.specialist_profiles sp
      where sp.id = specialist_profile_id and sp.user_id = auth.uid()
    )
  )
  with check (
    public.is_admin()
    or exists (
      select 1 from public.specialist_profiles sp
      where sp.id = specialist_profile_id and sp.user_id = auth.uid()
    )
  );
