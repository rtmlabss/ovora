import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyToken, SESSION_COOKIE } from "@/lib/auth-token";

type Role = "Pemilik" | "Manager" | "Kasir";

const ROUTE_ROLES: Array<{ prefix: string; roles: Role[] }> = [
  { prefix: "/pengaturan", roles: ["Pemilik"] },
  { prefix: "/leaderboard", roles: ["Pemilik", "Manager"] },
  { prefix: "/cabang", roles: ["Pemilik", "Manager"] },
  { prefix: "/keuangan", roles: ["Pemilik", "Manager"] },
  { prefix: "/membership", roles: ["Pemilik", "Manager"] },
  { prefix: "/kasir", roles: ["Pemilik", "Manager", "Kasir"] },
  { prefix: "/stok", roles: ["Pemilik", "Manager", "Kasir"] },
  { prefix: "/dashboard", roles: ["Pemilik", "Manager", "Kasir"] },
];

function roleFor(pathname: string): Role[] | null {
  for (const rule of ROUTE_ROLES) {
    if (pathname === rule.prefix || pathname.startsWith(`${rule.prefix}/`)) {
      return rule.roles;
    }
  }
  return null;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === "/login" || pathname.startsWith("/_next") || pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  const allowed = roleFor(pathname);
  if (!allowed) return NextResponse.next();

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const claims = verifyToken(token);

  if (!claims) {
    const login = new URL("/login", request.url);
    login.searchParams.set("from", pathname);
    return NextResponse.redirect(login);
  }

  if (!allowed.includes(claims.role)) {
    if (pathname === "/dashboard" || pathname === "/") {
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
