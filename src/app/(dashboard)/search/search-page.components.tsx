import { FormEvent } from "react";
import Link from "next/link";
import { FavoriteButton } from "@/components/ui/favorite-button";
import {
  currencyFormat,
  FilterState,
  PropertyItem,
  SearchMeta,
  SearchPageSize,
  SearchSort,
  ViewerRole,
  pageSizeValues,
  toNumericPrice,
} from "./search-page.shared";

interface SearchHeroProps {
  query: string;
  isSearchDisabled: boolean;
  onQueryChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

export function SearchHero({
  query,
  isSearchDisabled,
  onQueryChange,
  onSubmit,
}: SearchHeroProps) {
  return (
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
            Encuentra apartamentos, casas y lofts por zona, precio y habitaciones.
          </p>
        </div>

        <form className="grid gap-3 sm:grid-cols-[1fr_auto]" onSubmit={onSubmit}>
          <label htmlFor="query" className="sr-only">
            Buscar propiedad
          </label>
          <input
            id="query"
            name="query"
            type="text"
            value={query}
            onChange={(event) => {
              onQueryChange(event.target.value);
            }}
            placeholder="Ej: apartamento en Envigado con balcon"
            className="h-12 rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          />
          <button
            type="submit"
            disabled={isSearchDisabled}
            className="h-12 rounded-xl bg-emerald-600 px-6 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
          >
            Buscar ahora
          </button>
        </form>
      </div>
    </section>
  );
}

interface SearchFiltersPanelProps {
  filters: FilterState;
  isSavingSearchFilter: boolean;
  hasInvalidPriceRange: boolean;
  priceRangeValidationMessage: string;
  saveSearchFilterMessage: string;
  onPriceRangeBlur: () => void;
  onFilterChange: <K extends keyof FilterState>(
    key: K,
    value: FilterState[K],
  ) => void;
  onClearFilters: () => void;
  onSaveSearchFilter: () => void;
}

export function SearchFiltersPanel({
  filters,
  isSavingSearchFilter,
  hasInvalidPriceRange,
  priceRangeValidationMessage,
  saveSearchFilterMessage,
  onPriceRangeBlur,
  onFilterChange,
  onClearFilters,
  onSaveSearchFilter,
}: SearchFiltersPanelProps) {
  return (
    <aside className="h-fit rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-base font-semibold text-slate-900">Filtros</h2>
      <div className="mt-4 space-y-4">
        <div className="space-y-2">
          <label htmlFor="location" className="text-sm font-medium text-slate-700">
            Ubicacion
          </label>
          <select
            id="location"
            name="location"
            value={filters.location}
            onChange={(event) => {
              onFilterChange("location", event.target.value);
            }}
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
            <label htmlFor="minPrice" className="text-sm font-medium text-slate-700">
              Precio min
            </label>
            <input
              id="minPrice"
              name="minPrice"
              type="number"
              value={filters.minPrice}
              onChange={(event) => {
                onFilterChange("minPrice", event.target.value);
              }}
              onBlur={onPriceRangeBlur}
              placeholder="1200000"
              className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="maxPrice" className="text-sm font-medium text-slate-700">
              Precio max
            </label>
            <input
              id="maxPrice"
              name="maxPrice"
              type="number"
              value={filters.maxPrice}
              onChange={(event) => {
                onFilterChange("maxPrice", event.target.value);
              }}
              onBlur={onPriceRangeBlur}
              placeholder="5000000"
              className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />
          </div>
        </div>

        {hasInvalidPriceRange ? (
          <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
            {priceRangeValidationMessage}
          </p>
        ) : null}

        <div className="space-y-2">
          <label htmlFor="rooms" className="text-sm font-medium text-slate-700">
            Habitaciones
          </label>
          <select
            id="rooms"
            name="rooms"
            value={filters.rooms}
            onChange={(event) => {
              onFilterChange("rooms", event.target.value);
            }}
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
          onClick={onClearFilters}
          className="h-11 w-full rounded-xl border border-slate-300 bg-slate-50 px-4 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-100"
        >
          Limpiar filtros
        </button>

        <button
          type="button"
          onClick={onSaveSearchFilter}
          disabled={isSavingSearchFilter || hasInvalidPriceRange}
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
  );
}

interface SearchResultsToolbarProps {
  totalProperties: number;
  viewerRole: ViewerRole;
  pdfDownloadHref: string;
  sort: SearchSort;
  pageSize: SearchPageSize;
  isLoading: boolean;
  onSortChange: (value: SearchSort) => void;
  onPageSizeChange: (value: SearchPageSize) => void;
}

export function SearchResultsToolbar({
  totalProperties,
  viewerRole,
  pdfDownloadHref,
  sort,
  pageSize,
  isLoading,
  onSortChange,
  onPageSizeChange,
}: SearchResultsToolbarProps) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-slate-600">
        <span className="font-semibold text-slate-900">{totalProperties}</span> propiedades
        disponibles
      </p>

