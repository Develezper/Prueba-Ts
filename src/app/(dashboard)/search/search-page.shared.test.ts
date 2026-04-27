import { describe, expect, it } from "bun:test";

import {
  PAGE_SIZE,
  buildSearchParams,
  defaultFilters,
  parseStateFromUrl,
} from "./search-page.shared";

describe("search-page shared pagination state", () => {
  it("builds search params using explicit pageSize", () => {
    const params = buildSearchParams(
      {
        ...defaultFilters,
        query: "tesoro",
      },
      2,
      6,
    );

    expect(params.get("query")).toBe("tesoro");
    expect(params.get("page")).toBe("2");
    expect(params.get("pageSize")).toBe("6");
  });

  it("parses page and pageSize from URL", () => {
    const parsed = parseStateFromUrl("?sort=priceAsc&page=2&pageSize=24");

    expect(parsed.filters.sort).toBe("priceAsc");
    expect(parsed.page).toBe(2);
    expect(parsed.pageSize).toBe(24);
    expect(parsed.hasUserParams).toBe(true);
  });

  it("falls back to defaults when pageSize is invalid", () => {
    const parsed = parseStateFromUrl("?pageSize=999&page=-2");

    expect(parsed.page).toBe(1);
    expect(parsed.pageSize).toBe(PAGE_SIZE);
    expect(parsed.hasUserParams).toBe(false);
  });
});