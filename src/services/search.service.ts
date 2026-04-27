import { Prisma } from "@/generated/prisma/client";
import type { Property } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export interface PropertySearchFilters {
  query?: string;
  location?: string;
  minPrice?: number;
  maxPrice?: number;
  rooms?: number;
  sort?: "relevance" | "newest" | "priceAsc" | "priceDesc";
  page: number;
  pageSize: number;
}

export interface PropertySearchResult {
  data: Property[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export const searchProperties = async (
  filters: PropertySearchFilters,
): Promise<PropertySearchResult> => {
  const query = filters.query?.trim() ?? "";
  const location = filters.location?.trim() ?? "";
  const hasQuery = query.length > 0;
  const hasLocation = location.length > 0;
  const sort = filters.sort ?? "relevance";
  const skip = (filters.page - 1) * filters.pageSize;
  const conditions: Prisma.Sql[] = [];

  if (hasQuery) {
    conditions.push(
      Prisma.sql`"search_vector" @@ plainto_tsquery('spanish', lower(unaccent(${query})))`,
    );
  }

  if (hasLocation) {
    conditions.push(
      Prisma.sql`lower(unaccent("location")) LIKE '%' || lower(unaccent(${location})) || '%'`,
    );
  }

  if (filters.rooms !== undefined) {
    conditions.push(Prisma.sql`"rooms" >= ${filters.rooms}`);
  }

  if (filters.minPrice !== undefined) {
    conditions.push(Prisma.sql`"price" >= ${filters.minPrice}`);
  }

  if (filters.maxPrice !== undefined) {
    conditions.push(Prisma.sql`"price" <= ${filters.maxPrice}`);
  }

  const whereClause =
    conditions.length > 0
      ? Prisma.sql`WHERE ${Prisma.join(conditions, " AND ")}`
      : Prisma.empty;

  const orderByClause = (() => {
    if (sort === "priceAsc") {
      return Prisma.sql`ORDER BY "price" ASC, "createdAt" DESC`;
    }

    if (sort === "priceDesc") {
      return Prisma.sql`ORDER BY "price" DESC, "createdAt" DESC`;
    }

    if (sort === "newest") {
      return Prisma.sql`ORDER BY "createdAt" DESC`;
    }

    if (hasQuery) {
      return Prisma.sql`
        ORDER BY
          ts_rank_cd(
            "search_vector",
            plainto_tsquery('spanish', lower(unaccent(${query})))
          ) DESC,
          "createdAt" DESC
      `;
    }

    return Prisma.sql`ORDER BY "createdAt" DESC`;
  })();

  const [properties, countResult] = await Promise.all([
    prisma.$queryRaw<Property[]>`
      SELECT
        "id",
        "title",
        "description",
        "imageUrl",
        "price",
        "location",
        "rooms",
        "ownerId",
        "createdAt",
        "updatedAt"
      FROM "Property"
      ${whereClause}
      ${orderByClause}
      OFFSET ${skip}
      LIMIT ${filters.pageSize}
    `,
    prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*)::bigint AS "count"
      FROM "Property"
      ${whereClause}
    `,
  ]);

  const rawCount = countResult[0]?.count;
  const total = rawCount === undefined ? 0 : Number(rawCount);

  return {
    data: properties,
    meta: {
      page: filters.page,
      pageSize: filters.pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / filters.pageSize)),
    },
  };
};

export const searchService = {
  searchProperties,
};
