import { AdminHeader } from "@/components/common/AdminHeader";

/**
 * 管理画面共通レイアウト
 */
export default function AdminLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <>
            <AdminHeader />

            {children}
        </>
    );
}