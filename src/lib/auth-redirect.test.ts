import { describe, expect, it } from "bun:test";

import {
  buildAuthPageHref,
  DEFAULT_POST_AUTH_REDIRECT_PATH,
  sanitizePostAuthRedirect,
} from "@/lib/auth-redirect";

describe("auth redirect helpers", () => {
  it("allows internal redirects", () => {
    expect(sanitizePostAuthRedirect("/favorites?view=grid")).toBe("/favorites?view=grid");
  });

  it("rejects external or protocol-relative redirects", () => {
    expect(sanitizePostAuthRedirect("https://evil.example/steal")).toBeNull();
    expect(sanitizePostAuthRedirect("//evil.example/steal")).toBeNull();
  });

  it("builds auth page hrefs without adding next for default destination", () => {
    expect(buildAuthPageHref("/register", DEFAULT_POST_AUTH_REDIRECT_PATH)).toBe(
      "/register",
    );
  });

  it("preserves next when changing between auth pages", () => {
    expect(buildAuthPageHref("/login", "/favorites")).toBe(
      "/login?next=%2Ffavorites",
    );
  });
});