"use client";

import {
  FavoritesEmptyState,
  FavoritesGrid,
  FavoritesHero,
  FavoritesLoadingSkeleton,
} from "./favorites-page.components";
import { useFavoritesPageController } from "./favorites-page.controller";

export default function FavoritesPage() {
  const { favorites, isLoading, errorMessage, handleToggle } =
    useFavoritesPageController();

  return (
    <div className="space-y-6">
      <FavoritesHero />

      {errorMessage ? (
        <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {errorMessage}
        </p>
      ) : null}

      {isLoading ? <FavoritesLoadingSkeleton /> : null}

      {!isLoading && favorites.length === 0 && !errorMessage ? <FavoritesEmptyState /> : null}

      {favorites.length > 0 ? <FavoritesGrid favorites={favorites} onToggle={handleToggle} /> : null}
    </div>
  );
}
