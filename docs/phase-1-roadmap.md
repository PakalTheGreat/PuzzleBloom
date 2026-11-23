# CWG — Phase 1 Roadmap (greenfield monorepo)

**Aligns with provisional PRD phases** (until Lucas pastes §22 remainder):

| Phase | Scope (provisional) |
| --- | --- |
| **1** | Monorepo + auth + roles + profiles + verification submit + web public directory/profile + mobile explore basics |
| 2 | Requests, appointments, calendar basics, favorites, reputation pipeline |
| 3 | CRM, messaging, push, subscriptions architecture, analytics |
| 4 | Admin, moderation, security/LGPD hardening, tests, deploy |

This document details **Phase 1 only**.

---

## Ordered build steps

1. **Confirm infra** — GitHub repo URL; create/link Supabase project; note project ref + regions (Brazil-friendly if available).
2. **Scaffold monorepo** — workspaces root; `apps/mobile` (Expo + Expo Router + TS); `apps/web` (Next.js App Router + TS + Tailwind); `packages/{shared,types,validation,api,ui}`; `supabase/{migrations,functions,seed}`.
3. **Design tokens** — graphite / deep green professional theme shared as tokens; wire mobile theme + web Tailwind; pt-BR baseline copy shell.
4. **Env & secrets pattern** — root `.env.example`; app-specific env files; no secrets in git (see list below).
5. **Core migrations (identity + professional + verification skeleton)** — `users`, `user_roles`, grower/specialist profiles, specialties M:N, credentials/service_areas stubs, verification request/document tables + private Storage bucket, RLS owner/admin.
6. **Supabase Auth** — email/password, session, recovery, email verification hooks; map `auth.users` → `public.users` trigger; SecureStore session on mobile; cookie/session on web.
7. **Onboarding** — age 18+ confirmation record; versioned ToS/Privacy acceptance; role select (find / offer / both); create role rows + empty profiles.
8. **Role switching** — persist `active_role`; mobile tab shells for grower vs specialist (Phase 1: mostly profile + explore stubs).
9. **Specialist profile edit (mobile)** — photo, headline, bio, region, remote/in-person, specialties, credentials basics, slug reservation.
10. **Verification submit** — upload docs to private bucket; status `pending_review`; public badge shows unverified/pending only (admin queue UI can wait for Phase 4; optional minimal admin SQL/seed for testing).
11. **Web public profile + directory** — ` /tecnicos/[slug]` SEO page; basic directory list/filters (specialty, state/city, verification); data from same Supabase tables.
12. **Mobile explore basics** — specialist cards, filter subset, open profile detail (in-app); deep link parity with web slug where feasible.
13. **Shared packages hardening** — Zod schemas for auth/profile/verification; typed API helpers used by both apps.
14. **Smoke checklist** — sign-up → dual roles → switch role → edit specialist profile → submit verification → view slug on web + mobile explore.

---

## Environment variables

### Shared / Supabase
| Variable | Used by | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | web | Supabase API URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | web | anon key (RLS-enforced) |
| `EXPO_PUBLIC_SUPABASE_URL` | mobile | same project URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | mobile | same anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Edge Functions / CI only | **never** ship to clients |
| `SUPABASE_JWT_SECRET` | server-only if needed | prefer project dashboard secrets |
| `DATABASE_URL` | migrations / local tooling | optional direct Postgres URL |

### Apps
| Variable | Used by | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | web | e.g. `https://cwg.com.br` for SEO/canonical |
| `EXPO_PUBLIC_SITE_URL` | mobile | web origin for share links |
| `EXPO_PUBLIC_APP_ENV` / `NEXT_PUBLIC_APP_ENV` | both | `development` \| `staging` \| `production` |

### Deferred (declare in `.env.example`, unused in Phase 1)
| Variable | Later use |
| --- | --- |
| `MERCADOPAGO_*` / payment secrets | live subscriptions |
| `GOOGLE_CALENDAR_*` | calendar sync |
| `GOOGLE_AUTH_*` | Google OAuth |
| `EXPO_ACCESS_TOKEN` / EAS secrets | push & builds (Phase 3+) |
| `RESEND_*` / SMTP | transactional email when implemented |

---

## Dependencies (baseline)

### Root
- pnpm (or npm) workspaces; TypeScript; optionally Turborepo

### `apps/mobile`
- `expo`, `expo-router`, `react-native`
- `@tanstack/react-query`, `react-hook-form`, `@hookform/resolvers`, `zod`
- `@supabase/supabase-js`, `expo-secure-store`
- `expo-image-picker` (avatar / verification docs)
- Expo Notifications **stub only** in Phase 1 (full push in Phase 3)

### `apps/web`
- `next`, `react`, `typescript`, `tailwindcss`
- `@supabase/supabase-js`, `@supabase/ssr`
- `zod`, shared form libs as needed

### `packages/*`
- `zod`, shared TS project references; no RN-only imports inside `packages/ui` consumed by web without care

### `supabase`
- Supabase CLI for migrations/functions locally

---

## Explicitly OUT of Phase 1

- Appointments / service requests / calendar booking
- Reviews & reputation pipeline
- Favorites (may stub UI; ship in Phase 2 per provisional plan)
- CRM (clients, notes, tasks)
- Messaging & attachments
- Push notification delivery
- Live payments / Mercado Pago
- Google Calendar / Google OAuth
- Full admin console (beyond optional seed/SQL verification for testing)
- Moderation tooling, LGPD deletion automation hardening (design OK; full Phase 4)
- Cannabis product commerce of any kind (permanent non-goal)

---

## Exit criteria

- Monorepo builds mobile + web against one Supabase project.
- User can register, accept legal/age gates, activate grower and/or specialist, switch roles.
- Specialist can edit public-facing profile fields and submit verification documents privately.
- Web `/tecnicos/[slug]` renders from DB; mobile explore lists specialists with basic filters.
- No recreational branding; no public cultivation addresses; no product marketplace surfaces.
