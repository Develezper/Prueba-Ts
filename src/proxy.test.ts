import { beforeEach, describe, expect, it, mock } from "bun:test";
import {
  ACCESS_COOKIE_NAME,
  REFRESH_COOKIE_NAME,
} from "@/lib/auth-cookies";
import { NextRequest } from "next/server";

const verifyAccessTokenMock = mock(async () => ({
  sub: "user-1",
  role: "ADMIN" as const,
  type: "access" as const,
}));

const refreshMock = mock(async () => ({
  user: {
    id: "user-1",
    email: "seed.owner@rentvago.com",
    role: "ADMIN" as const,
  },
  tokens: {
    accessToken: "new-access-token",
    refreshToken: "new-refresh-token",
  },
}));

mock.module("@/lib/jwt", () => ({
  jwtConfig: {
    accessTokenMaxAgeSeconds: 15 * 60,
    refreshTokenMaxAgeSeconds: 7 * 24 * 60 * 60,
  },
  verifyAccessToken: verifyAccessTokenMock,
}));

mock.module("@/services/auth.service", () => ({
  authService: {
    refresh: refreshMock,
  },
}));

const { proxy } = await import("./proxy");

describe("proxy session refresh", () => {
  beforeEach(() => {
    verifyAccessTokenMock.mockClear();
    refreshMock.mockClear();
  });

  it("refreshes the session when the access token is expired", async () => {
    verifyAccessTokenMock.mockImplementationOnce(async () => {
      throw {
        code: "ERR_JWT_EXPIRED",
      };
    });

    const request = new NextRequest("http://localhost:3000/search", {
      headers: {
        cookie: `${ACCESS_COOKIE_NAME}=expired; ${REFRESH_COOKIE_NAME}=valid-refresh`,
      },
    });

    const response = await proxy(request);

    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
    expect(refreshMock.mock.calls.length).toBe(1);
    expect(response.cookies.get(ACCESS_COOKIE_NAME)?.value).toBe("new-access-token");
    expect(response.cookies.get(REFRESH_COOKIE_NAME)?.value).toBe("new-refresh-token");
  });

  it("refreshes protected API requests when the access token is expired", async () => {
    verifyAccessTokenMock.mockImplementationOnce(async () => {
      throw {
        code: "ERR_JWT_EXPIRED",
      };
    });

    const request = new NextRequest("http://localhost:3000/api/favorites", {
      headers: {
        cookie: `${ACCESS_COOKIE_NAME}=expired; ${REFRESH_COOKIE_NAME}=valid-refresh`,
      },
    });

    const response = await proxy(request);

    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
    expect(refreshMock.mock.calls.length).toBe(1);
    expect(response.cookies.get(ACCESS_COOKIE_NAME)?.value).toBe("new-access-token");
    expect(response.cookies.get(REFRESH_COOKIE_NAME)?.value).toBe("new-refresh-token");
  });

  it("redirects to login when refresh is not available", async () => {
    verifyAccessTokenMock.mockImplementationOnce(async () => {
      throw {
        code: "ERR_JWT_EXPIRED",
      };
    });

    const request = new NextRequest("http://localhost:3000/search?page=2", {
      headers: {
        cookie: `${ACCESS_COOKIE_NAME}=expired`,
      },
    });

    const response = await proxy(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/login?next=%2Fsearch%3Fpage%3D2",
    );
    expect(refreshMock.mock.calls.length).toBe(0);
  });

  it("returns 401 for protected API requests when refresh is not available", async () => {
    verifyAccessTokenMock.mockImplementationOnce(async () => {
      throw {
        code: "ERR_JWT_EXPIRED",
      };
    });

    const request = new NextRequest("http://localhost:3000/api/favorites", {
      headers: {
        cookie: `${ACCESS_COOKIE_NAME}=expired`,
      },
    });

    const response = await proxy(request);

    expect(response.status).toBe(401);
    expect(response.headers.get("location")).toBeNull();
    expect(response.cookies.get(ACCESS_COOKIE_NAME)?.value).toBe("");
    expect(response.cookies.get(REFRESH_COOKIE_NAME)?.value).toBe("");
    expect(await response.json()).toEqual({
      error: "No autorizado.",
    });
  });
});