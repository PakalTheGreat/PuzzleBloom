-- CWG Phase 2: discovery, services/calendar, reputation

create table public.saved_specialists (
  id uuid primary key default gen_random_uuid(),
  grower_user_id uuid not null references public.users (id) on delete cascade,
  specialist_profile_id uuid not null references public.specialist_profiles (id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  unique (grower_user_id, specialist_profile_id)
);

create table public.profile_views (
  id uuid primary key default gen_random_uuid(),
  specialist_profile_id uuid not null references public.specialist_profiles (id) on delete cascade,
  viewer_user_id uuid references public.users (id) on delete set null,
  viewed_at timestamptz not null default timezone('utc', now()),
  source text not null default 'mobile' check (source in ('mobile', 'web'))
);

create table public.service_categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name_pt text not null,
  description_pt text,
  is_active boolean not null default true,
  sort_order integer not null default 0
);

create table public.service_requests (
  id uuid primary key default gen_random_uuid(),
  grower_user_id uuid not null references public.users (id) on delete cascade,
  specialist_profile_id uuid not null references public.specialist_profiles (id) on delete cascade,
  category_id uuid references public.service_categories (id) on delete set null,
  mode public.service_mode not null default 'remote',
  message text,
  preferred_windows jsonb not null default '[]'::jsonb,
  status text not null default 'pending',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create trigger service_requests_set_updated_at
before update on public.service_requests
for each row execute function public.set_updated_at();

create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  service_request_id uuid references public.service_requests (id) on delete set null,
  grower_user_id uuid not null references public.users (id) on delete cascade,
  specialist_profile_id uuid not null references public.specialist_profiles (id) on delete cascade,
  mode public.service_mode not null default 'remote',
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  timezone text not null default 'America/Sao_Paulo',
  status public.appointment_status not null default 'pending',
  location_summary text,
  external_calendar_event_id text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  check (ends_at > starts_at)
);

create trigger appointments_set_updated_at
before update on public.appointments
for each row execute function public.set_updated_at();

create index appointments_specialist_time_idx on public.appointments (specialist_profile_id, starts_at, ends_at);

