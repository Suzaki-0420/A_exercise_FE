import Link from "next/link";

/**
 * 管理画面共通ヘッダー
 */
export const AdminHeader = () => {
    return (
        <header className="border border-gray-500 border-b-2 border-b-green-500 bg-white">
            <div className="py-4 text-center">
                {/* 管理画面タイトル */}
                <h1 className="text-xl font-bold text-green-700">
                    フルネス文具 管理画面
                </h1>

                {/* ナビゲーション */}
                <nav className="mt-3 flex items-center justify-center gap-4 text-sm font-bold text-green-700">
                    <Link
                        href="/admin/product"
                        className="hover:underline"
                    >
                        商品情報メンテナンス
                    </Link>

                    <Link
                        href="/admin/category/add"
                        className="hover:underline"
                    >
                        商品カテゴリ登録
                    </Link>

                    <Link
                        href="/admin/account/add"
                        className="hover:underline"
                    >
                        アカウント登録
                    </Link>

                    {/* TODO: 認証機能実装後にログアウト処理を追加 */}
                    <button
                        type="button"
                        className="border border-green-500 px-3 py-1 text-green-700"
                    >
                        ログアウト
                    </button>
                </nav>
            </div>
        </header>
    );
};