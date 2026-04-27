import {
  jwtConfig,
  verifyAccessToken,
} from "@/lib/jwt";
import { authService } from "@/services/auth.service";
import { errors as joseErrors } from "jose";
import { NextRequest, NextResponse } from "next/server";

const ACCESS_COOKIE_NAME = "access_token";
const REFRESH_COOKIE_NAME = "refresh_token";

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

const setAccessCookie = (response: NextResponse, accessToken: string): void => {
  response.cookies.set({
    name: ACCESS_COOKIE_NAME,
    value: accessToken,
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    path: "/",
    maxAge: jwtConfig.accessTokenMaxAgeSeconds,
  });
};

const setRefreshCookie = (response: NextResponse, refreshToken: string): void => {
  response.cookies.set({
    name: REFRESH_COOKIE_NAME,
    value: refreshToken,
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    path: "/",
    maxAge: jwtConfig.refreshTokenMaxAgeSeconds,
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

export async function proxy(request: NextRequest): Promise<NextResponse> {
  const pathname = request.nextUrl.pathname;

  if (!isProtectedRoute(pathname)) {
    return NextResponse.next();
  }

  const accessToken = request.cookies.get(ACCESS_COOKIE_NAME)?.value;
  const refreshToken = request.cookies.get(REFRESH_COOKIE_NAME)?.value;

  if (accessToken) {
    try {
      const payload = await verifyAccessToken(accessToken);
      return withAuthenticatedHeaders(request, payload.sub, payload.role);
    } catch (error: unknown) {
      if (!isJwtExpiredError(error)) {
        return redirectToLogin(request);
      }
    }
  }

  if (!refreshToken) {
    return redirectToLogin(request);
  }

  try {
    const refreshed = await authService.refresh(refreshToken);
    const response = withAuthenticatedHeaders(
      request,
      refreshed.user.id,
      refreshed.user.role,
    );
    setAccessCookie(response, refreshed.tokens.accessToken);
    setRefreshCookie(response, refreshed.tokens.refreshToken);
    return response;
  } catch {
    return redirectToLogin(request);
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|login(?:/|$)|register(?:/|$)|api/auth(?:/|$)|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map|txt)$).*)",
  ],
};
