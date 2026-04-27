import { verifyAccessToken } from "@/lib/jwt";
import {
  favoriteService,
  FavoriteServiceError,
} from "@/services/favorite.service";
import { NextRequest, NextResponse } from "next/server";
import { z, ZodError } from "zod";

export const runtime = "nodejs";

const ACCESS_COOKIE_NAME = "access_token";

const toggleFavoriteSchema = z
  .object({
    propertyId: z.string().uuid(),
  })
  .strict();

interface AuthenticatedRequestUser {
  userId: string;
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
      };
    } catch {
      return null;
    }
  }

  return null;
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
