import { beforeEach, describe, expect, it, mock } from "bun:test";
import { NextRequest } from "next/server";

const requireAuthenticatedUserMock = mock(async () => ({
  userId: "user-1",
  role: "EMPLOYEE" as const,
}));

const createForUserMock = mock(async () => ({
  id: "filter-1",
  query: "tesoro",
  minPrice: null,
  maxPrice: null,
  location: null,
  rooms: null,
  createdAt: new Date("2026-04-28T00:00:00.000Z"),
  updatedAt: new Date("2026-04-28T00:00:00.000Z"),
}));

const saveLatestForUserMock = mock(async () => ({
  id: "latest-filter",
  query: "tesoro",
  minPrice: null,
  maxPrice: null,
  location: null,
  rooms: null,
  createdAt: new Date("2026-04-28T00:00:00.000Z"),
  updatedAt: new Date("2026-04-28T00:00:00.000Z"),
}));

class AuthorizationError extends Error {
  public readonly statusCode: 401 | 403;

  constructor(statusCode: 401 | 403, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}

mock.module("@/lib/api-auth", () => ({
  AuthorizationError,
  authorizationErrorResponse: (error: AuthorizationError) =>
    Response.json({ error: error.message }, { status: error.statusCode }),
  requireAuthenticatedUser: requireAuthenticatedUserMock,
}));

mock.module("@/services/search-filter.service", () => ({
  searchFilterService: {
    listForUser: mock(async () => []),
    createForUser: createForUserMock,
    saveLatestForUser: saveLatestForUserMock,
  },
}));

const { POST } = await import("./route");

describe("POST /api/search-filters", () => {
  beforeEach(() => {
    requireAuthenticatedUserMock.mockClear();
    createForUserMock.mockClear();
    saveLatestForUserMock.mockClear();
  });

  it("creates a new saved filter instead of overwriting the latest one", async () => {
    const request = new NextRequest("http://localhost:3000/api/search-filters", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({ query: "tesoro" }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(createForUserMock.mock.calls.length).toBe(1);
    expect(saveLatestForUserMock.mock.calls.length).toBe(0);
    expect(body.data.id).toBe("filter-1");
  });
});