"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FilterState,
  PAGE_SIZE,
  PropertyItem,
  SearchPageSize,
  SearchMeta,
  ViewerRole,
  buildPdfDownloadHref,
  buildSearchParams,
  defaultFilters,
  parseStateFromUrl,
} from "./search-page.shared";
import {
  requestFavoriteIds,
  requestLatestSearchFilter,
  requestProperties,
  requestSaveSearchFilter,
} from "./search-page.api";

export function useSearchPageController() {
  const router = useRouter();
  const [initialUrlState] = useState(() => {
    if (typeof window === "undefined") {
      return {
        filters: defaultFilters,
        page: 1,
        pageSize: PAGE_SIZE,
        hasUserParams: false,
      };
    }

    return parseStateFromUrl(window.location.search);
  });
  const [filters, setFilters] = useState<FilterState>(initialUrlState.filters);
  const [currentPage, setCurrentPage] = useState<number>(initialUrlState.page);
  const [currentPageSize, setCurrentPageSize] = useState<SearchPageSize>(
    initialUrlState.pageSize,
  );
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
  const [viewerRole, setViewerRole] = useState<ViewerRole>("EMPLOYEE");
  const hasLoadedSavedFiltersRef = useRef<boolean>(false);
  const lastQueryRef = useRef<string>("");

  const fetchProperties = useCallback(
    async (
      nextFilters: FilterState,
      nextPage: number,
      nextPageSize: SearchPageSize,
      force = false,
    ): Promise<void> => {
      const params = buildSearchParams(nextFilters, nextPage, nextPageSize);
      const queryString = params.toString();

      if (!force && queryString === lastQueryRef.current) {
        return;
      }

      lastQueryRef.current = queryString;
      setIsLoading(true);
      setErrorMessage("");

      router.replace(`/search?${queryString}`, {
        scroll: false,
      });

      const result = await requestProperties(queryString);

      if (!result.ok) {
        setErrorMessage(result.error);
        setProperties([]);
        setMeta(null);
        setIsLoading(false);
        return;
      }

      setProperties(result.data.data);
      setMeta(result.data.meta);
      setViewerRole(result.data.viewerRole);

      if (result.data.meta.page !== nextPage) {
        setCurrentPage(result.data.meta.page);
      }

      setIsLoading(false);
    },
    [router],
  );

  const fetchFavorites = useCallback(async (): Promise<void> => {
    const ids = await requestFavoriteIds();
    setFavoritePropertyIds(ids);
  }, []);

  const loadLatestSearchFilter = useCallback(async (): Promise<void> => {
    const latestFilter = await requestLatestSearchFilter();

    if (latestFilter) {
      setFilters(latestFilter);
      setCurrentPage(1);
    }

    setIsSearchFilterReady(true);
  }, []);

  const updateFilters = (updater: (previous: FilterState) => FilterState): void => {
    setFilters(updater);
    setCurrentPage(1);
  };

  const setFilterValue = <K extends keyof FilterState>(
    key: K,
    value: FilterState[K],
  ): void => {
    updateFilters((previous) => ({
      ...previous,
      [key]: value,
    }));
  };

  const minPriceParsed = Number(filters.minPrice.trim());
  const maxPriceParsed = Number(filters.maxPrice.trim());
  const hasValidMinPrice =
    filters.minPrice.trim().length > 0 && Number.isFinite(minPriceParsed);
  const hasValidMaxPrice =
    filters.maxPrice.trim().length > 0 && Number.isFinite(maxPriceParsed);
  const hasInvalidPriceRange =
    hasValidMinPrice && hasValidMaxPrice && minPriceParsed > maxPriceParsed;
  const priceRangeValidationMessage = hasInvalidPriceRange
    ? "El precio minimo no puede ser mayor que el precio maximo."
    : "";

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

    if (hasInvalidPriceRange) {
      return;
    }

    const timeout = setTimeout(() => {
      void fetchProperties(filters, currentPage, currentPageSize);
    }, 350);

    return () => {
      clearTimeout(timeout);
    };
  }, [
    currentPage,
    currentPageSize,
    fetchProperties,
    filters,
    hasInvalidPriceRange,
    isSearchFilterReady,
  ]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      void fetchFavorites();
    }, 0);

    return () => {
      clearTimeout(timeout);
    };
  }, [fetchFavorites]);

  const submitSearch = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      if (hasInvalidPriceRange) {
        return;
      }

      void fetchProperties(filters, currentPage, currentPageSize, true);
    },
    [currentPage, currentPageSize, fetchProperties, filters, hasInvalidPriceRange],
  );

  const toggleFavorite = useCallback((propertyId: string, isFavorite: boolean): void => {
    setFavoritePropertyIds((previous) => {
      const exists = previous.includes(propertyId);

      if (isFavorite) {
        return exists ? previous : [...previous, propertyId];
      }

      return previous.filter((id) => id !== propertyId);
    });
  }, []);

  const saveSearchFilter = useCallback((): void => {
    if (hasInvalidPriceRange) {
      setSaveSearchFilterMessage("Corrige el rango de precios antes de guardar.");
      return;
    }

    if (isSavingSearchFilter) {
      return;
    }

    const run = async (): Promise<void> => {
      setIsSavingSearchFilter(true);
      setSaveSearchFilterMessage("");

      const result = await requestSaveSearchFilter(filters);

      setSaveSearchFilterMessage(
        result.ok ? "Busqueda guardada." : result.error,
      );
      setIsSavingSearchFilter(false);
    };

    void run();
  }, [filters, hasInvalidPriceRange, isSavingSearchFilter]);

  const clearFilters = useCallback(() => {
    setFilters(defaultFilters);
    setCurrentPage(1);
  }, []);

  const setPageSize = useCallback((value: SearchPageSize) => {
    setCurrentPageSize(value);
    setCurrentPage(1);
  }, []);

  const goToPreviousPage = useCallback(() => {
    setCurrentPage((previous) => Math.max(1, previous - 1));
  }, []);

  const goToNextPage = useCallback(() => {
    setCurrentPage((previous) => {
      if (!meta) {
        return previous;
      }

      return Math.min(meta.totalPages, previous + 1);
    });
  }, [meta]);

  return {
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
    pdfDownloadHref: buildPdfDownloadHref(filters),
    setFilterValue,
    clearFilters,
    setPageSize,
    saveSearchFilter,
    submitSearch,
    toggleFavorite,
    goToPreviousPage,
    goToNextPage,
  };
}
