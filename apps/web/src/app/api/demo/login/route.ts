import { NextResponse } from "next/server";
import {
  DEMO_COOKIE,
  DEMO_PERSONAS,
  findDemoPersonaByEmail,
  type DemoPersona,
  type DemoSession,
} from "@cwg/demo";

import { demoCookieOptions, encodeDemoSession } from "@/lib/demo/session";
import { getPublicSupabaseEnv } from "@/lib/env";

export async function POST(request: Request) {
  if (getPublicSupabaseEnv().configured) {
    return NextResponse.json(
      { error: "Demo login desabilitado com Supabase configurado." },
      { status: 400 },
    );
  }

  const body = (await request.json().catch(() => ({}))) as {
    email?: string;
    password?: string;
    persona?: DemoPersona;
    session?: DemoSession;
  };

  let session: DemoSession | null = null;

  if (body.persona && DEMO_PERSONAS[body.persona]) {
    session = { ...DEMO_PERSONAS[body.persona].session };
  } else if (body.session?.userId) {
    session = body.session;
  } else if (body.email && body.password) {
    session = findDemoPersonaByEmail(body.email, body.password);
  }

  if (!session) {
    return NextResponse.json(
      { error: "Credenciais de demonstração inválidas." },
      { status: 401 },
    );
  }

  const res = NextResponse.json({ ok: true, session });
  res.cookies.set(DEMO_COOKIE, encodeDemoSession(session), demoCookieOptions());
  return res;
}