create table public.availability_rules (
  id uuid primary key default gen_random_uuid(),
  specialist_profile_id uuid not null references public.specialist_profiles (id) on delete cascade,
  weekday smallint not null check (weekday between 0 and 6),
  start_time time not null,
  end_time time not null,
  mode public.service_mode,
  external_calendar_event_id text,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.availability_exceptions (
  id uuid primary key default gen_random_uuid(),
  specialist_profile_id uuid not null references public.specialist_profiles (id) on delete cascade,
  exception_date date not null,
  is_unavailable boolean not null default true,
  start_time time,
  end_time time,
  note text,
  external_calendar_event_id text,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.external_service_records (
  id uuid primary key default gen_random_uuid(),
  specialist_profile_id uuid not null references public.specialist_profiles (id) on delete cascade,
  counterparty_user_id uuid not null references public.users (id) on delete cascade,
  occurred_on date not null,
  summary text,
  status text not null default 'pending_confirmation',
  created_at timestamptz not null default timezone('utc', now())
);

create table public.service_confirmations (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid references public.appointments (id) on delete cascade,
  external_service_record_id uuid references public.external_service_records (id) on delete cascade,
  grower_confirmed_at timestamptz,
  specialist_confirmed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  check (
    (appointment_id is not null and external_service_record_id is null)
    or (appointment_id is null and external_service_record_id is not null)
  )
);

create unique index service_confirmations_appointment_uidx
  on public.service_confirmations (appointment_id) where appointment_id is not null;
create unique index service_confirmations_external_uidx
  on public.service_confirmations (external_service_record_id) where external_service_record_id is not null;

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  author_user_id uuid not null references public.users (id) on delete cascade,
  specialist_profile_id uuid not null references public.specialist_profiles (id) on delete cascade,
  appointment_id uuid references public.appointments (id) on delete restrict,
  external_service_record_id uuid references public.external_service_records (id) on delete restrict,
  origin text not null check (origin in ('app', 'external')),
  score_professionalism smallint not null check (score_professionalism between 1 and 5),
  score_communication smallint not null check (score_communication between 1 and 5),
  score_punctuality smallint not null check (score_punctuality between 1 and 5),
  score_technical smallint not null check (score_technical between 1 and 5),
  score_organization smallint not null check (score_organization between 1 and 5),
  overall_score numeric(3, 2) generated always as (
    (score_professionalism + score_communication + score_punctuality + score_technical + score_organization) / 5.0
  ) stored,
  body text,
  created_at timestamptz not null default timezone('utc', now()),
  check (
    (origin = 'app' and appointment_id is not null and external_service_record_id is null)
    or (origin = 'external' and external_service_record_id is not null and appointment_id is null)
  )
);

create unique index reviews_appointment_uidx on public.reviews (appointment_id) where appointment_id is not null;
create unique index reviews_external_uidx on public.reviews (external_service_record_id) where external_service_record_id is not null;

create table public.review_responses (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null unique references public.reviews (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create trigger review_responses_set_updated_at
before update on public.review_responses
for each row execute function public.set_updated_at();

create table public.review_reports (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references public.reviews (id) on delete cascade,
  reporter_user_id uuid not null references public.users (id) on delete cascade,
  reason text not null,
  status text not null default 'open',
  created_at timestamptz not null default timezone('utc', now())
);

-- RLS
alter table public.saved_specialists enable row level security;
alter table public.profile_views enable row level security;
alter table public.service_categories enable row level security;
alter table public.service_requests enable row level security;
alter table public.appointments enable row level security;
alter table public.availability_rules enable row level security;
alter table public.availability_exceptions enable row level security;
alter table public.external_service_records enable row level security;
alter table public.service_confirmations enable row level security;
alter table public.reviews enable row level security;
alter table public.review_responses enable row level security;
alter table public.review_reports enable row level security;

create policy saved_specialists_own on public.saved_specialists
  for all using (grower_user_id = auth.uid() or public.is_admin())
  with check (grower_user_id = auth.uid() or public.is_admin());

create policy profile_views_insert_any_auth on public.profile_views
  for insert with check (auth.uid() is not null);
create policy profile_views_select_owner_or_admin on public.profile_views
  for select using (
    public.is_admin()
    or exists (
      select 1 from public.specialist_profiles sp
      where sp.id = specialist_profile_id and sp.user_id = auth.uid()
    )
  );

create policy service_categories_select on public.service_categories
  for select using (is_active or public.is_admin());
create policy service_categories_admin on public.service_categories
  for all using (public.is_admin()) with check (public.is_admin());

create policy service_requests_participants on public.service_requests
  for all using (
    public.is_admin()
    or grower_user_id = auth.uid()
    or exists (
      select 1 from public.specialist_profiles sp
      where sp.id = specialist_profile_id and sp.user_id = auth.uid()
    )
  )
  with check (
    public.is_admin()
    or grower_user_id = auth.uid()
    or exists (
      select 1 from public.specialist_profiles sp
      where sp.id = specialist_profile_id and sp.user_id = auth.uid()
    )
  );

create policy appointments_participants on public.appointments
  for all using (
    public.is_admin()
    or grower_user_id = auth.uid()
    or exists (
      select 1 from public.specialist_profiles sp
      where sp.id = specialist_profile_id and sp.user_id = auth.uid()
    )
  )
  with check (
    public.is_admin()
    or grower_user_id = auth.uid()
    or exists (
      select 1 from public.specialist_profiles sp
      where sp.id = specialist_profile_id and sp.user_id = auth.uid()
    )
  );

create policy availability_rules_public_read on public.availability_rules for select using (true);
create policy availability_rules_write_own on public.availability_rules
  for all using (
    public.is_admin() or exists (
      select 1 from public.specialist_profiles sp where sp.id = specialist_profile_id and sp.user_id = auth.uid()
    )
  ) with check (
    public.is_admin() or exists (
      select 1 from public.specialist_profiles sp where sp.id = specialist_profile_id and sp.user_id = auth.uid()
    )
  );

create policy availability_exceptions_public_read on public.availability_exceptions for select using (true);
create policy availability_exceptions_write_own on public.availability_exceptions
  for all using (
    public.is_admin() or exists (
      select 1 from public.specialist_profiles sp where sp.id = specialist_profile_id and sp.user_id = auth.uid()
    )
  ) with check (
    public.is_admin() or exists (
      select 1 from public.specialist_profiles sp where sp.id = specialist_profile_id and sp.user_id = auth.uid()
    )
  );

create policy external_records_participants on public.external_service_records
  for all using (
    public.is_admin()
    or counterparty_user_id = auth.uid()
    or exists (select 1 from public.specialist_profiles sp where sp.id = specialist_profile_id and sp.user_id = auth.uid())
  )
  with check (
    public.is_admin()
    or counterparty_user_id = auth.uid()
    or exists (select 1 from public.specialist_profiles sp where sp.id = specialist_profile_id and sp.user_id = auth.uid())
  );

create policy service_confirmations_participants on public.service_confirmations
  for all using (auth.uid() is not null)
  with check (auth.uid() is not null);

create policy reviews_select_public on public.reviews for select using (true);
create policy reviews_insert_author on public.reviews
  for insert with check (author_user_id = auth.uid());

create policy review_responses_select on public.review_responses for select using (true);
create policy review_responses_write_specialist on public.review_responses
  for all using (
    public.is_admin() or exists (
      select 1 from public.reviews r
      join public.specialist_profiles sp on sp.id = r.specialist_profile_id
      where r.id = review_id and sp.user_id = auth.uid()
    )
  ) with check (
    public.is_admin() or exists (
      select 1 from public.reviews r
      join public.specialist_profiles sp on sp.id = r.specialist_profile_id
      where r.id = review_id and sp.user_id = auth.uid()
    )
  );

create policy review_reports_insert on public.review_reports
  for insert with check (reporter_user_id = auth.uid());
create policy review_reports_admin on public.review_reports
  for select using (public.is_admin() or reporter_user_id = auth.uid());
