import { describe, expect, it } from "bun:test";

import {
  AUTH_USER_ID_HEADER,
  AUTH_USER_ROLE_HEADER,
  AuthorizationError,
  authorizationErrorResponse,
  ensureAuthenticatedUser,
  requireRole,
  resolveAuthenticatedUserFromHeaders,
  type AuthenticatedRequestUser,
} from "@/lib/api-auth";

describe("api-auth authorization guards", () => {
  it("allows access when role is sufficient", () => {
    const user: AuthenticatedRequestUser = {
      userId: "u-admin",
      role: "ADMIN",
    };

    const run = () => requireRole(user, ["ADMIN"], "Solo admins.");

    expect(run).not.toThrow();
  });

  it("returns 401 when there is no authenticated user", () => {
    const run = () => ensureAuthenticatedUser(null);

    expect(run).toThrow(AuthorizationError);

    try {
      run();
    } catch (error: unknown) {
      expect(error).toBeInstanceOf(AuthorizationError);

      if (!(error instanceof AuthorizationError)) {
        throw error;
      }

      expect(error.statusCode).toBe(401);
      expect(error.message).toBe("No autorizado.");
    }
  });

  it("returns 403 when role is insufficient", () => {
    const user: AuthenticatedRequestUser = {
      userId: "u-1",
      role: "EMPLOYEE",
    };

    const run = () => requireRole(user, ["ADMIN"], "Solo admins.");

    expect(run).toThrow(AuthorizationError);

    try {
      run();
    } catch (error: unknown) {
      expect(error).toBeInstanceOf(AuthorizationError);

      if (!(error instanceof AuthorizationError)) {
        throw error;
      }

      expect(error.statusCode).toBe(403);
      expect(error.message).toBe("Solo admins.");
    }
  });

  it("maps authorization errors to JSON response status", async () => {
    const response = authorizationErrorResponse(
      new AuthorizationError(403, "No permitido."),
    );

    expect(response.status).toBe(403);

    const body = await response.json();
    expect(body).toEqual({
      error: "No permitido.",
    });
  });

  it("resolves authenticated user from forwarded proxy headers", () => {
    const authenticatedUser = resolveAuthenticatedUserFromHeaders(
      new Headers({
        [AUTH_USER_ID_HEADER]: "u-proxy",
        [AUTH_USER_ROLE_HEADER]: "ADMIN",
      }),
    );

    expect(authenticatedUser).toEqual({
      userId: "u-proxy",
      role: "ADMIN",
    });
  });
});