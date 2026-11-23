# CWG — Connect With Growers

Mobile-first professional services and reputation platform connecting legally authorized cannabis growers/organizations with qualified technical specialists in Brazil.

**Positioning:** Superprof discovery + LinkedIn reputation + lightweight CRM + marketplace scheduling. Not a cannabis product marketplace.

## One brand, two experiences
Same app and database. One identity, multiple role profiles (grower and/or specialist). Clear role switch without re-login.

- **Grower:** discover specialists, favorites, requests, appointments, messages, history
- **Specialist:** professional profile, reputation, requests, calendar, CRM, tasks, analytics, subscription

## Platforms
- **Primary:** React Native + Expo + Expo Router + TypeScript (Android/iOS)
- **Complementary web:** Next.js + TypeScript + Tailwind — landing, public profiles/SEO, admin, sharing
- **Backend:** single Supabase (Auth, Postgres, Storage, Realtime, Edge Functions, RLS)
- **Monorepo:** `apps/mobile`, `apps/web`, `packages/*` (shared types, validation, api, domain), `supabase/`, `docs/`

## Core differentiators
1. Shareable public specialist profile (`cwg.com.br/tecnicos/[slug]`) with verified reputation only
2. Specialist CRM (clients, notes, service history, tasks) — private, mobile-first
3. Calendar/availability and appointment state machine
4. Reviews only after mutual confirmation; external services clearly separated
5. Freemium for specialists; reputation/history never held hostage by subscription

## Non-goals
- Product listings/transactions for cannabis or controlled materials
- Invasive lock-in against off-platform contact
- Google Calendar (design for later; not MVP)
- Live payments until later phase (architecture ready)

## Design
pt-BR, BRL, Brazil formatting. Professional SaaS look: neutral backgrounds, dark graphite / deep green, restrained accent. No recreational cannabis aesthetics.

## Trust
18+ confirmation (recorded, not sufficient alone). Versioned ToS/Privacy acceptance. Configurable verification workflows; admin review; private document storage; badge ≠ government endorsement.

## Architecture docs (current)
- `/cursor/stores/self/docs/architecture.md` — mobile-first monorepo (Expo + Next + shared packages + Supabase)
- `/cursor/stores/self/docs/database-schema.md` — refined schema + RLS outlines
- `/cursor/stores/self/docs/phase-1-roadmap.md` — Phase 1 build order

Superseded Next-only plan archived under `/cursor/stores/self/internal/superseded-v1/` — do not reuse.

## Repo
TBD — awaiting Lucas confirmation of GitHub repository and Supabase project.

## Source brief
Full PRD (sections 1–21; §22 truncated in chat): see `/cursor/stores/self/docs/product-requirements.md`. Provisional phases used until §22 remainder arrives.
