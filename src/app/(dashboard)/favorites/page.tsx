"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { z } from "zod";
import { FavoriteButton } from "@/components/ui/favorite-button";

interface FavoriteProperty {
  id: string;
  title: string;
  description: string;
  location: string;
  price: number | string;
  rooms: number;
}

interface FavoriteItem {
  id: string;
  propertyId: string;
  property: FavoriteProperty;
}

const favoritePropertySchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  location: z.string(),
  price: z.union([z.number(), z.string()]),
  rooms: z.number().int(),
});

const favoritesResponseSchema = z.object({
  data: z.array(
    z.object({
      id: z.string(),
      propertyId: z.string(),
      property: favoritePropertySchema,
    }),
  ),
});

const currencyFormat = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

const toNumericPrice = (value: string | number): number => {
  return typeof value === "number" ? value : Number(value);
};

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const loadFavorites = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const response = await fetch("/api/favorites", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      const payload: unknown = await response.json();

      if (!response.ok) {
        if (
          typeof payload === "object" &&
          payload !== null &&
          "error" in payload &&
          typeof payload.error === "string"
        ) {
          setErrorMessage(payload.error);
        } else {
          setErrorMessage("No fue posible cargar tus favoritos.");
        }
        setFavorites([]);
        return;
      }

      const parsed = favoritesResponseSchema.parse(payload);
      setFavorites(parsed.data);
    } catch {
      setErrorMessage("Error de red o respuesta invalida del servidor.");
      setFavorites([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      void loadFavorites();
    }, 0);

    return () => {
      clearTimeout(timeout);
    };
  }, [loadFavorites]);

  const handleToggle = (propertyId: string, isFavorite: boolean): void => {
    if (!isFavorite) {
      setFavorites((previous) =>
        previous.filter((favorite) => favorite.propertyId !== propertyId),
      );
    }
  };

  return (
    <div className="space-y-6">
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

      {errorMessage ? (
        <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {errorMessage}
        </p>
      ) : null}

      {isLoading ? (
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
      ) : null}

      {!isLoading && favorites.length === 0 && !errorMessage ? (
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
      ) : null}

      {favorites.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {favorites.map((favorite) => (
            <article
              key={favorite.id}
              className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <FavoriteButton
                propertyId={favorite.propertyId}
                initialIsFavorite={true}
                onToggle={(isFavorite) =>
                  handleToggle(favorite.propertyId, isFavorite)
                }
                className="absolute right-3 top-3 z-10"
              />
              <Link href={`/search/${favorite.propertyId}`} className="block">
                <div className="relative h-36 bg-gradient-to-br from-rose-100 via-orange-50 to-slate-100">
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
                  <p className="mt-1 text-sm text-slate-500">
                    {favorite.property.location}
                  </p>
                </div>

                <p className="text-lg font-bold text-emerald-700">
                  {currencyFormat.format(toNumericPrice(favorite.property.price))}
                  <span className="ml-1 text-xs font-medium text-slate-500">
                    / mes
                  </span>
                </p>

                <p className="line-clamp-2 text-sm text-slate-600">
                  {favorite.property.description}
                </p>

                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <span className="rounded-full bg-slate-100 px-2.5 py-1">
                    {favorite.property.rooms} hab
                  </span>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </div>
  );
}
