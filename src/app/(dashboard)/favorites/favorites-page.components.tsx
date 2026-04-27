import Link from "next/link";
import { FavoriteButton } from "@/components/ui/favorite-button";
import {
  FavoriteItem,
  currencyFormat,
  toNumericPrice,
} from "./favorites-page.shared";

export function FavoritesHero() {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-rose-700">
        Favoritos
      </p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
        Propiedades guardadas
      </h1>
      <p className="mt-2 text-sm text-slate-600">
        Administra tus inmuebles favoritos para hacer seguimiento rapido.
      </p>
    </section>
  );
}

export function FavoritesLoadingSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={`favorite-skeleton-${index}`}
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

export function FavoritesEmptyState() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-10 text-center shadow-sm">
      <p className="text-base font-medium text-slate-900">
        Aun no tienes propiedades favoritas.
      </p>
      <p className="mt-1 text-sm text-slate-600">
        Explora resultados y guarda las que mas te interesen.
      </p>
      <Link
        href="/search"
        className="mt-5 inline-flex h-10 items-center rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
      >
        Ir a buscar propiedades
      </Link>
    </div>
  );
}

interface FavoritesGridProps {
  favorites: FavoriteItem[];
  onToggle: (propertyId: string, isFavorite: boolean) => void;
}

export function FavoritesGrid({ favorites, onToggle }: FavoritesGridProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {favorites.map((favorite) => (
        <article
          key={favorite.id}
          className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <FavoriteButton
            propertyId={favorite.propertyId}
            initialIsFavorite={true}
            onToggle={(isFavorite) => onToggle(favorite.propertyId, isFavorite)}
            className="absolute right-3 top-3 z-10"
          />
          <Link href={`/search/${favorite.propertyId}`} className="block">
            <div
              className="relative h-36 bg-linear-to-br from-rose-100 via-orange-50 to-slate-100 bg-cover bg-center"
              style={{
                backgroundImage: `linear-gradient(to top, rgba(15, 23, 42, 0.22), rgba(15, 23, 42, 0.04)), url(${favorite.property.imageUrl})`,
              }}
            >
              <span className="absolute bottom-3 left-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-slate-700">
                Favorito
              </span>
            </div>
          </Link>
          <div className="space-y-3 p-4">
            <div>
              <h2 className="line-clamp-2 text-base font-semibold text-slate-900">
                {favorite.property.title}
              </h2>
              <p className="mt-1 text-sm text-slate-500">{favorite.property.location}</p>
            </div>

            <p className="text-lg font-bold text-emerald-700">
              {currencyFormat.format(toNumericPrice(favorite.property.price))}
              <span className="ml-1 text-xs font-medium text-slate-500">/ mes</span>
            </p>

            <p className="line-clamp-2 text-sm text-slate-600">{favorite.property.description}</p>

            <div className="flex items-center gap-2 text-xs text-slate-600">
              <span className="rounded-full bg-slate-100 px-2.5 py-1">
                {favorite.property.rooms} hab
              </span>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
