import {
  FavoriteListItem,
  FilterState,
  favoritesResponseSchema,
  savedSearchFilterResponseSchema,
  searchResponseSchema,
  toFilterState,
  toSaveSearchFilterPayload,
} from "./search-page.shared";

interface RequestSuccess<TData> {
  ok: true;
  data: TData;
}

interface RequestFailure {
  ok: false;
  error: string;
}

type RequestResult<TData> = RequestSuccess<TData> | RequestFailure;

interface SearchApiPayload {
  data: ReturnType<typeof searchResponseSchema.parse>["data"];
  meta: ReturnType<typeof searchResponseSchema.parse>["meta"];
  viewerRole: ReturnType<typeof searchResponseSchema.parse>["viewerRole"];
}

const defaultSearchError = "No fue posible cargar propiedades. Intenta nuevamente.";

const extractApiError = (payload: unknown, fallbackMessage: string): string => {
  if (
    typeof payload === "object" &&
    payload !== null &&
    "error" in payload &&
    typeof payload.error === "string"
  ) {
    return payload.error;
  }

  return fallbackMessage;
};

export const requestProperties = async (
  queryString: string,
): Promise<RequestResult<SearchApiPayload>> => {
  try {
    const response = await fetch(`/api/properties/search?${queryString}`, {
      method: "GET",
      credentials: "include",
      cache: "no-store",
    });

    const responseData: unknown = await response.json();

    if (!response.ok) {
      return {
        ok: false,
        error: extractApiError(responseData, defaultSearchError),
      };
    }

    const parsed = searchResponseSchema.parse(responseData);
    return {
      ok: true,
      data: {
        data: parsed.data,
        meta: parsed.meta,
        viewerRole: parsed.viewerRole,
      },
    };
  } catch {
    return {
      ok: false,
      error: "Error de red o respuesta invalida del servidor.",
    };
  }
};

export const requestFavoriteIds = async (): Promise<string[]> => {
  try {
    const response = await fetch("/api/favorites", {
      method: "GET",
      credentials: "include",
      cache: "no-store",
    });

    if (!response.ok) {
      return [];
    }

    const payload: unknown = await response.json();
    const parsed = favoritesResponseSchema.parse(payload);
    return parsed.data.map((favorite: FavoriteListItem) => favorite.propertyId);
  } catch {
    return [];
  }
};

export const requestLatestSearchFilter = async (): Promise<FilterState | null> => {
  try {
    const response = await fetch("/api/search-filters", {
      method: "GET",
      credentials: "include",
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    const payload: unknown = await response.json();
    const parsed = savedSearchFilterResponseSchema.parse(payload);

    if (parsed.data.length === 0) {
      return null;
    }

    return toFilterState(parsed.data[0]);
  } catch {
    return null;
  }
};

export const requestSaveSearchFilter = async (
  filters: FilterState,
): Promise<RequestResult<null>> => {
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
      return {
        ok: false,
        error: "No pudimos guardar el filtro. Intenta nuevamente.",
      };
    }

    return {
      ok: true,
      data: null,
    };
  } catch {
    return {
      ok: false,
      error: "Error de red al guardar la busqueda.",
    };
  }
};
