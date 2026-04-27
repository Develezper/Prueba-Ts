import { verifyAccessToken } from "@/lib/jwt";
import { NextRequest } from "next/server";

const ACCESS_COOKIE_NAME = "access_token";

export interface AuthenticatedRequestUser {
  userId: string;
}

export const resolveAuthenticatedUser = async (
  request: NextRequest,
): Promise<AuthenticatedRequestUser | null> => {
  const accessToken = request.cookies.get(ACCESS_COOKIE_NAME)?.value;

  if (!accessToken) {
    return null;
  }

  try {
    const payload = await verifyAccessToken(accessToken);

    return {
      userId: payload.sub,
    };
  } catch {
    return null;
  }
};