-- CWG Phase 4: moderation / LGPD extras + appointment transition helper

create table if not exists public.user_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_user_id uuid not null references public.users (id) on delete cascade,
  subject_user_id uuid not null references public.users (id) on delete cascade,
  reason text not null,
  status text not null default 'open',
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.review_moderation_events (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references public.reviews (id) on delete cascade,
  actor_id uuid references public.users (id) on delete set null,
  action text not null,
  note text,
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.user_reports enable row level security;
alter table public.review_moderation_events enable row level security;

create policy user_reports_insert on public.user_reports
  for insert with check (reporter_user_id = auth.uid());
create policy user_reports_select on public.user_reports
  for select using (public.is_admin() or reporter_user_id = auth.uid());

create policy review_moderation_admin on public.review_moderation_events
  for all using (public.is_admin()) with check (public.is_admin());

-- Appointment status transition guard (basic)
create or replace function public.assert_appointment_transition()
returns trigger
language plpgsql
as $$
declare
  allowed text[];
begin
  if old.status = new.status then
    return new;
  end if;
  if old.status in ('completed', 'rejected', 'expired', 'cancelled_by_grower', 'cancelled_by_specialist') then
    raise exception 'status terminal: %', old.status;
  end if;
  case old.status
    when 'pending' then
      allowed := array['accepted','rejected','cancelled_by_grower','cancelled_by_specialist','expired','awaiting_confirmation'];
    when 'accepted' then
      allowed := array['awaiting_confirmation','confirmed','cancelled_by_grower','cancelled_by_specialist','expired'];
    when 'awaiting_confirmation' then
      allowed := array['confirmed','cancelled_by_grower','cancelled_by_specialist','expired'];
    when 'confirmed' then
      allowed := array['completed','cancelled_by_grower','cancelled_by_specialist'];
    else
      allowed := array[]::text[];
  end case;
  if not (new.status::text = any(allowed)) then
    raise exception 'transição inválida: % -> %', old.status, new.status;
  end if;
  return new;
end;
$$;

drop trigger if exists appointments_status_guard on public.appointments;
create trigger appointments_status_guard
before update of status on public.appointments
for each row execute function public.assert_appointment_transition();

-- Entitlement resolver stub (never writes reputation)
create or replace function public.resolve_plan_feature(
  p_specialist_profile_id uuid,
  p_feature_key text
) returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select pf.feature_value
      from public.subscriptions s
      join public.plan_features pf on pf.plan_id = s.plan_id
      where s.specialist_profile_id = p_specialist_profile_id
        and s.status in ('active', 'trialing')
        and pf.feature_key = p_feature_key
      order by s.updated_at desc
      limit 1
    ),
    (
      select pf.feature_value
      from public.subscription_plans sp
      join public.plan_features pf on pf.plan_id = sp.id
      where sp.code = 'free' and pf.feature_key = p_feature_key
      limit 1
    )
  );
$$;
