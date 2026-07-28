import {
  ADMIN_LOGIN_PATH,
  ADMIN_SESSION_TIMEOUT_LOGIN_PATH,
} from "@/lib/admin-auth";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const ADMIN_AUTH_COOKIE_NAME = "FullnessAdminAuth";

/**
 * 管理画面の楽観的な認証チェック。
 * Cookieの正当性と権限はバックエンドのAuthorizeで検証する。
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === ADMIN_LOGIN_PATH) {
    return NextResponse.next();
  }

  const authCookie = request.cookies.get(ADMIN_AUTH_COOKIE_NAME);

  if (!authCookie?.value) {
    return NextResponse.redirect(
      new URL(ADMIN_SESSION_TIMEOUT_LOGIN_PATH, request.url),
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/admin/:path*",
};
