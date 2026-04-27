"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { FavoriteButton } from "@/components/ui/favorite-button";

type SearchSort = "relevance" | "newest" | "priceAsc" | "priceDesc";

interface FilterState {
  query: string;
  location: string;
  minPrice: string;
  maxPrice: string;
  rooms: string;
  sort: SearchSort;
}

interface PropertyItem {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  price: number | string;
  location: string;
  rooms: number;
}

interface SearchMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

interface FavoriteListItem {
  propertyId: string;
}

interface SavedSearchFilterItem {
  id: string;
  query: string | null;
  location: string | null;
  minPrice: string | null;
  maxPrice: string | null;
  rooms: number | null;
}

const PAGE_SIZE = 12;
const sortValues: SearchSort[] = ["relevance", "newest", "priceAsc", "priceDesc"];

const propertyItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  imageUrl: z.string().url(),
  price: z.union([z.number(), z.string()]),
  location: z.string(),
  rooms: z.number().int(),
});

const searchResponseSchema = z.object({
  data: z.array(propertyItemSchema),
  meta: z.object({
    page: z.number().int(),
    pageSize: z.number().int(),
    total: z.number().int(),
    totalPages: z.number().int(),
  }),
});

const favoritesResponseSchema = z.object({
  data: z.array(
    z.object({
      propertyId: z.string(),
    }),
  ),
});

const savedSearchFilterResponseSchema = z.object({
  data: z.array(
    z.object({
      id: z.string(),
      query: z.string().nullable(),
      location: z.string().nullable(),
      minPrice: z.string().nullable(),
      maxPrice: z.string().nullable(),
      rooms: z.number().int().nullable(),
    }),
  ),
});

const currencyFormat = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

const defaultFilters: FilterState = {
  query: "",
  location: "",
  minPrice: "",
  maxPrice: "",
  rooms: "",
  sort: "relevance",
};

const isSearchSort = (value: string | null): value is SearchSort => {
  return value !== null && sortValues.includes(value as SearchSort);
};

const parsePositiveInt = (value: string | null): number => {
  if (!value) {
    return 1;
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) {
    return 1;
  }

  return parsed;
};

const buildSearchParams = (filters: FilterState, page: number): URLSearchParams => {
  const params = new URLSearchParams();

  const query = filters.query.trim();
  const location = filters.location.trim();
  const minPrice = filters.minPrice.trim();
  const maxPrice = filters.maxPrice.trim();
  const rooms = filters.rooms.trim();

  if (query.length > 0) {
    params.set("query", query);
  }
  if (location.length > 0) {
    params.set("location", location);
  }
  if (minPrice.length > 0) {
    params.set("minPrice", minPrice);
  }
  if (maxPrice.length > 0) {
    params.set("maxPrice", maxPrice);
  }
  if (rooms.length > 0) {
    params.set("rooms", rooms);
  }

  params.set("sort", filters.sort);
  params.set("page", String(page));
  params.set("pageSize", String(PAGE_SIZE));

  return params;
};

const buildPdfDownloadHref = (filters: FilterState): string => {
  const params = buildSearchParams(filters, 1);
  params.set("pageSize", "50");
  return `/api/properties/search/pdf?${params.toString()}`;
};

const parseStateFromUrl = (search: string): {
  filters: FilterState;
  page: number;
  hasUserParams: boolean;
} => {
  const params = new URLSearchParams(search);

  const query = params.get("query")?.trim() ?? "";
  const location = params.get("location")?.trim() ?? "";
  const minPrice = params.get("minPrice")?.trim() ?? "";
  const maxPrice = params.get("maxPrice")?.trim() ?? "";
  const rooms = params.get("rooms")?.trim() ?? "";
  const sortParam = params.get("sort");
  const sort: SearchSort = isSearchSort(sortParam) ? sortParam : "relevance";
  const page = parsePositiveInt(params.get("page"));

  const hasUserParams =
    query.length > 0 ||
    location.length > 0 ||
    minPrice.length > 0 ||
    maxPrice.length > 0 ||
    rooms.length > 0 ||
    isSearchSort(sortParam) ||
    page > 1;

  return {
    filters: {
      query,
      location,
      minPrice,
      maxPrice,
      rooms,
      sort,
    },
    page,
    hasUserParams,
  };
};