      <div className="flex items-center gap-3">
        {viewerRole === "ADMIN" ? (
          <a
            href={pdfDownloadHref}
            className="inline-flex h-9 items-center rounded-lg border border-emerald-300 bg-emerald-50 px-3 text-sm font-medium text-emerald-800 transition hover:border-emerald-400 hover:bg-emerald-100"
          >
            Descargar PDF
          </a>
        ) : null}
        <label htmlFor="sort" className="text-sm font-medium text-slate-700">
          Ordenar
        </label>
        <select
          id="sort"
          name="sort"
          value={sort}
          onChange={(event) => {
            onSortChange(event.target.value as SearchSort);
          }}
          className="h-9 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
        >
          <option value="relevance">Relevancia</option>
          <option value="newest">Mas recientes</option>
          <option value="priceAsc">Precio: menor a mayor</option>
          <option value="priceDesc">Precio: mayor a menor</option>
        </select>

        <label htmlFor="pageSize" className="text-sm font-medium text-slate-700">
          Mostrar
        </label>
        <select
          id="pageSize"
          name="pageSize"
          value={String(pageSize)}
          onChange={(event) => {
            onPageSizeChange(Number(event.target.value) as SearchPageSize);
          }}
          className="h-9 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
        >
          {pageSizeValues.map((size) => (
            <option key={size} value={String(size)}>
              {size}
            </option>
          ))}
        </select>

        {isLoading ? (
          <span className="text-xs font-semibold uppercase tracking-[0.12em] text-emerald-700">
            Cargando...
          </span>
        ) : null}
      </div>
    </div>
  );
}

export function SearchLoadingSkeleton() {
  return (
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
  );
}

export function SearchEmptyState() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-10 text-center shadow-sm">
      <p className="text-base font-medium text-slate-900">
        No encontramos propiedades con esos filtros.
      </p>
      <p className="mt-1 text-sm text-slate-600">
        Ajusta el rango de precios o la ubicacion para ampliar resultados.
      </p>
    </div>
  );
}

interface PropertyGridProps {
  properties: PropertyItem[];
  favoritePropertyIds: string[];
  onFavoriteToggle?: (propertyId: string, isFavorite: boolean) => void;
}

export function PropertyGrid({
  properties,
  favoritePropertyIds,
  onFavoriteToggle,
}: PropertyGridProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {properties.map((property) => {
        const isFavorite = favoritePropertyIds.includes(property.id);

        return (
          <article
            key={property.id}
            className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <FavoriteButton
              key={`${property.id}-${isFavorite ? "1" : "0"}`}
              propertyId={property.id}
              initialIsFavorite={isFavorite}
              onToggle={onFavoriteToggle
                ? (nextFavorite) => {
                  onFavoriteToggle(property.id, nextFavorite);
                }
                : undefined}
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
                <p className="mt-1 text-sm text-slate-500">{property.location}</p>
              </div>

              <p className="text-lg font-bold text-emerald-700">
                {currencyFormat.format(toNumericPrice(property.price))}
                <span className="ml-1 text-xs font-medium text-slate-500">/ mes</span>
              </p>

              <p className="line-clamp-2 text-sm text-slate-600">{property.description}</p>

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
        );
      })}
    </div>
  );
}

interface SearchPaginationProps {
  meta: SearchMeta;
  isLoading: boolean;
  currentPage: number;
  onPrevious: () => void;
  onNext: () => void;
}

export function SearchPagination({
  meta,
  isLoading,
  currentPage,
  onPrevious,
  onNext,
}: SearchPaginationProps) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-slate-600">
        Pagina {meta.page} de {meta.totalPages}
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onPrevious}
          disabled={isLoading || currentPage <= 1}
          className="h-9 rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Anterior
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={isLoading || currentPage >= meta.totalPages}
          className="h-9 rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Siguiente
        </button>
      </div>
    </div>
  );
}
