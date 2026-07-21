import { config, proxy } from "@/proxy";
import {
    getRedirectUrl,
    unstable_doesMiddlewareMatch as unstableDoesProxyMatch,
} from "next/experimental/testing/server";
import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";

describe("管理画面のアクセス制御", () => {
    it("管理画面のURLをProxyの対象にする", () => {
        expect(
            unstableDoesProxyMatch({
                config,
                nextConfig: {},
                url: "/admin",
            })
        ).toBe(true);
        expect(
            unstableDoesProxyMatch({
                config,
                nextConfig: {},
                url: "/admin/product",
            })
        ).toBe(true);
    });

    it("認証Cookieなしで管理画面へアクセスするとログイン画面へリダイレクトする", () => {
        const response = proxy(
            new NextRequest("http://localhost:3000/admin")
        );

        expect(response.status).toBe(307);
        expect(getRedirectUrl(response)).toBe(
            "http://localhost:3000/admin/login"
        );
    });

    it("空の認証Cookieでは管理画面へアクセスできない", () => {
        const response = proxy(
            new NextRequest("http://localhost:3000/admin", {
                headers: {
                    cookie: "FullnessAdminAuth=",
                },
            })
        );

        expect(getRedirectUrl(response)).toBe(
            "http://localhost:3000/admin/login"
        );
    });

    it("ログイン画面は認証Cookieなしで表示できる", () => {
        const response = proxy(
            new NextRequest(
                "http://localhost:3000/admin/login"
            )
        );

        expect(response.status).toBe(200);
        expect(getRedirectUrl(response)).toBeNull();
    });

    it("認証Cookieがある場合は管理画面を表示する", () => {
        const response = proxy(
            new NextRequest("http://localhost:3000/admin", {
                headers: {
                    cookie: "FullnessAdminAuth=auth-cookie",
                },
            })
        );

        expect(response.status).toBe(200);
        expect(getRedirectUrl(response)).toBeNull();
    });
});
