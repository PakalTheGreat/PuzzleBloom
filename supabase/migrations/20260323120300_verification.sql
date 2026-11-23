-- CWG Phase 1: verification skeleton + private storage bucket

create table public.verification_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  role_context public.active_role not null,
  legal_category text,
  specialty_id uuid references public.specialties (id) on delete set null,
  status public.verification_status not null default 'pending_review',
  submitted_at timestamptz not null default timezone('utc', now()),
  decided_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create trigger verification_requests_set_updated_at
before update on public.verification_requests
for each row execute function public.set_updated_at();

-- Only one pending_review request per (user_id, role_context)
create unique index verification_requests_one_pending_per_role
  on public.verification_requests (user_id, role_context)
  where status = 'pending_review';

create table public.verification_documents (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.verification_requests (id) on delete cascade,
  storage_path text not null,
  doc_type text not null,
  uploaded_at timestamptz not null default timezone('utc', now())
);

create table public.verification_reviews (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.verification_requests (id) on delete cascade,
  reviewer_id uuid not null references public.users (id) on delete restrict,
  decision public.verification_status not null,
  reason text,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.verification_status_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  from_status public.verification_status,
  to_status public.verification_status not null,
  actor_id uuid references public.users (id) on delete set null,
  note text,
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.verification_requests enable row level security;
alter table public.verification_documents enable row level security;
alter table public.verification_reviews enable row level security;
alter table public.verification_status_history enable row level security;

create policy verification_requests_select_own_or_admin on public.verification_requests
  for select using (user_id = auth.uid() or public.is_admin());

create policy verification_requests_insert_own on public.verification_requests
  for insert with check (user_id = auth.uid());

create policy verification_requests_update_own_pending on public.verification_requests
  for update using (
    (user_id = auth.uid() and status = 'pending_review')
    or public.is_admin()
  )
  with check (
    (user_id = auth.uid() and status in ('pending_review', 'unverified'))
    or public.is_admin()
  );

create policy verification_documents_select_own_or_admin on public.verification_documents
  for select using (
    public.is_admin()
    or exists (
      select 1 from public.verification_requests r
      where r.id = request_id and r.user_id = auth.uid()
    )
  );

create policy verification_documents_insert_own on public.verification_documents
  for insert with check (
    public.is_admin()
    or exists (
      select 1 from public.verification_requests r
      where r.id = request_id
        and r.user_id = auth.uid()
        and r.status = 'pending_review'
    )
  );

create policy verification_documents_delete_own_pending on public.verification_documents
  for delete using (
    public.is_admin()
    or exists (
      select 1 from public.verification_requests r
      where r.id = request_id
        and r.user_id = auth.uid()
        and r.status = 'pending_review'
    )
  );

create policy verification_reviews_admin_all on public.verification_reviews
  for all using (public.is_admin())
  with check (public.is_admin());

create policy verification_reviews_select_own_request on public.verification_reviews
  for select using (
    public.is_admin()
    or exists (
      select 1 from public.verification_requests r
      where r.id = request_id and r.user_id = auth.uid()
    )
  );

create policy verification_history_select_own_or_admin on public.verification_status_history
  for select using (user_id = auth.uid() or public.is_admin());

create policy verification_history_admin_insert on public.verification_status_history
  for insert with check (public.is_admin() or actor_id = auth.uid());

-- Private storage bucket for verification documents (never public ACL)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'verification-docs',
  'verification-docs',
  false,
  26214400,
  array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Path convention: {user_id}/{request_id}/{filename}
create policy verification_docs_storage_select on storage.objects
  for select using (
    bucket_id = 'verification-docs'
    and (
      public.is_admin()
      or (storage.foldername(name))[1] = auth.uid()::text
    )
  );

create policy verification_docs_storage_insert on storage.objects
  for insert with check (
    bucket_id = 'verification-docs'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy verification_docs_storage_update on storage.objects
  for update using (
    bucket_id = 'verification-docs'
    and (
      public.is_admin()
      or (storage.foldername(name))[1] = auth.uid()::text
    )
  );

create policy verification_docs_storage_delete on storage.objects
  for delete using (
    bucket_id = 'verification-docs'
    and (
      public.is_admin()
      or (storage.foldername(name))[1] = auth.uid()::text
    )
  );
