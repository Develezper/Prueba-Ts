import { Role as RoleEnum } from "@/generated/prisma/enums";
import type { Role } from "@/generated/prisma/enums";
import { verifyAccessToken } from "@/lib/jwt";
import {
  favoriteService,
  FavoriteServiceError,
} from "@/services/favorite.service";
import { NextRequest, NextResponse } from "next/server";
import { z, ZodError } from "zod";

export const runtime = "nodejs";

const ACCESS_COOKIE_NAME = "access_token";
const roleValues = new Set<Role>(Object.values(RoleEnum));

const toggleFavoriteSchema = z
  .object({
    propertyId: z.string().uuid(),
  })
  .strict();

const isRole = (value: unknown): value is Role => {
  return typeof value === "string" && roleValues.has(value as Role);
};

interface AuthenticatedRequestUser {
  userId: string;
  role: Role;
}

const resolveAuthenticatedUser = async (
  request: NextRequest,
): Promise<AuthenticatedRequestUser | null> => {
  const accessToken = request.cookies.get(ACCESS_COOKIE_NAME)?.value;

  if (accessToken) {
    try {
      const payload = await verifyAccessToken(accessToken);
      return {
        userId: payload.sub,
        role: payload.role,
      };
    } catch {
      return null;
    }
  }

  const userIdHeader = request.headers.get("x-user-id");
  const roleHeader = request.headers.get("x-user-role");

  if (!userIdHeader || !isRole(roleHeader)) {
    return null;
  }

  return {
    userId: userIdHeader,
    role: roleHeader,
  };
};

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const authenticatedUser = await resolveAuthenticatedUser(request);

    if (!authenticatedUser) {
      return NextResponse.json(
        {
          error: "Unauthorized.",
        },
        { status: 401 },
      );
    }

    const favorites = await favoriteService.getUserFavorites(authenticatedUser.userId);

    return NextResponse.json(
      {
        data: favorites,
      },
      { status: 200 },
    );
  } catch {
    return NextResponse.json(
      {
        error: "Internal server error.",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const authenticatedUser = await resolveAuthenticatedUser(request);

    if (!authenticatedUser) {
      return NextResponse.json(
        {
          error: "Unauthorized.",
        },
        { status: 401 },
      );
    }

    const body: unknown = await request.json();
    const payload = toggleFavoriteSchema.parse(body);
    const result = await favoriteService.toggleFavorite(
      authenticatedUser.userId,
      payload.propertyId,
    );

    return NextResponse.json(
      {
        data: result,
      },
      { status: 200 },
    );
  } catch (error: unknown) {
    if (error instanceof SyntaxError || error instanceof ZodError) {
      return NextResponse.json(
        {
          error: "Invalid request payload.",
        },
        { status: 400 },
      );
    }

    if (error instanceof FavoriteServiceError) {
      if (error.code === "PROPERTY_NOT_FOUND") {
        return NextResponse.json(
          {
            error: "Property not found.",
          },
          { status: 404 },
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
