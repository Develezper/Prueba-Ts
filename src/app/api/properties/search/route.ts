import { Role as RoleEnum } from "@/generated/prisma/enums";
import type { Role } from "@/generated/prisma/enums";
import { verifyAccessToken } from "@/lib/jwt";
import { searchService } from "@/services/search.service";
import { NextRequest, NextResponse } from "next/server";
import { z, ZodError } from "zod";

export const runtime = "nodejs";

const ACCESS_COOKIE_NAME = "access_token";
const roleValues = new Set<Role>(Object.values(RoleEnum));

const isRole = (value: unknown): value is Role => {
  return typeof value === "string" && roleValues.has(value as Role);
};

const asOptionalString = (value: string | null): string | undefined => {
  if (value === null) {
    return undefined;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : undefined;
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

const searchQuerySchema = z
  .object({
    query: z.string().min(1).max(120).optional(),
    location: z.string().min(1).max(120).optional(),
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
    page: z.preprocess(toOptionalNumber, z.number().int().min(1).default(1)),
    pageSize: z.preprocess(
      toOptionalNumber,
      z.number().int().min(1).max(50).default(12),
    ),
    sort: z.enum(["relevance", "newest", "priceAsc", "priceDesc"]).default("relevance"),
  })
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

    const params = request.nextUrl.searchParams;
    const filters = searchQuerySchema.parse({
      query: asOptionalString(params.get("query")),
      location: asOptionalString(params.get("location")),
      minPrice: params.get("minPrice") ?? undefined,
      maxPrice: params.get("maxPrice") ?? undefined,
      rooms: params.get("rooms") ?? undefined,
      page: params.get("page") ?? undefined,
      pageSize: params.get("pageSize") ?? undefined,
      sort: asOptionalString(params.get("sort")),
    });

    const results = await searchService.searchProperties(filters);

    return NextResponse.json(
      {
        data: results.data,
        meta: results.meta,
      },
      { status: 200 },
    );
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: "Invalid search parameters.",
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
