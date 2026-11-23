import type { DemoSession } from "./types";

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]!);
  // Prefer btoa; fall back to a pure JS encoder if needed.
  const b64 =
    typeof btoa === "function"
      ? btoa(binary)
      : (() => {
          const chars =
            "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
          let out = "";
          for (let i = 0; i < bytes.length; i += 3) {
            const a = bytes[i]!;
            const b = i + 1 < bytes.length ? bytes[i + 1]! : 0;
            const c = i + 2 < bytes.length ? bytes[i + 2]! : 0;
            out += chars[a >> 2];
            out += chars[((a & 3) << 4) | (b >> 4)];
            out += i + 1 < bytes.length ? chars[((b & 15) << 2) | (c >> 6)] : "=";
            out += i + 2 < bytes.length ? chars[c & 63] : "=";
          }
          return out;
        })();
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlToBytes(input: string): Uint8Array {
  const padded = input.replace(/-/g, "+").replace(/_/g, "/");
  const pad =
    padded.length % 4 === 0 ? "" : "=".repeat(4 - (padded.length % 4));
  const b64 = padded + pad;
  if (typeof atob !== "function") {
    throw new Error("atob unavailable");
  }
  const binary = atob(b64);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return out;
}

function utf8Encode(input: string): Uint8Array {
  if (typeof TextEncoder !== "undefined") {
    return new TextEncoder().encode(input);
  }
  // Minimal UTF-8 encoder fallback
  const utf8: number[] = [];
  for (let i = 0; i < input.length; i++) {
    let c = input.charCodeAt(i);
    if (c < 0x80) utf8.push(c);
    else if (c < 0x800) {
      utf8.push(0xc0 | (c >> 6), 0x80 | (c & 0x3f));
    } else if (c < 0xd800 || c >= 0xe000) {
      utf8.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 0x3f), 0x80 | (c & 0x3f));
    } else {
      i++;
      c = 0x10000 + (((c & 0x3ff) << 10) | (input.charCodeAt(i) & 0x3ff));
      utf8.push(
        0xf0 | (c >> 18),
        0x80 | ((c >> 12) & 0x3f),
        0x80 | ((c >> 6) & 0x3f),
        0x80 | (c & 0x3f),
      );
    }
  }
  return new Uint8Array(utf8);
}

function utf8Decode(bytes: Uint8Array): string {
  if (typeof TextDecoder !== "undefined") {
    return new TextDecoder().decode(bytes);
  }
  let out = "";
  for (let i = 0; i < bytes.length; ) {
    const c = bytes[i]!;
    if (c < 0x80) {
      out += String.fromCharCode(c);
      i++;
    } else if (c < 0xe0) {
      out += String.fromCharCode(((c & 0x1f) << 6) | (bytes[i + 1]! & 0x3f));
      i += 2;
    } else if (c < 0xf0) {
      out += String.fromCharCode(
        ((c & 0x0f) << 12) |
          ((bytes[i + 1]! & 0x3f) << 6) |
          (bytes[i + 2]! & 0x3f),
      );
      i += 3;
    } else {
      const cp =
        ((c & 0x07) << 18) |
        ((bytes[i + 1]! & 0x3f) << 12) |
        ((bytes[i + 2]! & 0x3f) << 6) |
        (bytes[i + 3]! & 0x3f);
      const adj = cp - 0x10000;
      out += String.fromCharCode(0xd800 + (adj >> 10), 0xdc00 + (adj & 0x3ff));
      i += 4;
    }
  }
  return out;
}

export function encodeDemoSession(session: DemoSession): string {
  return bytesToBase64Url(utf8Encode(JSON.stringify(session)));
}

export function decodeDemoSession(raw: string | undefined | null): DemoSession | null {
  if (!raw) return null;
  try {
    const json = utf8Decode(base64UrlToBytes(raw));
    const parsed = JSON.parse(json) as DemoSession;
    if (!parsed?.userId || !parsed?.activeRole || !Array.isArray(parsed.roles)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}
