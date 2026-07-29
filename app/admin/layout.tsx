import { AdminHeader } from "@/components/common/AdminHeader";
import { AdminFooter } from "@/components/common/AdminFooter";
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

      <AdminFooter />
    </>
  );
}
