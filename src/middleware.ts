import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const VOTER_COOKIE = "voter_session";
const ADMIN_COOKIE = "admin_session";

const PROTECTED_VOTER_PATHS = ["/dashboard", "/nominate", "/vote", "/live"];
const PROTECTED_ADMIN_PATHS = ["/admin/dashboard"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtectedVoter = PROTECTED_VOTER_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
  const isProtectedAdmin = PROTECTED_ADMIN_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );

  if (isProtectedVoter && !request.cookies.get(VOTER_COOKIE)?.value) {
    const login = new URL("/login", request.url);
    login.searchParams.set("from", pathname);
    return NextResponse.redirect(login);
  }

  if (isProtectedAdmin && !request.cookies.get(ADMIN_COOKIE)?.value) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  const response = NextResponse.next();

  if (isProtectedVoter || isProtectedAdmin) {
    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
    response.headers.set("Pragma", "no-cache");
  }

  return response;
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/nominate/:path*",
    "/vote/:path*",
    "/live",
    "/live/:path*",
    "/admin/dashboard/:path*",
  ],
};
