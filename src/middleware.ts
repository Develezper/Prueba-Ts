import { verifyAccessToken } from "@/lib/jwt";
import { errors as joseErrors } from "jose";
import { NextRequest, NextResponse } from "next/server";

const ACCESS_COOKIE_NAME = "access_token";

const protectedRoutePrefixes = ["/search", "/dashboard", "/favorites"];

const isProtectedRoute = (pathname: string): boolean => {
  return protectedRoutePrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
};

const redirectToLogin = (request: NextRequest): NextResponse => {
  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("next", request.nextUrl.pathname);
  return NextResponse.redirect(loginUrl);
};

const withAuthenticatedHeaders = (
  request: NextRequest,
  userId: string,
  role: string,
): NextResponse => {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-user-id", userId);
  requestHeaders.set("x-user-role", role);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
};

const isJwtExpiredError = (error: unknown): boolean => {
  return (
    error instanceof joseErrors.JWTExpired ||
    (typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "ERR_JWT_EXPIRED")
  );
};

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const pathname = request.nextUrl.pathname;

  if (!isProtectedRoute(pathname)) {
    return NextResponse.next();
  }

  const accessToken = request.cookies.get(ACCESS_COOKIE_NAME)?.value;

  if (!accessToken) {
    return redirectToLogin(request);
  }

  try {
    const payload = await verifyAccessToken(accessToken);
    return withAuthenticatedHeaders(request, payload.sub, payload.role);
  } catch (error: unknown) {
    if (isJwtExpiredError(error)) {
      return redirectToLogin(request);
    }

    return redirectToLogin(request);
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|login(?:/|$)|register(?:/|$)|api/auth(?:/|$)|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map|txt)$).*)",
  ],
};
