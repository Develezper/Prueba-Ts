import { FormEvent } from "react";
import {
  FilterState,
  SearchPageSize,
  SearchSort,
  ViewerRole,
  pageSizeValues,
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
            Buscar
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
