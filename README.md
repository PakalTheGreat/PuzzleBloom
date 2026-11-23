# CWG — Connect With Growers

**pt-BR:** Plataforma mobile-first que conecta cultivadores/organizações legalmente autorizados a especialistas técnicos no Brasil. Não é marketplace de produtos.

**EN:** Mobile-first professional services & reputation platform connecting legally authorized Brazilian growers with qualified specialists. Not a cannabis product marketplace.

## Stack

| Layer | Choice |
| --- | --- |
| Mobile (primary) | Expo + Expo Router + TypeScript |
| Web | Next.js App Router + Tailwind |
| Backend | Supabase (Auth, Postgres, RLS, Storage, Edge Functions) |
| Monorepo | pnpm workspaces + Turborepo |

```
cwg/
├── apps/mobile          # Expo (grower + specialist)
├── apps/web             # Landing + /tecnicos/[slug]
├── packages/{shared,types,validation,api,ui}
├── supabase/{migrations,functions,seed}
└── docs/
```

## Quick start

```bash
pnpm install
cp .env.example .env   # fill Supabase URL + anon key after link

# Web
pnpm dev:web

# Mobile
pnpm dev:mobile
```

## Supabase

Local migrations ship under `supabase/migrations/`. If no hosted project is linked yet:

```bash
npx supabase login
npx supabase projects create cwg --org-id <YOUR_ORG_ID> --region sa-east-1
npx supabase link --project-ref <PROJECT_REF>
npx supabase db push
npx supabase db seed   # or apply seed/seed.sql manually
```

See `docs/supabase-setup.md` for details.

## Design

Professional SaaS: deep green / graphite. No recreational cannabis aesthetics. Locale: pt-BR · Currency: BRL.

## Phase 1 scope

Monorepo foundation, auth/roles/profiles, verification submit skeleton, web public profile stub, mobile role-switch nav shells. Appointments, CRM, messaging, and payments come later.
