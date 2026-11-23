import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { DEMO_COOKIE, decodeDemoSession } from "@cwg/demo";

const SPECIALIST_PREFIXES = [
  "/crm",
  "/calendario",
  "/estatisticas",
  "/assinatura",
  "/solicitacoes",
];

const AUTH_PREFIXES = [
  "/favoritos",
  "/agendamentos",
  "/mensagens",
  "/conta",
  "/onboarding",
];

const ADMIN_PREFIXES = ["/admin"];

function startsWithAny(pathname: string, prefixes: string[]) {
  return prefixes.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

function loginRedirect(request: NextRequest) {
  const url = request.nextUrl.clone();
  url.pathname = "/entrar";
  url.searchParams.set(
    "next",
    `${request.nextUrl.pathname}${request.nextUrl.search}`,
  );
  return NextResponse.redirect(url);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  const configured = Boolean(url && anonKey);

  let response = NextResponse.next({ request });
  let activeRole: string | null = null;
  let roles: string[] = [];
  let authenticated = false;

  if (!configured) {
    const demo = decodeDemoSession(request.cookies.get(DEMO_COOKIE)?.value);
    if (demo) {
      authenticated = true;
      activeRole = demo.activeRole;
      roles = demo.roles;
    }
  } else {
    const supabase = createServerClient(url, anonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(
          cookiesToSet: {
            name: string;
            value: string;
            options?: Record<string, unknown>;
          }[],
        ) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    });

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      authenticated = true;
      const { data: profile } = await supabase
        .from("users")
        .select("active_role")
        .eq("id", user.id)
        .maybeSingle();
      const { data: roleRows } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);
      activeRole = (profile?.active_role as string | null) ?? null;
      roles = (roleRows ?? []).map((r) => r.role as string);
      if (!activeRole && roles[0]) activeRole = roles[0];
    }
  }

  if (startsWithAny(pathname, ADMIN_PREFIXES)) {
    if (!authenticated) return loginRedirect(request);
    if (!roles.includes("admin")) {
      const dest = request.nextUrl.clone();
      dest.pathname = "/conta";
      dest.search = "";
      return NextResponse.redirect(dest);
    }
    return response;
  }

  if (startsWithAny(pathname, SPECIALIST_PREFIXES)) {
    if (!authenticated) return loginRedirect(request);
    if (activeRole !== "specialist") {
      const dest = request.nextUrl.clone();
      dest.pathname = "/conta";
      dest.search = "";
      return NextResponse.redirect(dest);
    }
    return response;
  }

  if (startsWithAny(pathname, AUTH_PREFIXES)) {
    if (!authenticated) return loginRedirect(request);
    return response;
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/demo|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
