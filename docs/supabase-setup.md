# Supabase setup (CWG)

## If a hosted project was NOT created by the agent

```bash
# 1) Login (browser)
npx supabase login

# 2) Create project (Brazil-friendly region when available)
npx supabase projects create cwg \
  --org-id <YOUR_ORG_ID> \
  --region sa-east-1 \
  --db-password <STRONG_PASSWORD>

# 3) Link local repo
npx supabase link --project-ref <PROJECT_REF>

# 4) Push migrations
npx supabase db push

# 5) Seed specialties + plans
npx supabase db query --file supabase/seed/seed.sql
# or: psql "$DATABASE_URL" -f supabase/seed/seed.sql
```

List orgs: `npx supabase orgs list`  
List projects: `npx supabase projects list`

## Env after link

Copy project URL + anon key into root `.env` (see `.env.example`):

- `NEXT_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` / `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- Keep `SUPABASE_SERVICE_ROLE_KEY` server-only

## Local stack (optional)

```bash
npx supabase start
npx supabase db reset   # applies migrations + seed
```

## Migrations (Phase 1)

| File | Contents |
| --- | --- |
| `20260323120000_extensions_helpers_enums.sql` | pgcrypto, enums, updated_at |
| `20260323120100_identity.sql` | users, roles, profiles, orgs, auth→users trigger, RLS |
| `20260323120200_professional.sql` | specialties M:N, credentials, areas, portfolio |
| `20260323120300_verification.sql` | verification tables + private `verification-docs` bucket |
| `20260323120400_subscriptions_legal.sql` | plans/features/subscriptions + legal stubs |
| `20260323120500_phase2plus_stubs_comments.sql` | deferred Phase 2+ notes |
