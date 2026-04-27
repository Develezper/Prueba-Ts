"use client";

import { SearchFiltersPanel, SearchHero, SearchResultsToolbar } from "./search-page.controls";
import {
  PropertyGrid,
  SearchEmptyState,
  SearchLoadingSkeleton,
  SearchPagination,
} from "./search-page.results";
import { useSearchPageController } from "./search-page.controller";

export default function SearchPage() {
  const {
    filters,
    currentPage,
    currentPageSize,
    properties,
    meta,
    isLoading,
    errorMessage,
    saveSearchFilterMessage,
    priceRangeValidationMessage,
    hasInvalidPriceRange,
    isSavingSearchFilter,
    favoritePropertyIds,
    viewerRole,
    pdfDownloadHref,
    setFilterValue,
    clearFilters,
    setPageSize,
    saveSearchFilter,
    submitSearch,
    toggleFavorite,
    goToPreviousPage,
    goToNextPage,
  } = useSearchPageController();

  return (
    <div className="space-y-6">
      <SearchHero
        query={filters.query}
        isSearchDisabled={hasInvalidPriceRange}
        onQueryChange={(value) => {
          setFilterValue("query", value);
        }}
        onSubmit={submitSearch}
      />

      <section className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <SearchFiltersPanel
          filters={filters}
          isSavingSearchFilter={isSavingSearchFilter}
          hasInvalidPriceRange={hasInvalidPriceRange}
          priceRangeValidationMessage={priceRangeValidationMessage}
          saveSearchFilterMessage={saveSearchFilterMessage}
          onFilterChange={setFilterValue}
          onClearFilters={clearFilters}
          onSaveSearchFilter={saveSearchFilter}
        />

        <div className="space-y-4">
          <SearchResultsToolbar
            totalProperties={meta?.total ?? properties.length}
            viewerRole={viewerRole}
            pdfDownloadHref={pdfDownloadHref}
            sort={filters.sort}
            pageSize={currentPageSize}
            isLoading={isLoading}
            onSortChange={(value) => {
              setFilterValue("sort", value);
            }}
            onPageSizeChange={(value) => {
              setPageSize(value);
            }}
          />

          {errorMessage ? (
            <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {errorMessage}
            </p>
          ) : null}

          {isLoading && properties.length === 0 ? <SearchLoadingSkeleton /> : null}

          {!isLoading && properties.length === 0 && !errorMessage ? <SearchEmptyState /> : null}

          {properties.length > 0 ? (
            <PropertyGrid
              properties={properties}
              favoritePropertyIds={favoritePropertyIds}
              onFavoriteToggle={toggleFavorite}
            />
          ) : null}

          {meta && meta.totalPages > 1 ? (
            <SearchPagination
              meta={meta}
              isLoading={isLoading}
              currentPage={currentPage}
              onPrevious={goToPreviousPage}
              onNext={goToNextPage}
            />
          ) : null}
        </div>
      </section>
    </div>
  );
}
