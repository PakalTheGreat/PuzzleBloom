-- CWG Phase 1: identity (users, roles, profiles, organizations)

create table public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  full_name text,
  phone text,
  avatar_url text,
  locale text not null default 'pt-BR',
  timezone text not null default 'America/Sao_Paulo',
  active_role public.active_role,
  date_of_birth date,
  is_suspended boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create trigger users_set_updated_at
before update on public.users
for each row execute function public.set_updated_at();

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  role public.app_role not null,
  activated_at timestamptz not null default timezone('utc', now()),
  unique (user_id, role)
);

create index user_roles_user_id_idx on public.user_roles (user_id);

-- Admin / role helpers (after user_roles exists)
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles ur
    where ur.user_id = auth.uid()
      and ur.role = 'admin'
  );
$$;

create or replace function public.has_role(p_role text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles ur
    where ur.user_id = auth.uid()
      and ur.role = p_role::public.app_role
  );
$$;

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  legal_name text,
  document_ref text,
  city text,
  state text,
  region text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create trigger organizations_set_updated_at
before update on public.organizations
for each row execute function public.set_updated_at();

create table public.organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  member_role text not null default 'member',
  created_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, user_id)
);

create table public.grower_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users (id) on delete cascade,
  display_name text,
  organization_id uuid references public.organizations (id) on delete set null,
  city text,
  state text,
  region text,
  bio text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create trigger grower_profiles_set_updated_at
before update on public.grower_profiles
for each row execute function public.set_updated_at();

create table public.specialist_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users (id) on delete cascade,
  slug text not null unique,
  headline text,
  bio text,
  photo_url text,
  city text,
  state text,
  region text,
  offers_remote boolean not null default true,
  offers_in_person boolean not null default false,
  years_experience integer check (years_experience is null or years_experience between 0 and 60),
  verification_status public.verification_status not null default 'unverified',
  membership_started_at timestamptz,
  last_active_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index specialist_profiles_slug_idx on public.specialist_profiles (slug);
create index specialist_profiles_state_city_idx on public.specialist_profiles (state, city);
create index specialist_profiles_verification_status_idx on public.specialist_profiles (verification_status);
create index specialist_profiles_last_active_at_idx on public.specialist_profiles (last_active_at desc nulls last);

create trigger specialist_profiles_set_updated_at
before update on public.specialist_profiles
for each row execute function public.set_updated_at();

-- auth.users → public.users
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do update
    set email = excluded.email,
        updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- RLS
alter table public.users enable row level security;
alter table public.user_roles enable row level security;
alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.grower_profiles enable row level security;
alter table public.specialist_profiles enable row level security;

create policy users_select_own_or_admin on public.users
  for select using (id = auth.uid() or public.is_admin());

create policy users_update_own on public.users
  for update using (id = auth.uid())
  with check (id = auth.uid());

create policy user_roles_select_own_or_admin on public.user_roles
  for select using (user_id = auth.uid() or public.is_admin());

create policy user_roles_insert_own on public.user_roles
  for insert with check (
    user_id = auth.uid()
    and role in ('grower', 'specialist')
  );

create policy user_roles_admin_all on public.user_roles
  for all using (public.is_admin())
  with check (public.is_admin());

create policy grower_profiles_select_own_or_admin on public.grower_profiles
  for select using (user_id = auth.uid() or public.is_admin());

create policy grower_profiles_upsert_own on public.grower_profiles
  for all using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Public can read specialist profiles (directory / SEO); no private docs here
create policy specialist_profiles_select_public on public.specialist_profiles
  for select using (true);

create policy specialist_profiles_write_own on public.specialist_profiles
  for all using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

create policy organizations_select_member_or_admin on public.organizations
  for select using (
    public.is_admin()
    or exists (
      select 1 from public.organization_members m
      where m.organization_id = organizations.id and m.user_id = auth.uid()
    )
  );

create policy organization_members_select_own_or_admin on public.organization_members
  for select using (user_id = auth.uid() or public.is_admin());
