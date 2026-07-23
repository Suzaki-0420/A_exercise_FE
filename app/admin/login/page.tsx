import { AdminLoginForm } from "@/components/api/auth/login/AdminLoginForm";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "担当者ログイン | フルネス文具 管理画面",
};

/**
 * UC017 担当者ログイン画面
 */
export default function AdminLoginPage() {
  return (
    <main className="flex flex-1 items-start justify-center bg-gray-50 px-4 py-10 sm:items-center sm:py-16">
      <AdminLoginForm />
    </main>
  );
}
