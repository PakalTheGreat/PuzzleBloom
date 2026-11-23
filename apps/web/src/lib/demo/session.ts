import { cookies } from "next/headers";

import { decodeDemoSession, encodeDemoSession } from "./codec";
import type { DemoSession } from "./types";
import { DEMO_COOKIE } from "./types";

export { decodeDemoSession, encodeDemoSession } from "./codec";

export async function getDemoSessionServer(): Promise<DemoSession | null> {
  const store = await cookies();
  return decodeDemoSession(store.get(DEMO_COOKIE)?.value);
}

export function demoCookieOptions(maxAge = 60 * 60 * 24 * 14) {
  return {
    httpOnly: false,
    sameSite: "lax" as const,
    path: "/",
    maxAge,
    secure: process.env.NODE_ENV === "production",
  };
}