const toNumericPrice = (value: string | number): number => {
  return typeof value === "number" ? value : Number(value);
};

const toFilterState = (saved: SavedSearchFilterItem): FilterState => {
  return {
    query: saved.query ?? "",
    location: saved.location ?? "",
    minPrice: saved.minPrice ?? "",
    maxPrice: saved.maxPrice ?? "",
    rooms: saved.rooms === null ? "" : String(saved.rooms),
    sort: "relevance",
  };
};

const toSaveSearchFilterPayload = (filters: FilterState) => {
  const query = filters.query.trim();
  const location = filters.location.trim();
  const minPriceRaw = filters.minPrice.trim();
  const maxPriceRaw = filters.maxPrice.trim();
  const roomsRaw = filters.rooms.trim();
  const minPrice = minPriceRaw.length > 0 ? Number(minPriceRaw) : undefined;
  const maxPrice = maxPriceRaw.length > 0 ? Number(maxPriceRaw) : undefined;
  const rooms = roomsRaw.length > 0 ? Number(roomsRaw) : undefined;

  return {
    query: query.length > 0 ? query : undefined,
    location: location.length > 0 ? location : undefined,
    minPrice: Number.isFinite(minPrice) ? minPrice : undefined,
    maxPrice: Number.isFinite(maxPrice) ? maxPrice : undefined,
    rooms: Number.isFinite(rooms) ? rooms : undefined,
  };
};

