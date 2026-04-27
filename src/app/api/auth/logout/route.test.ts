import { beforeEach, describe, expect, it, mock } from "bun:test";

import {
  ACCESS_COOKIE_NAME,
  REFRESH_COOKIE_NAME,
} from "@/lib/auth-cookies";
import { NextRequest } from "next/server";

const logoutMock = mock(async () => {});

mock.module("@/services/auth.service", () => ({
  authService: {
    logout: logoutMock,
  },
}));

import { POST } from "./route";

describe("POST /api/auth/logout", () => {
  beforeEach(() => {
    logoutMock.mockClear();
  });

  it("clears auth cookies and redirects to login", async () => {
    const request = new NextRequest("http://localhost:3000/api/auth/logout", {
      method: "POST",
      headers: {
        cookie: `${ACCESS_COOKIE_NAME}=access-token; ${REFRESH_COOKIE_NAME}=refresh-token`,
      },
    });

    const response = await POST(request);

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("http://localhost:3000/login");
    expect(logoutMock).toHaveBeenCalledWith({
      accessToken: "access-token",
      refreshToken: "refresh-token",
    });
    expect(response.cookies.get(ACCESS_COOKIE_NAME)?.value).toBe("");
    expect(response.cookies.get(ACCESS_COOKIE_NAME)?.maxAge).toBe(0);
    expect(response.cookies.get(REFRESH_COOKIE_NAME)?.value).toBe("");
    expect(response.cookies.get(REFRESH_COOKIE_NAME)?.maxAge).toBe(0);
  });
});