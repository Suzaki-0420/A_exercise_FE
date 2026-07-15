"use client";

import { container } from "@/di/container";
import { TYPES } from "@/di/types";
import type { ILoginAdminService } from "@/interfaces/ILoginAdminService";
import {
    AdminLoginError,
    type AdminLoginCredentials,
    type AdminLoginFieldErrors,
} from "@/models/AdminAuth";
import { useRouter } from "next/navigation";
import {
    type ChangeEvent,
    type FormEvent,
    useCallback,
    useMemo,
    useState,
} from "react";

const initialCredentials: AdminLoginCredentials = {
    accountName: "",
    password: "",
};

const validateCredentials = (
    credentials: AdminLoginCredentials
): AdminLoginFieldErrors => {
    const errors: AdminLoginFieldErrors = {};
    const halfWidthAlphaNumericPattern =
        /^[a-zA-Z0-9]+$/;

    if (!credentials.accountName) {
        errors.accountName =
            "アカウント名を入力してください。";
    } else if (
        credentials.accountName.length < 5 ||
        credentials.accountName.length > 20
    ) {
        errors.accountName =
            "アカウント名は5～20文字で入力してください。";
    } else if (
        !halfWidthAlphaNumericPattern.test(
            credentials.accountName
        )
    ) {
        errors.accountName =
            "アカウント名は半角英数字で入力してください。";
    }

    if (!credentials.password) {
        errors.password =
            "パスワードを入力してください。";
    } else if (
        credentials.password.length < 5 ||
        credentials.password.length > 20
    ) {
        errors.password =
            "パスワードは5～20文字で入力してください。";
    } else if (
        !halfWidthAlphaNumericPattern.test(
            credentials.password
        )
    ) {
        errors.password =
            "パスワードは半角英数字で入力してください。";
    }

    return errors;
};

/**
 * 担当者ログイン画面用カスタムフック
 */
export const useAdminLogin = () => {
    const router = useRouter();
    const service = useMemo(
        () =>
            container.get<ILoginAdminService>(
                TYPES.ILoginAdminService
            ),
        []
    );

    const [credentials, setCredentials] =
        useState<AdminLoginCredentials>(
            initialCredentials
        );
    const [fieldErrors, setFieldErrors] =
        useState<AdminLoginFieldErrors>({});
    const [submitError, setSubmitError] =
        useState<string | null>(null);
    const [isLoading, setIsLoading] =
        useState(false);

    const handleChange = useCallback(
        (event: ChangeEvent<HTMLInputElement>) => {
            const field = event.target
                .name as keyof AdminLoginCredentials;
            const { value } = event.target;

            setCredentials((previous) => ({
                ...previous,
                [field]: value,
            }));
            setFieldErrors((previous) => ({
                ...previous,
                [field]: undefined,
            }));
            setSubmitError(null);
        },
        []
    );

    const handleSubmit = useCallback(
        async (event: FormEvent<HTMLFormElement>) => {
            event.preventDefault();

            const validationErrors =
                validateCredentials(credentials);

            if (
                Object.keys(validationErrors).length > 0
            ) {
                setFieldErrors(validationErrors);
                setSubmitError(null);
                return;
            }

            setIsLoading(true);
            setFieldErrors({});
            setSubmitError(null);

            try {
                await service.login(credentials);
                router.replace("/admin");
            } catch (error: unknown) {
                if (error instanceof AdminLoginError) {
                    setFieldErrors(error.fieldErrors);
                    setSubmitError(error.message);
                } else {
                    setSubmitError(
                        "システムエラーが発生しました。管理者に連絡してください。"
                    );
                }
            } finally {
                setIsLoading(false);
            }
        },
        [credentials, router, service]
    );

    return {
        credentials,
        fieldErrors,
        submitError,
        isLoading,
        handleChange,
        handleSubmit,
    };
};
