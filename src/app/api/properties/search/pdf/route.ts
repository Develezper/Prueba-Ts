import {
  authorizationErrorResponse,
  AuthorizationError,
  requireAuthenticatedUser,
  requireRole,
} from "@/lib/api-auth";
import {
  parsePropertySearchQuery,
} from "@/lib/property-search-query";
import { buildPropertySearchPdf } from "@/lib/property-search-pdf";
import { searchService } from "@/services/search.service";
import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";

export const runtime = "nodejs";

export async function GET(request: NextRequest): Promise<Response> {
  try {
    const authenticatedUser = await requireAuthenticatedUser(request);
    requireRole(authenticatedUser, ["ADMIN"], "No tienes permisos para descargar este reporte.");

    const params = request.nextUrl.searchParams;
    const filters = parsePropertySearchQuery(params, {
      defaultPageSize: 50,
    });

    const results = await searchService.searchProperties(filters);
    const pdfBytes = await buildPropertySearchPdf({
      userId: authenticatedUser.userId,
      filters,
      results,
    });
    const pdfBytesForResponse = new Uint8Array(pdfBytes);
    const pdfBlob = new Blob([pdfBytesForResponse], {
      type: "application/pdf",
    });
    const fileDate = new Date().toISOString().slice(0, 10);

    return new Response(pdfBlob, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="reporte-busqueda-${fileDate}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error: unknown) {
    if (error instanceof AuthorizationError) {
      return authorizationErrorResponse(error);
    }

    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: "Parámetros de búsqueda inválidos.",
          issues: error.issues,
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        error: "Error interno del servidor.",
      },
      { status: 500 },
    );
  }
}