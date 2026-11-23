import { CONFIG_MISSING_MESSAGE_PT } from "@cwg/api";

import { getPublicSupabaseEnv } from "@/lib/env";

export function ConfigBanner() {
  const { configured } = getPublicSupabaseEnv();
  if (configured) return null;
  return (
    <div className="border-b border-amber-300/60 bg-amber-50 px-4 py-2 text-center text-sm text-amber-950">
      {CONFIG_MISSING_MESSAGE_PT}
    </div>
  );
}
