"use client";

import { useRegisterEmployeeAccount } from
    "@/components/hooks/useRegisterEmployeeAccount";
import type { FormEvent } from
    "react";

/**
 * 担当者アカウント登録コンポーネント
 */
export const RegisterEmployeeAccount =
    () => {

        const {
            employeeAccounts,
            formData,
            errors,

            selectedEmployeeName,

            isInitialLoading,
            isLoading,
            isConfirmOpen,
            isToastVisible,
            hasValidationErrors,

            handleChange,
            handleAccountNameBlur,

            openConfirmModal,
            closeConfirmModal,
            confirmRegisterEmployeeAccount,

            resetForm,
            closeToast,
        } = useRegisterEmployeeAccount();

        /**
         * 確認ボタン押下処理
         */
        const handleSubmit = async (
            event:
                FormEvent<HTMLFormElement>
        ): Promise<void> => {
            event.preventDefault();

            await openConfirmModal();
        };

        return (
            <>
                <main className="flex min-h-screen justify-center bg-white px-6 py-12">
                    <section className="w-full max-w-2xl">
                        <h1 className="mb-10 text-center text-2xl font-bold">
                            担当者アカウント登録
                        </h1>

                        {errors.system && (
                            <p
                                role="alert"
                                className="mb-6 text-center text-sm text-red-600"
                            >
                                {errors.system}
                            </p>
                        )}

                        {errors.submit &&
                            !isConfirmOpen && (
                                <p
                                    role="alert"
                                    className="mb-6 text-center text-sm text-red-600"
                                >
                                    {errors.submit}
                                </p>
                            )}

                        {isInitialLoading ? (
                            <p className="text-center text-gray-600">
                                社員情報を読み込んでいます。
                            </p>
                        ) : (
                            <form
                                onSubmit={
                                    handleSubmit
                                }
                                className="space-y-6"
                                noValidate
                            >
                                {/* 社員名 */}
                                <div className="grid grid-cols-[160px_1fr] items-start gap-4">
                                    <label
                                        htmlFor="employeeUuid"
                                        className="pt-2 text-right"
                                    >
                                        社員名
                                    </label>

                                    <div>
                                        <select
                                            id="employeeUuid"
                                            name="employeeUuid"
                                            value={
                                                formData
                                                    .employeeUuid
                                            }
                                            onChange={
                                                handleChange
                                            }
                                            disabled={
                                                isLoading ||
                                                employeeAccounts
                                                    .length ===
                                                0
                                            }
                                            aria-invalid={
                                                Boolean(
                                                    errors
                                                        .employeeUuid
                                                )
                                            }
                                            className={`w-full rounded border px-3 py-2 ${errors
                                                .employeeUuid
                                                ? "border-red-500"
                                                : "border-gray-300"
                                                }`}
                                        >
                                            <option value="">
                                                選択してください
                                            </option>

                                            {employeeAccounts.map(
                                                account => (
                                                    <option
                                                        key={
                                                            account
                                                                .employee
                                                                ?.employeeUuid
                                                        }
                                                        value={
                                                            account
                                                                .employee
                                                                ?.employeeUuid ??
                                                            ""
                                                        }
                                                    >
                                                        {
                                                            account
                                                                .employee
                                                                ?.name
                                                        }
                                                    </option>
                                                )
                                            )}
                                        </select>

                                        {errors.employeeUuid && (
                                            <p
                                                role="alert"
                                                className="mt-1 text-sm text-red-600"
                                            >
                                                {
                                                    errors
                                                        .employeeUuid
                                                }
                                            </p>
                                        )}

                                        {employeeAccounts
                                            .length ===
                                            0 &&
                                            !errors.system && (
                                                <p className="mt-1 text-sm text-gray-600">
                                                    アカウント登録可能な社員が存在しません。
                                                </p>
                                            )}
                                    </div>
                                </div>

                                {/* アカウント名 */}
                                <div className="grid grid-cols-[160px_1fr] items-start gap-4">
                                    <label
                                        htmlFor="name"
                                        className="pt-2 text-right"
                                    >
                                        アカウント名
                                    </label>

                                    <div>
                                        <input
                                            id="name"
                                            name="name"
                                            type="text"
                                            value={
                                                formData.name
                                            }
                                            minLength={5}
                                            maxLength={20}
                                            onChange={
                                                handleChange
                                            }
                                            onBlur={
                                                handleAccountNameBlur
                                            }
                                            disabled={
                                                isLoading
                                            }
                                            autoComplete="username"
                                            aria-invalid={
                                                Boolean(
                                                    errors.name
                                                )
                                            }
                                            className={`w-full rounded border px-3 py-2 ${errors.name
                                                ? "border-red-500"
                                                : "border-gray-300"
                                                }`}
                                        />

                                        <div className="mt-1 flex justify-between gap-4">
                                            <div>
                                                {errors.name && (
                                                    <p
                                                        role="alert"
                                                        className="text-sm text-red-600"
                                                    >
                                                        {
                                                            errors
                                                                .name
                                                        }
                                                    </p>
                                                )}
                                            </div>

                                            <p className="shrink-0 text-sm text-gray-500">
                                                {
                                                    formData
                                                        .name
                                                        .length
                                                }
                                                /20文字
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* パスワード */}
                                <div className="grid grid-cols-[160px_1fr] items-start gap-4">
                                    <label
                                        htmlFor="password"
                                        className="pt-2 text-right"
                                    >
                                        パスワード
                                    </label>

                                    <div>
                                        <input
                                            id="password"
                                            name="password"
                                            type="password"
                                            value={
                                                formData
                                                    .password
                                            }
                                            minLength={8}
                                            maxLength={64}
                                            onChange={
                                                handleChange
                                            }
                                            disabled={
                                                isLoading
                                            }
                                            autoComplete="new-password"
                                            aria-invalid={
                                                Boolean(
                                                    errors
                                                        .password
                                                )
                                            }
                                            className={`w-full rounded border px-3 py-2 ${errors
                                                .password
                                                ? "border-red-500"
                                                : "border-gray-300"
                                                }`}
                                        />

                                        {errors.password && (
                                            <p
                                                role="alert"
                                                className="mt-1 text-sm text-red-600"
                                            >
                                                {
                                                    errors
                                                        .password
                                                }
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* ボタン */}
                                <div className="flex justify-center gap-6 pt-6">
                                    <button
                                        type="button"
                                        onClick={
                                            resetForm
                                        }
                                        disabled={
                                            isLoading
                                        }
                                        className="rounded border border-green-600 px-5 py-2 font-bold text-green-600 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        キャンセル
                                    </button>

                                    <button
                                        type="submit"
                                        disabled={
                                            isLoading ||
                                            hasValidationErrors ||
                                            employeeAccounts
                                                .length ===
                                            0
                                        }
                                        className="rounded bg-green-600 px-5 py-2 font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        確認
                                    </button>
                                </div>
                            </form>
                        )}
                    </section>
                </main>

                {/* 確認モーダル */}
                {isConfirmOpen && (
                    <div
                        className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4"
                        role="presentation"
                        onMouseDown={
                            closeConfirmModal
                        }
                    >
                        <section
                            role="dialog"
                            aria-modal="true"
                            aria-labelledby="employee-account-confirm-title"
                            className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl"
                            onMouseDown={event =>
                                event.stopPropagation()
                            }
                        >
                            <h2
                                id="employee-account-confirm-title"
                                className="mb-6 text-center text-xl font-bold"
                            >
                                登録内容の確認
                            </h2>

                            <dl className="space-y-4">
                                <div className="grid grid-cols-[140px_1fr] gap-4 border-b pb-3">
                                    <dt className="font-semibold">
                                        社員名
                                    </dt>

                                    <dd>
                                        {
                                            selectedEmployeeName
                                        }
                                    </dd>
                                </div>

                                <div className="grid grid-cols-[140px_1fr] gap-4 border-b pb-3">
                                    <dt className="font-semibold">
                                        アカウント名
                                    </dt>

                                    <dd>
                                        {
                                            formData.name
                                        }
                                    </dd>
                                </div>

                                <div className="grid grid-cols-[140px_1fr] gap-4 border-b pb-3">
                                    <dt className="font-semibold">
                                        パスワード
                                    </dt>

                                    <dd>
                                        ********
                                    </dd>
                                </div>
                            </dl>

                            {errors.submit && (
                                <p
                                    role="alert"
                                    className="mt-4 text-center text-sm text-red-600"
                                >
                                    {errors.submit}
                                </p>
                            )}

                            <div className="mt-8 flex justify-center gap-4">
                                <button
                                    type="button"
                                    onClick={
                                        closeConfirmModal
                                    }
                                    disabled={
                                        isLoading
                                    }
                                    className="rounded border border-gray-400 px-5 py-2 font-semibold text-gray-700 disabled:opacity-50"
                                >
                                    戻る
                                </button>

                                <button
                                    type="button"
                                    onClick={
                                        confirmRegisterEmployeeAccount
                                    }
                                    disabled={
                                        isLoading
                                    }
                                    className="rounded bg-green-600 px-5 py-2 font-semibold text-white disabled:opacity-50"
                                >
                                    {isLoading
                                        ? "登録中..."
                                        : "登録する"}
                                </button>
                            </div>
                        </section>
                    </div>
                )}

                {/* 登録完了トースト */}
                {isToastVisible && (
                    <div
                        role="status"
                        aria-live="polite"
                        className="fixed right-6 top-6 z-50 flex items-center gap-3 rounded-lg border border-green-200 bg-white px-5 py-4 text-green-700 shadow-lg"
                    >
                        <span
                            aria-hidden="true"
                            className="flex size-6 items-center justify-center rounded-full bg-green-600 text-sm font-bold text-white"
                        >
                            ✓
                        </span>

                        <p className="font-semibold">
                            担当者アカウントを登録しました。
                        </p>

                        <button
                            type="button"
                            aria-label="通知を閉じる"
                            onClick={closeToast}
                            className="ml-2 text-xl text-gray-500"
                        >
                            ×
                        </button>
                    </div>
                )}
            </>
        );
    };