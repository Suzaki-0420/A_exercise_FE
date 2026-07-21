"use client";

import { clearLoggedInAdmin } from "@/components/api/auth/adminSessionStorage";
import { container } from "@/di/container";
import { TYPES } from "@/di/types";
import type { ILogoutAdminService } from "@/interfaces/ILogoutAdminService";
import { AdminLogoutError } from "@/models/AdminAuth";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";

/**
 * 担当者ログアウト用カスタムフック
 */
export const useAdminLogout = () => {
    const router = useRouter();
    const service = useMemo(
        () =>
            container.get<ILogoutAdminService>(
                TYPES.ILogoutAdminService
            ),
        []
    );

    const [isLoading, setIsLoading] = useState(false);
    const [submitError, setSubmitError] =
        useState<string | null>(null);

    const handleLogout = useCallback(async () => {
        setIsLoading(true);
        setSubmitError(null);

        try {
            await service.logout();
            clearLoggedInAdmin();
            router.replace("/admin/login");
            router.refresh();
        } catch (error: unknown) {
            if (error instanceof AdminLogoutError) {
                if (error.status === 401) {
                    clearLoggedInAdmin();
                    router.replace("/admin/login");
                    router.refresh();
                    return;
                }

                setSubmitError(error.message);
            } else {
                setSubmitError(
                    "システムエラーが発生しました。管理者に連絡してください。"
                );
            }
        } finally {
            setIsLoading(false);
        }
    }, [router, service]);

    return {
        isLoading,
        submitError,
        handleLogout,
    };
};
