-- CWG Phase 1: extensions, shared helpers, enums

create extension if not exists "pgcrypto";

-- updated_at helper
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

-- Note: is_admin() / has_role() are created in identity migration after user_roles.

do $$ begin
  create type public.app_role as enum ('grower', 'specialist', 'admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.active_role as enum ('grower', 'specialist');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.verification_status as enum (
    'unverified',
    'pending_review',
    'verified',
    'rejected',
    'suspended',
    'expired'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.service_mode as enum ('remote', 'in_person');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.appointment_status as enum (
    'pending',
    'accepted',
    'awaiting_confirmation',
    'confirmed',
    'completed',
    'cancelled_by_grower',
    'cancelled_by_specialist',
    'rejected',
    'expired'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.crm_client_status as enum ('lead', 'active', 'inactive', 'archived');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.subscription_plan_code as enum ('free', 'pro', 'premium');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.subscription_status as enum (
    'trialing',
    'active',
    'past_due',
    'cancelled',
    'expired'
  );
exception when duplicate_object then null; end $$;
