import { verifyAccessToken } from "@/lib/jwt";
import { searchFilterService } from "@/services/search-filter.service";
import { NextRequest, NextResponse } from "next/server";
import { z, ZodError } from "zod";

export const runtime = "nodejs";

const ACCESS_COOKIE_NAME = "access_token";

interface AuthenticatedRequestUser {
  userId: string;
}

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
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

const asOptionalString = (value: unknown): unknown => {
  if (value === undefined || value === null) {
    return undefined;
  }

  if (typeof value === "string") {
    const normalized = value.trim();
    return normalized.length > 0 ? normalized : undefined;
  }

  return value;
};

const toOptionalNumber = (value: unknown): unknown => {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value === "string" && value.trim().length === 0) {
    return undefined;
  }

  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string") {
    return Number(value);
  }

  return value;
};

const searchFilterIdSchema = z.string().uuid();

const updateSearchFilterSchema = z
  .object({
    query: z.preprocess(asOptionalString, z.string().min(1).max(120).optional()),
    location: z.preprocess(
      asOptionalString,
      z.string().min(1).max(120).optional(),
    ),
    minPrice: z.preprocess(
      toOptionalNumber,
      z.number().positive().finite().optional(),
    ),
    maxPrice: z.preprocess(
      toOptionalNumber,
      z.number().positive().finite().optional(),
    ),
    rooms: z.preprocess(
      toOptionalNumber,
      z.number().int().min(1).max(20).optional(),
    ),
  })
  .strict()
  .superRefine((data, context) => {
    if (
      data.minPrice !== undefined &&
      data.maxPrice !== undefined &&
      data.minPrice > data.maxPrice
    ) {
      context.addIssue({
        code: "custom",
        path: ["minPrice"],
        message: "minPrice cannot be greater than maxPrice.",
      });
    }
  });

const resolveId = async (context: RouteContext): Promise<string> => {
  const { id } = await context.params;
  return searchFilterIdSchema.parse(id);
};

export async function GET(
  request: NextRequest,
  context: RouteContext,
): Promise<NextResponse> {
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

    const id = await resolveId(context);
    const filter = await searchFilterService.getByIdForUser(
      authenticatedUser.userId,
      id,
    );

    if (!filter) {
      return NextResponse.json(
        {
          error: "Search filter not found.",
        },
        { status: 404 },
      );
    }

    return NextResponse.json(
      {
        data: filter,
      },
      { status: 200 },
    );
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: "Invalid search filter id.",
          issues: error.issues,
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        error: "Internal server error.",
      },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  context: RouteContext,
): Promise<NextResponse> {
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

    const id = await resolveId(context);
    const body: unknown = await request.json();
    const payload = updateSearchFilterSchema.parse(body);
    const updated = await searchFilterService.updateByIdForUser(
      authenticatedUser.userId,
      id,
      payload,
    );

    if (!updated) {
      return NextResponse.json(
        {
          error: "Search filter not found.",
        },
        { status: 404 },
      );
    }

    return NextResponse.json(
      {
        data: updated,
      },
      { status: 200 },
    );
  } catch (error: unknown) {
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        {
          error: "Invalid JSON body.",
        },
        { status: 400 },
      );
    }

    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: "Validation error.",
          issues: error.issues,
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        error: "Internal server error.",
      },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: RouteContext,
): Promise<NextResponse> {
  return PATCH(request, context);
}

export async function DELETE(
  request: NextRequest,
  context: RouteContext,
): Promise<NextResponse> {
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

    const id = await resolveId(context);
    const deleted = await searchFilterService.deleteByIdForUser(
      authenticatedUser.userId,
      id,
    );

    if (!deleted) {
      return NextResponse.json(
        {
          error: "Search filter not found.",
        },
        { status: 404 },
      );
    }

    return NextResponse.json(null, { status: 204 });
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: "Invalid search filter id.",
          issues: error.issues,
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        error: "Internal server error.",
      },
      { status: 500 },
    );
  }
}
