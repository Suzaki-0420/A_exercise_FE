"use client";

import { AdminLogoutButton } from "@/components/api/auth/logout/AdminLogoutButton";
import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * ログイン状態に応じて表示を切り替える管理画面ナビゲーション
 */
export const AdminHeaderNavigation = () => {
    const pathname = usePathname();

    if (pathname === "/admin/login") {
        return (
            <div
                aria-hidden="true"
                className="mt-3 h-9"
            />
        );
    }

    return (
        <nav
            aria-label="管理画面メニュー"
            className="mt-3 flex items-center justify-center gap-4 text-sm font-bold text-green-700"
        >
            <Link
                href="/admin/product"
                className="hover:underline"
            >
                商品情報メンテナンス
            </Link>

            <Link
                href="/admin/category/register"
                className="hover:underline"
            >
                商品カテゴリ登録
            </Link>

            <Link
                href="/admin/order/search"
                className="hover:underline"
            >
                購入履歴
            </Link>

            <Link
                href="/admin/account/register"
                className="hover:underline"
            >
                アカウント登録
            </Link>

            <AdminLogoutButton />
        </nav>
    );
};
