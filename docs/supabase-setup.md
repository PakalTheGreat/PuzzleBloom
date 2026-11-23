# Supabase setup (CWG)

## Local (preferred until cloud credentials exist)

Requires Docker. On this cloud agent VM Docker was **not** available (`docker: command not found`), so migrations ship unapplied until a machine with Docker or a linked cloud project is used.

```bash
npx supabase start
npx supabase db reset   # applies all migrations + seed/seed.sql
```

## Hosted project (when you have CLI login / SUPABASE_ACCESS_TOKEN)

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

# 5) Seed specialties + plans + service categories
npx supabase db query --file supabase/seed/seed.sql
# or: psql "$DATABASE_URL" -f supabase/seed/seed.sql
```

List orgs: `npx supabase orgs list`  
List projects: `npx supabase projects list`

**Never invent** project URLs or anon/service keys — copy from the dashboard after create/link.

## Env after link

Copy project URL + anon key into root `.env` (see `.env.example`):

- `NEXT_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` / `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- Keep `SUPABASE_SERVICE_ROLE_KEY` server-only
- `NEXT_PUBLIC_PLAY_STORE_URL` / `EXPO_PUBLIC_PLAY_STORE_URL` — Google Play listing (placeholder `br.com.cwg.app` until the real app id exists)
- `NEXT_PUBLIC_SITE_URL` — used as OAuth redirect base (`/auth/callback`)

## Google OAuth (login / signup)

1. Supabase Dashboard → **Authentication → Providers → Google** → enable.
2. Create OAuth credentials in Google Cloud Console (Web application).
3. Authorized redirect URI (required): `{SUPABASE_URL}/auth/v1/callback`
4. Paste Client ID + Client Secret into the Supabase Google provider form.
5. App callback after Supabase exchange: `{NEXT_PUBLIC_SITE_URL}/auth/callback` (web) / Expo deep link `cwg://auth/callback` when native.
6. Without Supabase env, the apps run **demo mode** and simulate Google via a consent step + `google` persona (`google.user@demo.cwg`).

Pre-auth **declaração de autorização aplicável** is required before email or Google auth. In real mode, acceptance is stored in `terms_acceptances` with `document_version = LEGAL_VERSIONS.cultivationAuthorization` (`2026-11-23`). The platform does **not** validate licenses.

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
| `20260323120500_phase2plus_stubs_comments.sql` | historical placeholder (superseded) |
| `20260323130000_phase2_services_reputation.sql` | favorites, requests, appointments, reviews |
| `20260323140000_phase3_crm_messaging.sql` | CRM, messaging, notifications, private buckets |
| `20260323150000_phase4_admin_lgpd.sql` | reports, status guards, entitlement RPC |
| `20260323160000_specialist_service_coords.sql` | coarse `service_lat` / `service_lng` for nearby discovery |
