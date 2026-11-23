-- Coarse public service location (city-level) for nearby discovery.
-- NEVER store private cultivation street addresses here.

alter table public.specialist_profiles
  add column if not exists service_lat double precision,
  add column if not exists service_lng double precision;

comment on column public.specialist_profiles.service_lat is
  'Coarse service-area latitude (city centroid). Not a cultivation site address.';
comment on column public.specialist_profiles.service_lng is
  'Coarse service-area longitude (city centroid). Not a cultivation site address.';

create index if not exists specialist_profiles_service_coords_idx
  on public.specialist_profiles (service_lat, service_lng)
  where service_lat is not null and service_lng is not null;
