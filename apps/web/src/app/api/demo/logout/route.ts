import { NextResponse } from "next/server";

import { DEMO_COOKIE } from "@/lib/demo/types";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(DEMO_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}
