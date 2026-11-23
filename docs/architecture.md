# CWG — Architecture (revised, mobile-first monorepo)

**Product:** Connect With Growers (CWG)  
**Locale / currency:** pt-BR / BRL  
**Status:** Greenfield planning — supersedes Next-only v1 under `internal/superseded-v1/`  
**Source:** `/cursor/stores/self/docs/product-requirements.md`

---

## 1. Goals

- One brand, one Postgres, two client experiences (grower / specialist) with in-app role switch.
- **Mobile-first** Expo app is the primary product surface (CRM, agenda, discovery, messaging).
- Complementary **Next.js web** for landing, SEO public profiles (`/tecnicos/[slug]`), sharing, and admin.
- Reputation from real DB only; subscriptions never alter ratings, review counts, or verification.
- Not a cannabis product marketplace — no listings, sales, delivery, or payments for controlled materials.
- Professional SaaS visual language (graphite / deep green); no recreational cannabis aesthetics.

---

## 2. Monorepo layout

```
cwg/
├── apps/
│   ├── mobile/                 # Expo + Expo Router (primary)
│   └── web/                    # Next.js App Router (landing, public profiles, admin)
├── packages/
│   ├── shared/                 # constants, permissions, domain helpers
│   ├── types/                  # shared TypeScript types / DB row types
│   ├── validation/             # Zod schemas (forms + API payloads)
│   ├── api/                    # Supabase client factories + query/mutation helpers
│   └── ui/                     # design tokens + web-oriented primitives (mobile keeps RN UI)
├── supabase/
│   ├── migrations/             # SQL migrations (schema, RLS, indexes)
│   ├── functions/              # Edge Functions (webhooks, entitlement checks, etc.)
│   └── seed/                   # local/dev seed data
├── docs/                       # product + engineering docs (mirrored from Project store as needed)
├── package.json                # workspace root (pnpm or npm workspaces)
├── turbo.json                  # optional Turborepo pipelines
└── .env.example
```

Presentation layers stay independent; domain contracts live in `packages/*` so mobile CRM and web public profiles never diverge on types, Zod rules, or entitlement keys.

---

## 3. Stack

| Layer | Choice |
| --- | --- |
| Mobile | React Native, Expo, TypeScript, Expo Router, TanStack Query, React Hook Form, Zod, Expo Notifications, Expo SecureStore |
| Web | Next.js (App Router), TypeScript, Tailwind, reusable components |
| Backend | Supabase Auth, Postgres, Storage, Realtime, Edge Functions, RLS |
| Tooling | Monorepo workspaces; shared packages for types/validation/api |

---

## 4. System view

```
┌──────────────────────┐     ┌──────────────────────────────┐
│  apps/mobile (Expo)  │     │  apps/web (Next.js)          │
│  Grower + Specialist │     │  Landing /tecnicos/[slug]    │
│  CRM, Agenda, Chat   │     │  Admin console               │
└──────────┬───────────┘     └──────────────┬───────────────┘
           │  packages/{types,validation,api,shared}
           └──────────────┬──────────────────┘
                          │
              ┌───────────▼────────────┐
              │   Supabase project     │
              │  Auth · Postgres · RLS │
              │  Storage · Realtime    │
              │  Edge Functions        │
              └────────────────────────┘
```

Both apps authenticate against the same Supabase project and read/write the same tables under RLS. Public specialist pages on web use the same `specialist_profiles` + reputation aggregates as the mobile explore flow — no duplicate “web profile” store.

---

## 5. Role model & switching

- Identity = `auth.users` → `public.users` (app profile).
- Roles via `user_roles` (`grower` | `specialist` | `admin`); one account may hold grower **and** specialist.
- Grower/specialist data live in `grower_profiles` / `specialist_profiles` (1:1 with user when activated).
- Clients persist `active_role` (SecureStore on mobile; cookie/local preference on web).
- UI always reflects the active role (nav tabs, dashboards, CTAs). Switching does **not** re-auth.
- Admin is web-only and backend-enforced (`user_roles` + RLS / Edge Function checks).

---

## 6. Apps responsibilities

### `apps/mobile` (primary)

| Active role | Surfaces |
| --- | --- |
| Specialist | Dashboard, Agenda, Clientes (CRM), Solicitações, Perfil (+ messages, tasks, settings) |
| Grower | Explorar, Favoritos, Agendamentos, Mensagens, Perfil |

