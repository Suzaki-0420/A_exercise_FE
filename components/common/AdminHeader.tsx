import { AdminHeaderNavigation } from "@/components/common/AdminHeaderNavigation";
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
                    <Link
                        href="/admin"
                        prefetch={false}
                        className="rounded-sm hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-green-700"
                    >
                        フルネス文具 管理画面
                    </Link>
                </h1>

                <AdminHeaderNavigation />
            </div>
        </header>
    );
};
