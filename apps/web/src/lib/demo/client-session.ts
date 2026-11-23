import { decodeDemoSession, encodeDemoSession } from "./codec";
import type { DemoSession } from "./types";
import { DEMO_COOKIE } from "./types";

export function readDemoSessionClient(): DemoSession | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${DEMO_COOKIE}=`));
  if (!match) return null;
  const value = match.slice(DEMO_COOKIE.length + 1);
  try {
    return decodeDemoSession(decodeURIComponent(value));
  } catch {
    return decodeDemoSession(value);
  }
}

export function writeDemoSessionClient(session: DemoSession) {
  const value = encodeDemoSession(session);
  const maxAge = 60 * 60 * 24 * 14;
  document.cookie = `${DEMO_COOKIE}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
}

export function clearDemoSessionClient() {
  document.cookie = `${DEMO_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
}
