-- Allow authenticated users to create conversations they join

create policy conversations_insert_auth on public.conversations
  for insert with check (auth.uid() is not null);

create policy conversations_update_members on public.conversations
  for update using (public.is_conversation_member(id) or public.is_admin());

-- Specialists may insert profile_views for analytics when viewers hit public pages
-- (already have insert for any auth). Allow specialist self-select already covered.
