import { cookies } from "next/headers";
import {
  DEMO_COOKIE,
  decodeDemoSession,
  encodeDemoSession,
  type DemoSession,
} from "@cwg/demo";

export { decodeDemoSession, encodeDemoSession, DEMO_COOKIE } from "@cwg/demo";

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
