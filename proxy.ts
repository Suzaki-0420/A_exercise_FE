import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const ADMIN_LOGIN_PATH = "/admin/login";
const ADMIN_AUTH_COOKIE_NAME = "FullnessAdminAuth";
const SHOULD_BYPASS_ADMIN_AUTH =
    process.env.NODE_ENV === "development" &&
    process.env.ADMIN_AUTH_BYPASS === "true";

/**
 * 管理画面の楽観的な認証チェック。
 * Cookieの正当性と権限はバックエンドのAuthorizeで検証する。
 */
export function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // 明示的に有効化した開発環境だけ、未ログインでの画面確認を許可する。
    if (SHOULD_BYPASS_ADMIN_AUTH) {
        return NextResponse.next();
    }

    if (pathname === ADMIN_LOGIN_PATH) {
        return NextResponse.next();
    }

    if (!request.cookies.has(ADMIN_AUTH_COOKIE_NAME)) {
        return NextResponse.redirect(
            new URL(ADMIN_LOGIN_PATH, request.url)
        );
    }

    return NextResponse.next();
}

export const config = {
    matcher: "/admin/:path*",
};
