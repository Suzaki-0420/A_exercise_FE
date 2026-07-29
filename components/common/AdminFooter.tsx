import Link from "next/link";

/**
 * 管理画面共通フッター
 */
export const AdminFooter = () => {
    return (
        <footer className="mt-auto border-t-4 border-t-green-600 bg-white">
            <div className="py-8 text-center">
                <p className="text-xl font-bold text-green-700">
                    <Link
                        href="/admin"
                        prefetch={false}
                        className="rounded-sm hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-green-700"
                    >
                        Fullness Stationery
                    </Link>
                </p>
            </div>
        </footer>
    );
};