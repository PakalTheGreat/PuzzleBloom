import { NextResponse } from "next/server";

import { recordCultivationAuthorization } from "@cwg/api";

import { createClient } from "@/lib/supabase/server";

/**
 * Supabase Google OAuth redirect handler.
 * After exchange, best-effort records cultivation-authorization acceptance
 * if the client sent the pre-auth cookie (document_version match).
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") || "/conta";

  if (code) {
    const client = await createClient();
    if (client) {
      await client.auth.exchangeCodeForSession(code);
      const {
        data: { user },
      } = await client.auth.getUser();
      if (user) {
        const ua = request.headers.get("user-agent") ?? undefined;
        await recordCultivationAuthorization(client, user.id, {
          user_agent: ua,
        }).catch(() => null);
      }
    }
  }

  return NextResponse.redirect(new URL(next, url.origin));
}