Owns: onboarding/role activation, verification **submit**, discovery filters, appointments lifecycle, CRM (notes/tasks/clients), messaging, push prefs, subscription status UI (entitlements read-only until payments go live).

### `apps/web` (complementary)

- Marketing landing + legal pages.
- Public directory / SEO profile: `cwg.com.br/tecnicos/[slug]` (works without app install).
- Shareable deep links into mobile where installed.
- Admin: users, verification queue, moderation, specialties, config, subscriptions overview, audit logs.

---

## 7. Shared packages

| Package | Role |
| --- | --- |
| `packages/types` | Entity DTOs, enum unions, appointment status, verification status |
| `packages/validation` | Zod for auth, profiles, requests, reviews, CRM forms |
| `packages/api` | Typed Supabase helpers; React Query keys/fns where shareable |
| `packages/shared` | Entitlement keys, permission helpers, Brazil format utils, constants |
| `packages/ui` | Web tokens/primitives; mobile uses RN StyleSheet/theme mapped to same tokens |

Invariant: **subscriptions never map to reputation fields** — entitlement checks gate CRM limits / visibility features only.

---

## 8. Supabase & data boundaries

- Single project for mobile + web.
- **Private Storage buckets:** verification documents, CRM attachments (later), message attachments (later). Access via short-lived signed URLs; never public ACLs.
- **Public-ish assets:** specialist avatar/portfolio only when explicitly marked public.
- Realtime: messaging + appointment/request updates for authenticated participants.
- Edge Functions (as needed): entitlement evaluation stubs, admin-only ops, deletion workflows, future payment webhooks.

### What must never be public

- ID / authorization documents, full legal authorizations.
- Exact cultivation addresses or site locations.
- CRM notes, internal admin notes, verification review notes.
- Private message contents to non-participants / unrestricted admin by default.

---

## 9. RLS / security / LGPD (summary)

- RLS on every private table; deny-by-default.
- Growers see own profile + public specialist surfaces; specialists see own CRM/clients only.
- Conversation members only for messages; report/block without exposing blocked users’ private data.
- Reviews: insert only after eligible confirmation; no self-review; unique per appointment/external record.
- Verification docs: owner upload + admin reviewers; public clients see **badge/status only**.
- Minimization: no cultivation geolocation in public schema; age 18+ and ToS/Privacy acceptances versioned with audit metadata.
- Account deletion requests → workflow + audit; secrets never in git.
- Legal review required before production launch.

---

## 10. Subscription entitlements approach

- Plans: Free / Pro (~R$49.90) / Premium (~R$99.90) — amounts configurable in DB.
- Tables: `subscription_plans`, `plan_features`, `subscriptions`, `payments`, `subscription_events`.
- Runtime: resolve active plan → feature flags/limits (e.g. CRM client cap, analytics depth). Free remains usable with limited CRM.
- **Hard rules:** expiry does not delete reputation, reviews, history, or verification; paid visibility (if introduced) is explicitly labeled; payments processing is deferred but schema + entitlement resolver ship early.

---

## 11. Deferred (architecture hooks only)

| Deferred | Phase intent | Hook |
| --- | --- | --- |
| Live payments (Mercado Pago / similar) | After subscriptions architecture | `payments`, webhook Edge Function stubs |
| Google Calendar sync | Post-MVP | External calendar IDs nullable on availability/appointments |
| Message & CRM file attachments | Later | Storage buckets + `*_attachments` tables exist conceptually; UI later |
| Google OAuth | Later | Auth provider flag; email/password first |
| Paid ranking / boosted visibility | Optional later | Separate from reputation aggregates |

---

## 12. Design system direction

- Tokens: neutral backgrounds, dark graphite / deep green, one clear accent, moderate radius, subtle elevation.
- Typography: clean professional SaaS (not recreational / “stoner” cues).
- Mobile-first spacing; explicit loading / empty / error / success states.
- Formats: pt-BR copy, BRL, Brazilian phone/date/address helpers in `packages/shared`.

---

## 13. Open infrastructure decisions

- GitHub repository URL (not yet confirmed).
- Supabase project / org (not yet provisioned in docs).
- Exact §22+ phase wording if Lucas pastes remainder (provisional phases used until then).
