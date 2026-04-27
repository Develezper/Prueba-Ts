import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

const searchFilterSelect = {
  id: true,
  query: true,
  minPrice: true,
  maxPrice: true,
  location: true,
  rooms: true,
  createdAt: true,
  updatedAt: true,
} as const;

type SearchFilterSelected = Prisma.SearchFilterGetPayload<{
  select: typeof searchFilterSelect;
}>;

export interface SaveSearchFilterInput {
  query?: string;
  minPrice?: number;
  maxPrice?: number;
  location?: string;
  rooms?: number;
}

export interface UserSearchFilter {
  id: string;
  query: string | null;
  minPrice: string | null;
  maxPrice: string | null;
  location: string | null;
  rooms: number | null;
  createdAt: Date;
  updatedAt: Date;
}

const normalizeNullableString = (value: string | undefined): string | null => {
  if (value === undefined) {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
};

const mapSearchFilter = (filter: SearchFilterSelected): UserSearchFilter => {
  return {
    id: filter.id,
    query: filter.query,
    minPrice: filter.minPrice === null ? null : filter.minPrice.toString(),
    maxPrice: filter.maxPrice === null ? null : filter.maxPrice.toString(),
    location: filter.location,
    rooms: filter.rooms,
    createdAt: filter.createdAt,
    updatedAt: filter.updatedAt,
  };
};

export const getLatestForUser = async (
  userId: string,
): Promise<UserSearchFilter | null> => {
  const latest = await prisma.searchFilter.findFirst({
    where: {
      userId,
    },
    orderBy: {
      updatedAt: "desc",
    },
    select: searchFilterSelect,
  });

  return latest ? mapSearchFilter(latest) : null;
};

export const saveLatestForUser = async (
  userId: string,
  input: SaveSearchFilterInput,
): Promise<UserSearchFilter> => {
  const data = {
    query: normalizeNullableString(input.query),
    minPrice: input.minPrice ?? null,
    maxPrice: input.maxPrice ?? null,
    location: normalizeNullableString(input.location),
    rooms: input.rooms ?? null,
  };

  const latest = await prisma.searchFilter.findFirst({
    where: {
      userId,
    },
    orderBy: {
      updatedAt: "desc",
    },
    select: {
      id: true,
    },
  });

  const saved = latest
    ? await prisma.searchFilter.update({
        where: {
          id: latest.id,
        },
        data,
        select: searchFilterSelect,
      })
    : await prisma.searchFilter.create({
        data: {
          userId,
          ...data,
        },
        select: searchFilterSelect,
      });

  return mapSearchFilter(saved);
};

export const searchFilterService = {
  getLatestForUser,
  saveLatestForUser,
};
