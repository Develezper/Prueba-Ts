import { authService, AuthServiceError } from "@/services/auth.service";
import { jwtConfig } from "@/lib/jwt";
import { NextRequest, NextResponse } from "next/server";

const ACCESS_COOKIE_NAME = "access_token";
const REFRESH_COOKIE_NAME = "refresh_token";

export const runtime = "nodejs";

const setAuthCookies = (
  response: NextResponse,
  tokens: { accessToken: string; refreshToken: string },
): void => {
  response.cookies.set({
    name: ACCESS_COOKIE_NAME,
    value: tokens.accessToken,
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    path: "/",
    maxAge: jwtConfig.accessTokenMaxAgeSeconds,
  });

  response.cookies.set({
    name: REFRESH_COOKIE_NAME,
    value: tokens.refreshToken,
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    path: "/",
    maxAge: jwtConfig.refreshTokenMaxAgeSeconds,
  });
};

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const refreshToken = request.cookies.get(REFRESH_COOKIE_NAME)?.value;

    if (!refreshToken) {
      return NextResponse.json(
        {
          error: "Missing refresh token.",
        },
        { status: 401 },
      );
    }

    const result = await authService.refresh(refreshToken);
    const response = NextResponse.json(
      {
        user: result.user,
      },
      { status: 200 },
    );

    setAuthCookies(response, result.tokens);
    return response;
  } catch (error: unknown) {
    if (error instanceof AuthServiceError) {
      if (error.code === "INVALID_REFRESH_TOKEN") {
        return NextResponse.json(
          {
            error: "Invalid refresh token.",
          },
          { status: 401 },
        );
      }
    }

    return NextResponse.json(
      {
        error: "Internal server error.",
      },
      { status: 500 },
    );
  }
}
