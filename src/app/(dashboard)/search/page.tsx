"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { FavoriteButton } from "@/components/ui/favorite-button";

interface FilterState {
  query: string;
  location: string;
  minPrice: string;
  maxPrice: string;
  rooms: string;
}

interface PropertyItem {
  id: string;
  title: string;
  description: string;
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
  query: string | null;
  location: string | null;
  minPrice: string | null;
  maxPrice: string | null;
  rooms: number | null;
}

const PAGE_SIZE = 12;

const propertyItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
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
  data: z
    .object({
      query: z.string().nullable(),
      location: z.string().nullable(),
      minPrice: z.string().nullable(),
      maxPrice: z.string().nullable(),
      rooms: z.number().int().nullable(),
    })
    .nullable(),
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
};

const buildSearchParams = (filters: FilterState): URLSearchParams => {
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

  params.set("page", "1");
  params.set("pageSize", String(PAGE_SIZE));

  return params;
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
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const [properties, setProperties] = useState<PropertyItem[]>([]);
  const [meta, setMeta] = useState<SearchMeta | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [saveSearchFilterMessage, setSaveSearchFilterMessage] = useState<string>("");
  const [isSavingSearchFilter, setIsSavingSearchFilter] = useState<boolean>(false);
  const [favoritePropertyIds, setFavoritePropertyIds] = useState<string[]>([]);
  const [isSearchFilterReady, setIsSearchFilterReady] = useState<boolean>(false);
  const lastQueryRef = useRef<string>("");

  const fetchProperties = useCallback(
    async (nextFilters: FilterState, force = false): Promise<void> => {
      const params = buildSearchParams(nextFilters);
      const queryString = params.toString();

      if (!force && queryString === lastQueryRef.current) {
        return;
      }

      lastQueryRef.current = queryString;
      setIsLoading(true);
      setErrorMessage("");

      try {
        router.replace(queryString.length > 0 ? `/search?${queryString}` : "/search", {
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

      if (parsed.data) {
        setFilters(toFilterState(parsed.data));
      }
    } catch {
      // Keep default filters when loading persisted filters fails.
    } finally {
      setIsSearchFilterReady(true);
    }
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      void loadLatestSearchFilter();
    }, 0);

    return () => {
      clearTimeout(timeout);
    };
  }, [loadLatestSearchFilter]);

  useEffect(() => {
    if (!isSearchFilterReady) {
      return;
    }

    const timeout = setTimeout(() => {
      void fetchProperties(filters);
    }, 350);

    return () => {
      clearTimeout(timeout);
    };
  }, [filters, fetchProperties, isSearchFilterReady]);

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
    void fetchProperties(filters, true);
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

      setSaveSearchFilterMessage("Búsqueda guardada.");
    } catch {
      setSaveSearchFilterMessage("Error de red al guardar la búsqueda.");
    } finally {
      setIsSavingSearchFilter(false);
    }
  };

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
                setFilters((previous) => ({
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
                  setFilters((previous) => ({
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
                    setFilters((previous) => ({
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
                    setFilters((previous) => ({
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
                  setFilters((previous) => ({
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
              onClick={() => setFilters(defaultFilters)}
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
              {isSavingSearchFilter ? "Guardando..." : "Guardar búsqueda"}
            </button>

            {saveSearchFilterMessage ? (
              <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                {saveSearchFilterMessage}
              </p>
            ) : null}
          </div>
        </aside>

        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <p className="text-sm text-slate-600">
              <span className="font-semibold text-slate-900">
                {meta?.total ?? properties.length}
              </span>{" "}
              propiedades disponibles
            </p>
            {isLoading ? (
              <span className="text-xs font-semibold uppercase tracking-[0.12em] text-emerald-700">
                Cargando...
              </span>
            ) : null}
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
                    <div className="relative h-36 bg-gradient-to-br from-emerald-200 via-teal-100 to-slate-100">
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
        </div>
      </section>
    </div>
  );
}
