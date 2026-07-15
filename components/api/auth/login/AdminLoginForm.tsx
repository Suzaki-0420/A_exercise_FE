"use client";

import { useAdminLogin } from "@/components/hooks/useAdminLogin";
import {
    Alert,
    AlertDescription,
    AlertTitle,
} from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { CircleAlertIcon, LogInIcon } from "lucide-react";

/**
 * 担当者ログインフォーム
 */
export const AdminLoginForm = () => {
    const {
        credentials,
        fieldErrors,
        submitError,
        isLoading,
        handleChange,
        handleSubmit,
    } = useAdminLogin();

    return (
        <section
            aria-labelledby="admin-login-title"
            className="w-full max-w-md rounded-lg border bg-white p-6 shadow-sm sm:p-8"
        >
            <div className="mb-8 space-y-2 text-center">
                <h1
                    id="admin-login-title"
                    className="text-2xl font-bold text-gray-900"
                >
                    担当者ログイン
                </h1>
                <p className="text-sm text-gray-600">
                    アカウント名とパスワードを入力してください。
                </p>
            </div>

            {submitError && (
                <Alert
                    variant="destructive"
                    className="mb-6"
                >
                    <CircleAlertIcon />
                    <AlertTitle>
                        ログインできませんでした
                    </AlertTitle>
                    <AlertDescription>
                        {submitError}
                    </AlertDescription>
                </Alert>
            )}

            <form
                onSubmit={handleSubmit}
                className="space-y-6"
                noValidate
            >
                <div className="space-y-2">
                    <Label htmlFor="accountName">
                        アカウント名
                    </Label>
                    <Input
                        id="accountName"
                        name="accountName"
                        type="text"
                        autoComplete="username"
                        autoCapitalize="none"
                        autoCorrect="off"
                        value={credentials.accountName}
                        onChange={handleChange}
                        disabled={isLoading}
                        aria-invalid={Boolean(
                            fieldErrors.accountName
                        )}
                        aria-describedby={
                            fieldErrors.accountName
                                ? "accountName-description accountName-error"
                                : "accountName-description"
                        }
                        autoFocus
                        className="h-10"
                    />
                    <p
                        id="accountName-description"
                        className="text-xs text-gray-500"
                    >
                        5～20文字の半角英数字
                    </p>
                    {fieldErrors.accountName && (
                        <p
                            id="accountName-error"
                            className="text-sm text-red-600"
                        >
                            {fieldErrors.accountName}
                        </p>
                    )}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="password">
                        パスワード
                    </Label>
                    <Input
                        id="password"
                        name="password"
                        type="password"
                        autoComplete="current-password"
                        value={credentials.password}
                        onChange={handleChange}
                        disabled={isLoading}
                        aria-invalid={Boolean(
                            fieldErrors.password
                        )}
                        aria-describedby={
                            fieldErrors.password
                                ? "password-description password-error"
                                : "password-description"
                        }
                        className="h-10"
                    />
                    <p
                        id="password-description"
                        className="text-xs text-gray-500"
                    >
                        5～20文字の半角英数字
                    </p>
                    {fieldErrors.password && (
                        <p
                            id="password-error"
                            className="text-sm text-red-600"
                        >
                            {fieldErrors.password}
                        </p>
                    )}
                </div>

                <Button
                    type="submit"
                    disabled={isLoading}
                    className="h-10 w-full bg-green-700 text-white hover:bg-green-800"
                >
                    {isLoading ? (
                        <>
                            <Spinner aria-hidden="true" />
                            ログイン中...
                        </>
                    ) : (
                        <>
                            <LogInIcon aria-hidden="true" />
                            ログイン
                        </>
                    )}
                </Button>
            </form>
        </section>
    );
};
