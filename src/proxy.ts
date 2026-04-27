import {
  ACCESS_COOKIE_NAME,
  clearAuthCookies,
  REFRESH_COOKIE_NAME,
  setAuthCookies,
} from "@/lib/auth-cookies";
import {
  AUTH_USER_ID_HEADER,
  AUTH_USER_ROLE_HEADER,
} from "@/lib/api-auth";
import { verifyAccessToken } from "@/lib/jwt";
import { authService } from "@/services/auth.service";
import type { Role } from "@/generated/prisma/enums";
import { errors as joseErrors } from "jose";
import { NextRequest, NextResponse } from "next/server";

const protectedPageRoutePrefixes = ["/search", "/favorites"] as const;
const protectedApiRoutePrefixes = [
  "/api/favorites",
  "/api/search-filters",
  "/api/properties/search",
] as const;

type ProtectedRouteKind = "page" | "api";

const matchesPrefix = (
  pathname: string,
  prefixes: readonly string[],
): boolean => {
  return prefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
};

const getProtectedRouteKind = (
  pathname: string,
): ProtectedRouteKind | null => {
  if (matchesPrefix(pathname, protectedPageRoutePrefixes)) {
    return "page";
  }

  if (matchesPrefix(pathname, protectedApiRoutePrefixes)) {
    return "api";
  }

  return null;
};

const redirectToLogin = (
  request: NextRequest,
  clearSession = false,
): NextResponse => {
  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set(
    "next",
    `${request.nextUrl.pathname}${request.nextUrl.search}`,
  );

  const response = NextResponse.redirect(loginUrl);

  if (clearSession) {
    clearAuthCookies(response);
  }

  return response;
};

const unauthorizedApiResponse = (clearSession = false): NextResponse => {
  const response = NextResponse.json(
    {
      error: "No autorizado.",
    },
    { status: 401 },
  );

  if (clearSession) {
    clearAuthCookies(response);
  }

  return response;
};

const rejectUnauthorizedRequest = (
  request: NextRequest,
  routeKind: ProtectedRouteKind,
  clearSession = false,
): NextResponse => {
  if (routeKind === "api") {
    return unauthorizedApiResponse(clearSession);
  }

  return redirectToLogin(request, clearSession);
};

const withAuthenticatedHeaders = (
  request: NextRequest,
  userId: string,
  role: string,
): NextResponse => {
  // Forward identity context so server handlers can authorize without re-reading cookies.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(AUTH_USER_ID_HEADER, userId);
  requestHeaders.set(AUTH_USER_ROLE_HEADER, role);

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

const buildAuthenticatedResponse = (
  request: NextRequest,
  user: { id: string; role: Role },
  tokens?: { accessToken: string; refreshToken: string },
): NextResponse => {
  const response = withAuthenticatedHeaders(request, user.id, user.role);

  if (tokens) {
    setAuthCookies(response, tokens);
  }

  return response;
};

const refreshSession = async (
  request: NextRequest,
  routeKind: ProtectedRouteKind,
): Promise<NextResponse | null> => {
  const refreshToken = request.cookies.get(REFRESH_COOKIE_NAME)?.value;

  if (!refreshToken) {
    return null;
  }

  try {
    const result = await authService.refresh(refreshToken);

    return buildAuthenticatedResponse(
      request,
      {
        id: result.user.id,
        role: result.user.role,
      },
      result.tokens,
    );
  } catch {
    return rejectUnauthorizedRequest(request, routeKind, true);
  }
};

export async function proxy(request: NextRequest): Promise<NextResponse> {
  const pathname = request.nextUrl.pathname;
  const routeKind = getProtectedRouteKind(pathname);

  // Skip token work for public routes to keep proxy overhead low.
  if (!routeKind) {
    return NextResponse.next();
  }

  const accessToken = request.cookies.get(ACCESS_COOKIE_NAME)?.value;

  if (!accessToken) {
    const refreshedResponse = await refreshSession(request, routeKind);

    return refreshedResponse ?? rejectUnauthorizedRequest(request, routeKind);
  }

  try {
    const payload = await verifyAccessToken(accessToken);

    return buildAuthenticatedResponse(request, {
      id: payload.sub,
      role: payload.role,
    });
  } catch (error: unknown) {
    if (isJwtExpiredError(error)) {
      const refreshedResponse = await refreshSession(request, routeKind);

      return refreshedResponse ?? rejectUnauthorizedRequest(request, routeKind, true);
    }

    return rejectUnauthorizedRequest(request, routeKind, true);
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|manifest.webmanifest|login(?:/|$)|register(?:/|$)|api/auth(?:/|$)|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map|txt)$).*)",
  ],
};