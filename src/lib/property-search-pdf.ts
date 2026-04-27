import type { ParsedPropertySearchQuery } from "@/lib/property-search-query";
import type { PropertySearchResult } from "@/services/search.service";

const MAX_LINES_IN_PDF = 48;

const toPriceText = (value: unknown): string => {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return String(value);
  }

  return new Intl.NumberFormat("es-CO", {
    maximumFractionDigits: 0,
  }).format(parsed);
};

export const buildPropertySearchPdfLines = (
  userId: string,
  filters: ParsedPropertySearchQuery,
  results: PropertySearchResult,
): string[] => {
  const filterSummary = [
    filters.query ? `query=${filters.query}` : null,
    filters.location ? `location=${filters.location}` : null,
    filters.minPrice !== undefined ? `minPrice=${filters.minPrice}` : null,
    filters.maxPrice !== undefined ? `maxPrice=${filters.maxPrice}` : null,
    filters.rooms !== undefined ? `rooms=${filters.rooms}` : null,
    `sort=${filters.sort}`,
  ]
    .filter((item) => item !== null)
    .join(" | ");

  const headerLines = [
    "Rentvago - Reporte de busqueda",
    `Generado: ${new Date().toISOString()}`,
    `Usuario: ${userId}`,
    `Filtros: ${filterSummary}`,
    "",
    `Resultados pagina ${results.meta.page} de ${results.meta.totalPages} | Total: ${results.meta.total}`,
  ];

  const propertyLines = results.data.map((property, index) => {
    return [
      `${index + 1}. ${property.title}`,
      `   ${property.location} | COP ${toPriceText(property.price)} | ${property.rooms} hab`,
    ];
  });

  const flatPropertyLines = propertyLines.flat();

  return [...headerLines, ...flatPropertyLines].slice(0, MAX_LINES_IN_PDF);
};