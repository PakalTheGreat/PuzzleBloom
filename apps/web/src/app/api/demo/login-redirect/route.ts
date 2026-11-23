import { NextResponse, type NextRequest } from "next/server";

import { DEMO_PERSONAS, type DemoPersona } from "@/lib/demo/data";
import { demoCookieOptions, encodeDemoSession } from "@/lib/demo/session";
import { DEMO_COOKIE } from "@/lib/demo/types";
import { getPublicSupabaseEnv } from "@/lib/env";

export async function GET(request: NextRequest) {
  if (getPublicSupabaseEnv().configured) {
    const dest = new URL("/entrar", request.url);
    return NextResponse.redirect(dest);
  }

  const persona = (request.nextUrl.searchParams.get("persona") ||
    "specialist") as DemoPersona;
  const nextRaw = request.nextUrl.searchParams.get("next") || "/conta";
  const nextPath = nextRaw.startsWith("/") ? nextRaw.split("?")[0] : `/${nextRaw}`;
  const entry = DEMO_PERSONAS[persona] ?? DEMO_PERSONAS.specialist;

  // Prefer the client-facing Host header so we don't bounce to 0.0.0.0
  const host =
    request.headers.get("x-forwarded-host") ||
    request.headers.get("host") ||
    "127.0.0.1:3000";
  const proto =
    request.headers.get("x-forwarded-proto") ||
    (request.nextUrl.protocol.replace(":", "") || "http");
  const publicHost = host.includes("0.0.0.0") ? "127.0.0.1:3000" : host;

  const dest = new URL(nextPath, `${proto}://${publicHost}`);
  const res = NextResponse.redirect(dest);
  res.cookies.set(
    DEMO_COOKIE,
    encodeDemoSession({ ...entry.session }),
    demoCookieOptions(),
  );
  return res;
}
