-- CWG Phase 1: subscription plans + legal acceptance stubs
-- Live payments deferred; schema ready. Subscriptions NEVER write reputation.

create table public.subscription_plans (
  id uuid primary key default gen_random_uuid(),
  code public.subscription_plan_code not null unique,
  name_pt text not null,
  price_brl numeric(12, 2) not null default 0,
  currency text not null default 'BRL',
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create trigger subscription_plans_set_updated_at
before update on public.subscription_plans
for each row execute function public.set_updated_at();

create table public.plan_features (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.subscription_plans (id) on delete cascade,
  feature_key text not null,
  feature_value text not null,
  unique (plan_id, feature_key)
);

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  specialist_profile_id uuid not null references public.specialist_profiles (id) on delete cascade,
  plan_id uuid not null references public.subscription_plans (id) on delete restrict,
  status public.subscription_status not null default 'active',
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create trigger subscriptions_set_updated_at
before update on public.subscriptions
for each row execute function public.set_updated_at();

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  subscription_id uuid references public.subscriptions (id) on delete set null,
  specialist_profile_id uuid not null references public.specialist_profiles (id) on delete cascade,
  provider text,
  provider_ref text,
  amount_brl numeric(12, 2) not null,
  currency text not null default 'BRL',
  status text not null default 'pending',
  paid_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.subscription_events (
  id uuid primary key default gen_random_uuid(),
  subscription_id uuid references public.subscriptions (id) on delete set null,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.terms_acceptances (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  document_version text not null,
  accepted_at timestamptz not null default timezone('utc', now()),
  ip text,
  user_agent text
);

create table public.privacy_consents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  document_version text not null,
  accepted_at timestamptz not null default timezone('utc', now()),
  ip text,
  user_agent text
);

create table public.age_confirmations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  confirmed_18_plus boolean not null default true,
  confirmed_at timestamptz not null default timezone('utc', now()),
  unique (user_id)
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.users (id) on delete set null,
  action text not null,
  entity_type text,
  entity_id uuid,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.account_deletion_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  status text not null default 'pending',
  processed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.subscription_plans enable row level security;
alter table public.plan_features enable row level security;
alter table public.subscriptions enable row level security;
alter table public.payments enable row level security;
alter table public.subscription_events enable row level security;
alter table public.terms_acceptances enable row level security;
alter table public.privacy_consents enable row level security;
alter table public.age_confirmations enable row level security;
alter table public.audit_logs enable row level security;
alter table public.account_deletion_requests enable row level security;

create policy subscription_plans_select_all on public.subscription_plans
  for select using (is_active = true or public.is_admin());

create policy plan_features_select_all on public.plan_features
  for select using (true);

create policy subscriptions_select_own_or_admin on public.subscriptions
  for select using (
    public.is_admin()
    or exists (
      select 1 from public.specialist_profiles sp
      where sp.id = specialist_profile_id and sp.user_id = auth.uid()
    )
  );

create policy payments_select_own_or_admin on public.payments
  for select using (
    public.is_admin()
    or exists (
      select 1 from public.specialist_profiles sp
      where sp.id = specialist_profile_id and sp.user_id = auth.uid()
    )
  );

create policy subscription_events_admin_select on public.subscription_events
  for select using (public.is_admin());

create policy terms_acceptances_own on public.terms_acceptances
  for all using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

create policy privacy_consents_own on public.privacy_consents
  for all using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

create policy age_confirmations_own on public.age_confirmations
  for all using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

create policy audit_logs_admin_select on public.audit_logs
  for select using (public.is_admin());

create policy deletion_requests_own on public.account_deletion_requests
  for all using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());
