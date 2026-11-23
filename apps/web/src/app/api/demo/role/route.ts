import { NextResponse } from "next/server";

import {
  decodeDemoSession,
  demoCookieOptions,
  encodeDemoSession,
} from "@/lib/demo/session";
import type { AppRole } from "@cwg/demo";
import { DEMO_COOKIE } from "@cwg/demo";
import { getPublicSupabaseEnv } from "@/lib/env";

export async function POST(request: Request) {
  if (getPublicSupabaseEnv().configured) {
    return NextResponse.json({ error: "Não disponível." }, { status: 400 });
  }

  const cookie = request.headers.get("cookie") ?? "";
  const match = cookie
    .split("; ")
    .find((row) => row.startsWith(`${DEMO_COOKIE}=`));
  const raw = match ? decodeURIComponent(match.slice(DEMO_COOKIE.length + 1)) : null;
  const current = decodeDemoSession(raw);
  if (!current) {
    return NextResponse.json({ error: "Sem sessão." }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as { role?: AppRole };
  if (!body.role || !current.roles.includes(body.role)) {
    return NextResponse.json({ error: "Papel inválido." }, { status: 400 });
  }

  const session = { ...current, activeRole: body.role };
  const res = NextResponse.json({ ok: true, session });
  res.cookies.set(DEMO_COOKIE, encodeDemoSession(session), demoCookieOptions());
  return res;
}
