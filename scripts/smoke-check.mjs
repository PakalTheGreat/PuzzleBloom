#!/usr/bin/env node
/**
 * Offline smoke: ensures critical files/routes exist after Phase 1–4 bootstrap.
 * Does not call Supabase (no invented keys).
 */
import { existsSync } from "node:fs";
import { join } from "node:path";

const root = new URL("..", import.meta.url).pathname;
const required = [
  "apps/web/src/app/(auth)/entrar/page.tsx",
  "apps/web/src/app/onboarding/page.tsx",
  "apps/web/src/app/tecnicos/page.tsx",
  "apps/web/src/app/tecnicos/[slug]/page.tsx",
  "apps/web/src/app/admin/page.tsx",
  "apps/web/src/app/crm/page.tsx",
  "apps/web/src/app/crm/[id]/page.tsx",
  "apps/web/src/app/agendamentos/page.tsx",
  "apps/web/src/app/solicitacoes/page.tsx",
  "apps/web/src/app/calendario/page.tsx",
  "apps/web/src/app/mensagens/page.tsx",
  "apps/web/src/app/mensagens/[id]/page.tsx",
  "apps/web/src/app/favoritos/page.tsx",
  "packages/api/src/appointments.ts",
  "packages/api/src/crm.ts",
  "packages/api/src/calendar.ts",
  "packages/api/src/messaging.ts",
  "packages/api/src/favorites.ts",
  "apps/mobile/app/(auth)/entrar.tsx",
  "apps/mobile/app/onboarding.tsx",
  "apps/mobile/app/specialist-edit.tsx",
  "apps/mobile/app/verification.tsx",
  "packages/api/src/auth.ts",
  "packages/api/src/services.ts",
  "supabase/migrations/20260323120100_identity.sql",
  "supabase/migrations/20260323130000_phase2_services_reputation.sql",
  "supabase/migrations/20260323140000_phase3_crm_messaging.sql",
  "supabase/migrations/20260323150000_phase4_admin_lgpd.sql",
  "supabase/seed/seed.sql",
];

let failed = 0;
for (const rel of required) {
  const ok = existsSync(join(root, rel));
  console.log(`${ok ? "OK" : "MISSING"}  ${rel}`);
  if (!ok) failed += 1;
}
process.exit(failed ? 1 : 0);
