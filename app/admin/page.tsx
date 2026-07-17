import { Button } from "@/components/ui/button";
import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

/**
 * 管理画面メニュー
 */
export default async function AdminMenuPage() {
    const cookieStore = await cookies();
    const shouldBypassAdminAuth =
        process.env.NODE_ENV === "development" &&
        process.env.ADMIN_AUTH_BYPASS === "true";

    if (
        !shouldBypassAdminAuth &&
        !cookieStore.has("FullnessAdminAuth")
    ) {
        redirect("/admin/login");
    }

    return (
        <main className="flex flex-1 justify-center bg-gray-50 px-4 py-12">
            <section className="w-full max-w-3xl">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-gray-900">
                        メニュー
                    </h1>
                    <p className="mt-2 text-sm text-gray-600">
                        利用する管理機能を選択してください。
                    </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                    <Button
                        asChild
                        variant="outline"
                        className="h-auto justify-start px-5 py-4"
                    >
                        <Link href="/admin/product">
                            商品情報メンテナンス
                        </Link>
                    </Button>
                    <Button
                        asChild
                        variant="outline"
                        className="h-auto justify-start px-5 py-4"
                    >
                        <Link href="/admin/category/register">
                            商品カテゴリ登録
                        </Link>
                    </Button>
                    <Button
                        asChild
                        variant="outline"
                        className="h-auto justify-start px-5 py-4"
                    >
                        <Link href="/admin/account/form">
                            アカウント登録
                        </Link>
                    </Button>
                </div>
            </section>
        </main>
    );
}
