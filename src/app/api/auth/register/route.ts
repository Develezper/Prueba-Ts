import { authService, AuthServiceError } from "@/services/auth.service";
import { jwtConfig } from "@/lib/jwt";
import { registerSchema } from "@/lib/validators";
import { ZodError } from "zod";
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
    const body: unknown = await request.json();
    const payload = registerSchema.parse(body);
    const result = await authService.register(payload);

    const response = NextResponse.json(
      {
        user: result.user,
      },
      { status: 201 },
    );

    setAuthCookies(response, result.tokens);
    return response;
  } catch (error: unknown) {
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        {
          error: "El cuerpo JSON es inválido.",
        },
        { status: 400 },
      );
    }

    if (error instanceof ZodError) {
      const firstIssueMessage = error.issues[0]?.message;

      return NextResponse.json(
        {
          error: firstIssueMessage ?? "Error de validación.",
          issues: error.issues,
        },
        { status: 400 },
      );
    }

    if (error instanceof AuthServiceError) {
      if (error.code === "EMAIL_ALREADY_IN_USE") {
        return NextResponse.json(
          {
            error: "Ya existe un usuario con este correo electrónico.",
          },
          { status: 400 },
        );
      }

      if (error.code === "INVALID_CREDENTIALS") {
        return NextResponse.json(
          {
            error: "Credenciales inválidas.",
          },
          { status: 401 },
        );
      }
    }

    return NextResponse.json(
      {
        error: "Error interno del servidor.",
      },
      { status: 500 },
    );
  }
}
