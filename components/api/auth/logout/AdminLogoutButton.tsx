"use client";

import { useAdminLogout } from "@/components/hooks/useAdminLogout";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { LogOutIcon } from "lucide-react";
import { usePathname } from "next/navigation";

/**
 * 担当者ログアウトボタン
 */
export const AdminLogoutButton = () => {
  const pathname = usePathname();
  const { isLoading, submitError, handleLogout } = useAdminLogout();

  const isLoginPage = pathname === "/admin/login";

  return (
    <div className="flex w-32 flex-col items-center gap-1">
      <Button
        type="button"
        variant="outline"
        onClick={handleLogout}
        disabled={isLoginPage || isLoading}
        aria-hidden={isLoginPage || undefined}
        tabIndex={isLoginPage ? -1 : undefined}
        aria-describedby={submitError ? "admin-logout-error" : undefined}
        className={`w-full border-green-500 text-green-700 hover:bg-green-50 hover:text-green-800 ${isLoginPage ? "invisible" : ""}`}
      >
        {isLoading ? (
          <>
            <Spinner aria-hidden="true" />
            ログアウト中...
          </>
        ) : (
          <>
            <LogOutIcon aria-hidden="true" />
            ログアウト
          </>
        )}
      </Button>

      {submitError && (
        <p
          id="admin-logout-error"
          role="alert"
          className="max-w-64 text-xs font-normal text-red-600"
        >
          {submitError}
        </p>
      )}
    </div>
  );
};
