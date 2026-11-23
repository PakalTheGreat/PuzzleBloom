# CWG — Smoke checklist (Phases 1–4)

Run without inventing Supabase keys. With Docker: `npx supabase start && npx supabase db reset`, then fill `.env` from `supabase status`.

## Offline (always)

```bash
cd /home/ubuntu/cwg   # or clone orphan branch cwg/main
pnpm install
node scripts/smoke-check.mjs
pnpm --filter @cwg/web build
pnpm --filter @cwg/web dev   # http://127.0.0.1:3000
```

Expect config banners when env empty — UI must still render.

## With local/cloud Supabase

1. Sign up `/cadastrar` → confirm email if required → `/onboarding` (18+ + ToS + Privacy + role both).
2. Switch role (mobile) / use web as grower + specialist.
3. Edit specialist profile (mobile `/specialist-edit`); open `/tecnicos/[slug]`.
4. Submit verification (mobile); as admin (`user_roles.admin`) approve on `/admin`.
5. Grower: favorite + request service on public profile → `/solicitacoes` (specialist accept) → `/agendamentos` status → complete → mutual confirm → review.
6. Specialist: `/crm` create client → notes/tasks/history; `/calendario` rules; `/mensagens` thread.
7. `/admin/entitlements` shows Free/Pro/Premium + resolved feature keys (no reputation coupling).
8. `/docs/lgpd` notes readable.

## Mobile

```bash
pnpm --filter @cwg/mobile start
```

Tabs + stacks: solicitacoes, appointment-detail, crm, calendario, mensagens, favorites, verification.

## Non-goals (must remain absent)

- Cannabis product marketplace
- Public cultivation street addresses
- Fake Supabase URLs/keys in git