export default function SearchPage() {
  const router = useRouter();
  const [initialUrlState] = useState(() => {
    if (typeof window === "undefined") {
      return {
        filters: defaultFilters,
        page: 1,
        hasUserParams: false,
      };
    }

    return parseStateFromUrl(window.location.search);
  });
  const [filters, setFilters] = useState<FilterState>(initialUrlState.filters);
  const [currentPage, setCurrentPage] = useState<number>(initialUrlState.page);
  const [properties, setProperties] = useState<PropertyItem[]>([]);
  const [meta, setMeta] = useState<SearchMeta | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [saveSearchFilterMessage, setSaveSearchFilterMessage] = useState<string>("");
  const [isSavingSearchFilter, setIsSavingSearchFilter] = useState<boolean>(false);
  const [favoritePropertyIds, setFavoritePropertyIds] = useState<string[]>([]);
  const [isSearchFilterReady, setIsSearchFilterReady] = useState<boolean>(
    initialUrlState.hasUserParams,
  );
  const hasLoadedSavedFiltersRef = useRef<boolean>(false);
  const lastQueryRef = useRef<string>("");

  const fetchProperties = useCallback(
    async (
      nextFilters: FilterState,
      nextPage: number,
      force = false,
    ): Promise<void> => {
      const params = buildSearchParams(nextFilters, nextPage);
      const queryString = params.toString();

      if (!force && queryString === lastQueryRef.current) {
        return;
      }

      lastQueryRef.current = queryString;
      setIsLoading(true);
      setErrorMessage("");

      try {
        router.replace(`/search?${queryString}`, {
          scroll: false,
        });

        const response = await fetch(`/api/properties/search?${queryString}`, {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        const responseData: unknown = await response.json();

        if (!response.ok) {
          if (
            typeof responseData === "object" &&
            responseData !== null &&
            "error" in responseData &&
            typeof responseData.error === "string"
          ) {
            setErrorMessage(responseData.error);
          } else {
            setErrorMessage("No fue posible cargar propiedades. Intenta nuevamente.");
          }
          setProperties([]);
          setMeta(null);
          return;
        }

        const parsed = searchResponseSchema.parse(responseData);
        setProperties(parsed.data);
        setMeta(parsed.meta);

        if (parsed.meta.page !== nextPage) {
          setCurrentPage(parsed.meta.page);
        }
      } catch {
        setErrorMessage("Error de red o respuesta invalida del servidor.");
        setProperties([]);
        setMeta(null);
      } finally {
        setIsLoading(false);
      }
    },
    [router],
  );

  const fetchFavorites = useCallback(async (): Promise<void> => {
    try {
      const response = await fetch("/api/favorites", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      if (!response.ok) {
        setFavoritePropertyIds([]);
        return;
      }

      const payload: unknown = await response.json();
      const parsed = favoritesResponseSchema.parse(payload);
      const ids = parsed.data.map((favorite: FavoriteListItem) => favorite.propertyId);
      setFavoritePropertyIds(ids);
    } catch {
      setFavoritePropertyIds([]);
    }
  }, []);

  const loadLatestSearchFilter = useCallback(async (): Promise<void> => {
    try {
      const response = await fetch("/api/search-filters", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      if (!response.ok) {
        return;
      }

      const payload: unknown = await response.json();
      const parsed = savedSearchFilterResponseSchema.parse(payload);

      if (parsed.data.length > 0) {
        setFilters(toFilterState(parsed.data[0]));
        setCurrentPage(1);
      }
    } catch {
      // Keep default filters when loading persisted filters fails.
    } finally {
      setIsSearchFilterReady(true);
    }
  }, []);

  const updateFilters = (updater: (previous: FilterState) => FilterState): void => {
    setFilters(updater);
    setCurrentPage(1);
  };

  useEffect(() => {
    if (initialUrlState.hasUserParams || hasLoadedSavedFiltersRef.current) {
      return;
    }

    hasLoadedSavedFiltersRef.current = true;

    void loadLatestSearchFilter();
  }, [initialUrlState.hasUserParams, loadLatestSearchFilter]);

  useEffect(() => {
    if (!isSearchFilterReady) {
      return;
    }

    const timeout = setTimeout(() => {
      void fetchProperties(filters, currentPage);
    }, 350);

    return () => {
      clearTimeout(timeout);
    };
  }, [currentPage, fetchProperties, filters, isSearchFilterReady]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      void fetchFavorites();
    }, 0);

    return () => {
      clearTimeout(timeout);
    };
  }, [fetchFavorites]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void fetchProperties(filters, currentPage, true);
  };

  const handleFavoriteToggle = (propertyId: string, isFavorite: boolean): void => {
    setFavoritePropertyIds((previous) => {
      const exists = previous.includes(propertyId);

      if (isFavorite) {
        return exists ? previous : [...previous, propertyId];
      }

      return previous.filter((id) => id !== propertyId);
    });
  };

  const handleSaveSearchFilter = async (): Promise<void> => {
    if (isSavingSearchFilter) {
      return;
    }

    setIsSavingSearchFilter(true);
    setSaveSearchFilterMessage("");

    try {
      const payload = toSaveSearchFilterPayload(filters);
      const response = await fetch("/api/search-filters", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        setSaveSearchFilterMessage("No pudimos guardar el filtro. Intenta nuevamente.");
        return;
      }

      setSaveSearchFilterMessage("Busqueda guardada.");
    } catch {
      setSaveSearchFilterMessage("Error de red al guardar la busqueda.");
    } finally {
      setIsSavingSearchFilter(false);
    }
  };

  const pdfDownloadHref = buildPdfDownloadHref(filters);

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">
              Valle de Aburra
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
              Busca inmuebles en minutos
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Encuentra apartamentos, casas y lofts por zona, precio y
              habitaciones.
            </p>
          </div>

          <form className="grid gap-3 sm:grid-cols-[1fr_auto]" onSubmit={handleSubmit}>
            <label htmlFor="query" className="sr-only">
              Buscar propiedad
            </label>
            <input
              id="query"
              name="query"
              type="text"
              value={filters.query}
              onChange={(event) =>
                updateFilters((previous) => ({
                  ...previous,
                  query: event.target.value,
                }))
              }
              placeholder="Ej: apartamento en Envigado con balcon"
              className="h-12 rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />
            <button
              type="submit"
              className="h-12 rounded-xl bg-emerald-600 px-6 text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
              Buscar
            </button>
          </form>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="h-fit rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900">Filtros</h2>
          <div className="mt-4 space-y-4">
            <div className="space-y-2">
              <label
                htmlFor="location"
                className="text-sm font-medium text-slate-700"
              >
                Ubicacion
              </label>
              <select
                id="location"
                name="location"
                value={filters.location}
                onChange={(event) =>
                  updateFilters((previous) => ({
                    ...previous,
                    location: event.target.value,
                  }))
                }
                className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              >
                <option value="">Todas las zonas</option>
                <option value="Medellin">Medellin</option>
                <option value="Envigado">Envigado</option>
                <option value="Sabaneta">Sabaneta</option>
                <option value="Bello">Bello</option>
                <option value="Itagui">Itagui</option>
                <option value="La Estrella">La Estrella</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label
                  htmlFor="minPrice"
                  className="text-sm font-medium text-slate-700"
                >
                  Precio min
                </label>
                <input
                  id="minPrice"
                  name="minPrice"
                  type="number"
                  value={filters.minPrice}
                  onChange={(event) =>
                    updateFilters((previous) => ({
                      ...previous,
                      minPrice: event.target.value,
                    }))
                  }
                  placeholder="1200000"
                  className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
              </div>
              <div className="space-y-2">
                <label
                  htmlFor="maxPrice"
                  className="text-sm font-medium text-slate-700"
                >
                  Precio max
                </label>
                <input
                  id="maxPrice"
                  name="maxPrice"
                  type="number"
                  value={filters.maxPrice}
                  onChange={(event) =>
                    updateFilters((previous) => ({
                      ...previous,
                      maxPrice: event.target.value,
                    }))
                  }
                  placeholder="5000000"
                  className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="rooms"
                className="text-sm font-medium text-slate-700"
              >
                Habitaciones
              </label>
              <select
                id="rooms"
                name="rooms"
                value={filters.rooms}
                onChange={(event) =>
                  updateFilters((previous) => ({
                    ...previous,
                    rooms: event.target.value,
                  }))
                }
                className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              >
                <option value="">Cualquiera</option>
                <option value="1">1+</option>
                <option value="2">2+</option>
                <option value="3">3+</option>
                <option value="4">4+</option>
              </select>
            </div>

            <button
              type="button"
              onClick={() => {
                setFilters(defaultFilters);
                setCurrentPage(1);
              }}
              className="h-11 w-full rounded-xl border border-slate-300 bg-slate-50 px-4 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-100"
            >
              Limpiar filtros
            </button>

            <button
              type="button"
              onClick={() => {
                void handleSaveSearchFilter();
              }}
              disabled={isSavingSearchFilter}
              className="h-11 w-full rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
            >
              {isSavingSearchFilter ? "Guardando..." : "Guardar busqueda"}
            </button>

            {saveSearchFilterMessage ? (
              <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                {saveSearchFilterMessage}
              </p>
            ) : null}
          </div>
        </aside>

        <div className="space-y-4">
          <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-600">
              <span className="font-semibold text-slate-900">
                {meta?.total ?? properties.length}
              </span>{" "}
              propiedades disponibles
            </p>

            <div className="flex items-center gap-3">
              <a
                href={pdfDownloadHref}
                className="inline-flex h-9 items-center rounded-lg border border-emerald-300 bg-emerald-50 px-3 text-sm font-medium text-emerald-800 transition hover:border-emerald-400 hover:bg-emerald-100"
              >
                Descargar PDF
              </a>
              <label htmlFor="sort" className="text-sm font-medium text-slate-700">
                Ordenar
              </label>
              <select
                id="sort"
                name="sort"
                value={filters.sort}
                onChange={(event) =>
                  updateFilters((previous) => ({
                    ...previous,
                    sort: event.target.value as SearchSort,
                  }))
                }
                className="h-9 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              >
                <option value="relevance">Relevancia</option>
                <option value="newest">Mas recientes</option>
                <option value="priceAsc">Precio: menor a mayor</option>
                <option value="priceDesc">Precio: mayor a menor</option>
              </select>

              {isLoading ? (
                <span className="text-xs font-semibold uppercase tracking-[0.12em] text-emerald-700">
                  Cargando...
                </span>
              ) : null}
            </div>
          </div>

          {errorMessage ? (
            <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {errorMessage}
            </p>
          ) : null}

          {isLoading && properties.length === 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={`skeleton-${index}`}
                  className="animate-pulse overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                >
                  <div className="h-36 bg-slate-200" />
                  <div className="space-y-3 p-4">
                    <div className="h-4 rounded bg-slate-200" />
                    <div className="h-4 w-2/3 rounded bg-slate-200" />
                    <div className="h-5 w-1/2 rounded bg-slate-200" />
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          {!isLoading && properties.length === 0 && !errorMessage ? (
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-10 text-center shadow-sm">
              <p className="text-base font-medium text-slate-900">
                No encontramos propiedades con esos filtros.
              </p>
              <p className="mt-1 text-sm text-slate-600">
                Ajusta el rango de precios o la ubicacion para ampliar resultados.
              </p>
            </div>
          ) : null}

          {properties.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {properties.map((property) => (
                <article
                  key={property.id}
                  className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <FavoriteButton
                    key={`${property.id}-${favoritePropertyIds.includes(property.id) ? "1" : "0"}`}
                    propertyId={property.id}
                    initialIsFavorite={favoritePropertyIds.includes(property.id)}
                    onToggle={(isFavorite) =>
                      handleFavoriteToggle(property.id, isFavorite)
                    }
                    className="absolute right-3 top-3 z-10"
                  />
                  <Link href={`/search/${property.id}`} className="block">
                    <div
                      className="relative h-36 bg-linear-to-br from-emerald-200 via-teal-100 to-slate-100 bg-cover bg-center"
                      style={{
                        backgroundImage: `linear-gradient(to top, rgba(15, 23, 42, 0.2), rgba(15, 23, 42, 0.05)), url(${property.imageUrl})`,
                      }}
                    >
                      <span className="absolute bottom-3 left-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-slate-700">
                        Propiedad
                      </span>
                    </div>
                  </Link>
                  <div className="space-y-3 p-4">
                    <div>
                      <h3 className="line-clamp-2 text-base font-semibold text-slate-900">
                        {property.title}
                      </h3>
                      <p className="mt-1 text-sm text-slate-500">
                        {property.location}
                      </p>
                    </div>

                    <p className="text-lg font-bold text-emerald-700">
                      {currencyFormat.format(toNumericPrice(property.price))}
                      <span className="ml-1 text-xs font-medium text-slate-500">
                        / mes
                      </span>
                    </p>

                    <p className="line-clamp-2 text-sm text-slate-600">
                      {property.description}
                    </p>

                    <div className="flex items-center gap-2 text-xs text-slate-600">
                      <span className="rounded-full bg-slate-100 px-2.5 py-1">
                        {property.rooms} hab
                      </span>
                    </div>

                    <div className="pt-1">
                      <Link
                        href={`/search/${property.id}`}
                        className="inline-flex h-9 items-center rounded-lg bg-slate-900 px-3 text-sm font-medium text-white transition hover:bg-slate-800"
                      >
                        Ver detalle
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : null}

          {meta && meta.totalPages > 1 ? (
            <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-600">
                Pagina {meta.page} de {meta.totalPages}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setCurrentPage((previous) => Math.max(1, previous - 1));
                  }}
                  disabled={isLoading || currentPage <= 1}
                  className="h-9 rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Anterior
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCurrentPage((previous) =>
                      Math.min(meta.totalPages, previous + 1),
                    );
                  }}
                  disabled={isLoading || currentPage >= meta.totalPages}
                  className="h-9 rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Siguiente
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
