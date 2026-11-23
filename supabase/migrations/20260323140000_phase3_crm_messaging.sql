-- CWG Phase 3: messaging, CRM, notifications

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create trigger conversations_set_updated_at
before update on public.conversations
for each row execute function public.set_updated_at();

create table public.conversation_members (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  joined_at timestamptz not null default timezone('utc', now()),
  unique (conversation_id, user_id)
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  sender_id uuid not null references public.users (id) on delete cascade,
  body text not null,
  sent_at timestamptz not null default timezone('utc', now()),
  read_at timestamptz
);

create table public.message_attachments (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.messages (id) on delete cascade,
  storage_path text not null,
  content_type text,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.message_reports (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.messages (id) on delete cascade,
  reporter_user_id uuid not null references public.users (id) on delete cascade,
  reason text not null,
  status text not null default 'open',
  created_at timestamptz not null default timezone('utc', now())
);

create table public.crm_clients (
  id uuid primary key default gen_random_uuid(),
  specialist_profile_id uuid not null references public.specialist_profiles (id) on delete cascade,
  grower_user_id uuid references public.users (id) on delete set null,
  display_name text not null,
  status public.crm_client_status not null default 'lead',
  email text,
  phone text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index crm_clients_specialist_grower_uidx
  on public.crm_clients (specialist_profile_id, grower_user_id)
  where grower_user_id is not null;

create trigger crm_clients_set_updated_at
before update on public.crm_clients
for each row execute function public.set_updated_at();

create table public.crm_client_notes (
  id uuid primary key default gen_random_uuid(),
  crm_client_id uuid not null references public.crm_clients (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create trigger crm_client_notes_set_updated_at
before update on public.crm_client_notes
for each row execute function public.set_updated_at();

create table public.crm_tasks (
  id uuid primary key default gen_random_uuid(),
  specialist_profile_id uuid not null references public.specialist_profiles (id) on delete cascade,
  crm_client_id uuid references public.crm_clients (id) on delete set null,
  title text not null,
  priority text not null default 'normal',
  due_at timestamptz,
  done_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.crm_service_records (
  id uuid primary key default gen_random_uuid(),
  crm_client_id uuid not null references public.crm_clients (id) on delete cascade,
  appointment_id uuid references public.appointments (id) on delete set null,
  summary text,
  occurred_on date,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.crm_attachments (
  id uuid primary key default gen_random_uuid(),
  crm_client_id uuid not null references public.crm_clients (id) on delete cascade,
  storage_path text not null,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  type text not null,
  payload jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.notification_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  channel text not null check (channel in ('push', 'in_app', 'email')),
  category text not null,
  enabled boolean not null default true,
  unique (user_id, channel, category)
);

create table public.push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  token text not null unique,
  platform text not null,
  updated_at timestamptz not null default timezone('utc', now())
);

-- RLS
alter table public.conversations enable row level security;
alter table public.conversation_members enable row level security;
alter table public.messages enable row level security;
alter table public.message_attachments enable row level security;
alter table public.message_reports enable row level security;
alter table public.crm_clients enable row level security;
alter table public.crm_client_notes enable row level security;
alter table public.crm_tasks enable row level security;
alter table public.crm_service_records enable row level security;
alter table public.crm_attachments enable row level security;
alter table public.notifications enable row level security;
alter table public.notification_preferences enable row level security;
alter table public.push_tokens enable row level security;

create or replace function public.is_conversation_member(p_conversation_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.conversation_members m
    where m.conversation_id = p_conversation_id and m.user_id = auth.uid()
  );
$$;

create policy conversation_members_own on public.conversation_members
  for all using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

create policy conversations_members on public.conversations
  for select using (public.is_conversation_member(id) or public.is_admin());

create policy messages_members on public.messages
  for all using (public.is_conversation_member(conversation_id) or public.is_admin())
  with check (
    (public.is_conversation_member(conversation_id) and sender_id = auth.uid())
    or public.is_admin()
  );

create policy message_attachments_members on public.message_attachments
  for select using (
    public.is_admin() or exists (
      select 1 from public.messages m
      where m.id = message_id and public.is_conversation_member(m.conversation_id)
    )
  );

create policy message_reports_insert on public.message_reports
  for insert with check (reporter_user_id = auth.uid());
create policy message_reports_admin on public.message_reports
  for select using (public.is_admin() or reporter_user_id = auth.uid());

create or replace function public.owns_crm_client(p_client_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.crm_clients c
    join public.specialist_profiles sp on sp.id = c.specialist_profile_id
    where c.id = p_client_id and sp.user_id = auth.uid()
  );
$$;

create policy crm_clients_owner on public.crm_clients
  for all using (
    public.is_admin() or exists (
      select 1 from public.specialist_profiles sp
      where sp.id = specialist_profile_id and sp.user_id = auth.uid()
    )
  ) with check (
    public.is_admin() or exists (
      select 1 from public.specialist_profiles sp
      where sp.id = specialist_profile_id and sp.user_id = auth.uid()
    )
  );

create policy crm_notes_owner on public.crm_client_notes
  for all using (public.is_admin() or public.owns_crm_client(crm_client_id))
  with check (public.is_admin() or public.owns_crm_client(crm_client_id));

create policy crm_tasks_owner on public.crm_tasks
  for all using (
    public.is_admin() or exists (
      select 1 from public.specialist_profiles sp
      where sp.id = specialist_profile_id and sp.user_id = auth.uid()
    )
  ) with check (
    public.is_admin() or exists (
      select 1 from public.specialist_profiles sp
      where sp.id = specialist_profile_id and sp.user_id = auth.uid()
    )
  );

create policy crm_service_records_owner on public.crm_service_records
  for all using (public.is_admin() or public.owns_crm_client(crm_client_id))
  with check (public.is_admin() or public.owns_crm_client(crm_client_id));

create policy crm_attachments_owner on public.crm_attachments
  for all using (public.is_admin() or public.owns_crm_client(crm_client_id))
  with check (public.is_admin() or public.owns_crm_client(crm_client_id));

create policy notifications_own on public.notifications
  for all using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

create policy notification_prefs_own on public.notification_preferences
  for all using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

create policy push_tokens_own on public.push_tokens
  for all using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

-- Private buckets (UI deferred for CRM/message attachments)
insert into storage.buckets (id, name, public, file_size_limit)
values
  ('crm-attachments', 'crm-attachments', false, 26214400),
  ('message-attachments', 'message-attachments', false, 26214400)
on conflict (id) do update set public = false;
