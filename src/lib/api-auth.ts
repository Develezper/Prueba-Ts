import { verifyAccessToken } from "@/lib/jwt";
import type { Role } from "@/generated/prisma/enums";
import { NextRequest, NextResponse } from "next/server";

const ACCESS_COOKIE_NAME = "access_token";

export interface AuthenticatedRequestUser {
  userId: string;
  role: Role;
}

export class AuthorizationError extends Error {
  public readonly statusCode: 401 | 403;

  constructor(statusCode: 401 | 403, message: string) {
    super(message);
    this.name = "AuthorizationError";
    this.statusCode = statusCode;
  }
}

export const resolveAuthenticatedUser = async (
  request: NextRequest,
): Promise<AuthenticatedRequestUser | null> => {
  const accessToken = request.cookies.get(ACCESS_COOKIE_NAME)?.value;

  if (!accessToken) {
    return null;
  }

  try {
    const payload = await verifyAccessToken(accessToken);

    return {
      userId: payload.sub,
      role: payload.role,
    };
  } catch {
    return null;
  }
};

export const ensureAuthenticatedUser = (
  user: AuthenticatedRequestUser | null,
): AuthenticatedRequestUser => {
  if (!user) {
    throw new AuthorizationError(401, "No autorizado.");
  }

  return user;
};

export const requireAuthenticatedUser = async (
  request: NextRequest,
): Promise<AuthenticatedRequestUser> => {
  const resolved = await resolveAuthenticatedUser(request);
  return ensureAuthenticatedUser(resolved);
};

export const requireRole = (
  user: AuthenticatedRequestUser,
  allowedRoles: readonly Role[],
  errorMessage = "No tienes permisos para realizar esta acción.",
): void => {
  if (!allowedRoles.includes(user.role)) {
    throw new AuthorizationError(403, errorMessage);
  }
};

export const authorizationErrorResponse = (
  error: AuthorizationError,
): NextResponse => {
  return NextResponse.json(
    {
      error: error.message,
    },
    { status: error.statusCode },
  );
};