import { resolveAuthenticatedUser } from "@/lib/api-auth";
import { parsePropertySearchQuery } from "@/lib/property-search-query";
import { searchService } from "@/services/search.service";
import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";

export const runtime = "nodejs";

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
    const filters = parsePropertySearchQuery(params, {
      defaultPageSize: 12,
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
