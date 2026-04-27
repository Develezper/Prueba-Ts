import type { Role } from "@/generated/prisma/enums";
import { Prisma } from "@/generated/prisma/client";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "@/lib/jwt";
import { prisma } from "@/lib/prisma";
import {
  loginSchema,
  registerSchema,
  type LoginInput,
  type RegisterInput,
} from "@/lib/validators";
import bcrypt from "bcryptjs";

const BCRYPT_SALT_ROUNDS = 12;

const userAuthSelect = {
  id: true,
  email: true,
  role: true,
  tokenVersion: true,
} as const;

const userLoginSelect = {
  ...userAuthSelect,
  passwordHash: true,
} as const;

export type AuthErrorCode =
  | "EMAIL_ALREADY_IN_USE"
  | "INVALID_CREDENTIALS"
  | "INVALID_REFRESH_TOKEN";

export class AuthServiceError extends Error {
  public readonly code: AuthErrorCode;
  public readonly statusCode: 401 | 409;

  constructor(
    code: AuthErrorCode,
    message: string,
    statusCode: 401 | 409 = 401,
  ) {
    super(message);
    this.name = "AuthServiceError";
    this.code = code;
    this.statusCode = statusCode;
  }
}

export interface AuthUser {
  id: string;
  email: string;
  role: Role;
  tokenVersion: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResult {
  user: AuthUser;
  tokens: AuthTokens;
}

const mapToAuthUser = (user: {
  id: string;
  email: string;
  role: Role;
  tokenVersion: number;
}): AuthUser => {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    tokenVersion: user.tokenVersion,
  };
};

const issueTokens = async (user: AuthUser): Promise<AuthTokens> => {
  const tokenPayload = {
    userId: user.id,
    role: user.role,
    tokenVersion: user.tokenVersion,
  };

  const [accessToken, refreshToken] = await Promise.all([
    signAccessToken(tokenPayload),
    signRefreshToken(tokenPayload),
  ]);

  return { accessToken, refreshToken };
};

const invalidCredentialsError = (): AuthServiceError =>
  new AuthServiceError(
    "INVALID_CREDENTIALS",
    "Invalid email or password.",
    401,
  );

const invalidRefreshTokenError = (): AuthServiceError =>
  new AuthServiceError("INVALID_REFRESH_TOKEN", "Invalid refresh token.", 401);

export const register = async (input: RegisterInput): Promise<AuthResult> => {
  const payload = registerSchema.parse(input);
  const passwordHash = await bcrypt.hash(payload.password, BCRYPT_SALT_ROUNDS);

  try {
    const createdUser = await prisma.user.create({
      data: {
        email: payload.email,
        passwordHash,
        role: payload.role,
      },
      select: userAuthSelect,
    });

    const authUser = mapToAuthUser(createdUser);
    const tokens = await issueTokens(authUser);

    return { user: authUser, tokens };
  } catch (error: unknown) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new AuthServiceError(
        "EMAIL_ALREADY_IN_USE",
        "A user with this email already exists.",
        409,
      );
    }

    throw error;
  }
};

export const login = async (input: LoginInput): Promise<AuthResult> => {
  const payload = loginSchema.parse(input);

  const user = await prisma.user.findUnique({
    where: { email: payload.email },
    select: userLoginSelect,
  });

  if (!user) {
    throw invalidCredentialsError();
  }

  const isPasswordValid = await bcrypt.compare(payload.password, user.passwordHash);

  if (!isPasswordValid) {
    throw invalidCredentialsError();
  }

  const authUser = mapToAuthUser(user);
  const tokens = await issueTokens(authUser);

  return { user: authUser, tokens };
};

export const refresh = async (refreshToken: string): Promise<AuthResult> => {
  if (refreshToken.trim().length === 0) {
    throw invalidRefreshTokenError();
  }

  let verifiedPayload: Awaited<ReturnType<typeof verifyRefreshToken>>;

  try {
    verifiedPayload = await verifyRefreshToken(refreshToken);
  } catch {
    throw invalidRefreshTokenError();
  }

  const rotationResult = await prisma.user.updateMany({
    where: {
      id: verifiedPayload.sub,
      tokenVersion: verifiedPayload.tokenVersion,
    },
    data: {
      tokenVersion: {
        increment: 1,
      },
    },
  });

  if (rotationResult.count !== 1) {
    throw invalidRefreshTokenError();
  }

  const rotatedUser = await prisma.user.findUnique({
    where: { id: verifiedPayload.sub },
    select: userAuthSelect,
  });

  if (!rotatedUser) {
    throw invalidRefreshTokenError();
  }

  const authUser = mapToAuthUser(rotatedUser);
  const tokens = await issueTokens(authUser);

  return { user: authUser, tokens };
};

export const authService = {
  register,
  login,
  refresh,
};
