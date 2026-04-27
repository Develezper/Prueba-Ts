import Link from "next/link";
import { FavoriteButton } from "@/components/ui/favorite-button";
import {
  currencyFormat,
  PropertyItem,
  SearchMeta,
  toNumericPrice,
} from "./search-page.shared";

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
  onFavoriteToggle: (propertyId: string, isFavorite: boolean) => void;
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
              onToggle={(nextFavorite) => {
                onFavoriteToggle(property.id, nextFavorite);
              }}
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
