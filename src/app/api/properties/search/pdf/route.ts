import { resolveAuthenticatedUser } from "@/lib/api-auth";
import {
  parsePropertySearchQuery,
} from "@/lib/property-search-query";
import { buildPropertySearchPdfLines } from "@/lib/property-search-pdf";
import { searchService } from "@/services/search.service";
import { NextRequest, NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { ZodError } from "zod";

export const runtime = "nodejs";

const toPdfSafeText = (value: string): string => {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x20-\x7E]/g, "?");
};

const clampText = (value: string, maxLength = 94): string => {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength - 3)}...`;
};

const buildSimplePdf = async (lines: string[]): Promise<Uint8Array> => {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595, 842]);
  const font = await pdf.embedFont(StandardFonts.Helvetica);

  let y = 800;

  lines.forEach((line) => {
    if (y < 40) {
      return;
    }

    page.drawText(clampText(toPdfSafeText(line)), {
      x: 48,
      y,
      size: 11,
      font,
      color: rgb(0.1, 0.1, 0.1),
    });

    y -= 14;
  });

  return pdf.save();
};

export async function GET(request: NextRequest): Promise<Response> {
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
      defaultPageSize: 50,
    });

    const results = await searchService.searchProperties(filters);
    const lines = buildPropertySearchPdfLines(
      authenticatedUser.userId,
      filters,
      results,
    );
    const pdfBytes = await buildSimplePdf(lines);
    const fileDate = new Date().toISOString().slice(0, 10);

    return new Response(pdfBytes, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="reporte-busqueda-${fileDate}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
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