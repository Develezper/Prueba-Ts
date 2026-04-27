import { Role as RoleEnum } from "@/generated/prisma/enums";
import type { Role } from "@/generated/prisma/enums";
import { verifyAccessToken } from "@/lib/jwt";
import { searchFilterService } from "@/services/search-filter.service";
import { NextRequest, NextResponse } from "next/server";
import { z, ZodError } from "zod";

export const runtime = "nodejs";

const ACCESS_COOKIE_NAME = "access_token";
const roleValues = new Set<Role>(Object.values(RoleEnum));

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

const saveSearchFilterSchema = z
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

    const latest = await searchFilterService.getLatestForUser(authenticatedUser.userId);

    return NextResponse.json(
      {
        data: latest,
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
    const payload = saveSearchFilterSchema.parse(body);
    const saved = await searchFilterService.saveLatestForUser(
      authenticatedUser.userId,
      payload,
    );

    return NextResponse.json(
      {
        data: saved,
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
