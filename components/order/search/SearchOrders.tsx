"use client";

import { useSearchOrders } from
    "@/components/hooks/useSearchOrders";
import Link from "next/link";
import type { FormEvent } from "react";

/**
 * 購入履歴検索コンポーネント
 */
export const SearchOrders = () => {
    const {
        formData,
        orders,
        errors,
        isLoading,
        today,
        resultMessage,
        hasValidationErrors,

        handleChange,
        handleSearch,
        resetSearch,
    } = useSearchOrders();

    /**
     * 検索ボタン押下時の処理
     */
    const handleSubmit = async (
        event: FormEvent<HTMLFormElement>
    ): Promise<void> => {
        event.preventDefault();

        await handleSearch();
    };

    return (
        <main className="min-h-screen bg-white px-6 py-12">
            <section className="mx-auto w-full max-w-6xl">
                <h1 className="mb-10 text-center text-2xl font-bold">
                    購入履歴検索
                </h1>

                {/* システムエラー */}
                {errors.system && (
                    <p
                        role="alert"
                        className="mb-6 text-center text-sm text-red-600"
                    >
                        {errors.system}
                    </p>
                )}

                {/* 検索条件 */}
                <form
                    onSubmit={handleSubmit}
                    className="rounded-lg border border-gray-200 p-6 shadow-sm"
                    noValidate
                >
                    <div className="grid gap-6 md:grid-cols-2">
                        {/* 購入日 */}
                        <div>
                            <label
                                htmlFor="orderDate"
                                className="mb-2 block font-semibold"
                            >
                                購入日
                            </label>

                            <input
                                id="orderDate"
                                name="orderDate"
                                type="date"
                                value={
                                    formData.orderDate
                                }
                                max={today}
                                onChange={
                                    handleChange
                                }
                                disabled={
                                    isLoading
                                }
                                aria-invalid={
                                    Boolean(
                                        errors.orderDate
                                    )
                                }
                                aria-describedby={
                                    errors.orderDate
                                        ? "order-date-error"
                                        : undefined
                                }
                                className={
                                    `w-full rounded border px-3 py-2 ${errors.orderDate
                                        ? "border-red-500"
                                        : "border-gray-300"
                                    }`
                                }
                            />

                            {errors.orderDate && (
                                <p
                                    id="order-date-error"
                                    role="alert"
                                    className="mt-1 text-sm text-red-600"
                                >
                                    {
                                        errors.orderDate
                                    }
                                </p>
                            )}
                        </div>

                        {/* 顧客アカウント名 */}
                        <div>
                            <label
                                htmlFor="customerAccountName"
                                className="mb-2 block font-semibold"
                            >
                                顧客アカウント名
                            </label>

                            <input
                                id="customerAccountName"
                                name="customerAccountName"
                                type="text"
                                value={
                                    formData
                                        .customerAccountName
                                }
                                maxLength={20}
                                onChange={
                                    handleChange
                                }
                                disabled={
                                    isLoading
                                }
                                placeholder="例：yamada01"
                                aria-invalid={
                                    Boolean(
                                        errors
                                            .customerAccountName
                                    )
                                }
                                aria-describedby={
                                    errors
                                        .customerAccountName
                                        ? "customer-account-name-error"
                                        : undefined
                                }
                                className={
                                    `w-full rounded border px-3 py-2 ${errors
                                        .customerAccountName
                                        ? "border-red-500"
                                        : "border-gray-300"
                                    }`
                                }
                            />

                            <div className="mt-1 flex justify-between gap-4">
                                <div>
                                    {errors
                                        .customerAccountName && (
                                            <p
                                                id="customer-account-name-error"
                                                role="alert"
                                                className="text-sm text-red-600"
                                            >
                                                {
                                                    errors
                                                        .customerAccountName
                                                }
                                            </p>
                                        )}
                                </div>

                                <p className="shrink-0 text-sm text-gray-500">
                                    {
                                        formData
                                            .customerAccountName
                                            .length
                                    }
                                    /20文字
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* 検索エラー */}
                    {errors.submit && (
                        <p
                            role="alert"
                            className="mt-4 text-center text-sm text-red-600"
                        >
                            {errors.submit}
                        </p>
                    )}

                    {/* 操作ボタン */}
                    <div className="mt-8 flex justify-center gap-6">
                        <button
                            type="button"
                            onClick={
                                resetSearch
                            }
                            disabled={
                                isLoading
                            }
                            className="rounded border border-green-600 px-6 py-2 font-bold text-green-600 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            条件クリア
                        </button>

                        <button
                            type="submit"
                            disabled={
                                isLoading ||
                                hasValidationErrors
                            }
                            className="rounded bg-green-600 px-8 py-2 font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {isLoading
                                ? "検索中..."
                                : "検索"}
                        </button>
                    </div>
                </form>

                {/* 検索結果 */}
                <section className="mt-10">
                    <h2 className="mb-4 text-xl font-bold">
                        検索結果
                    </h2>

                    {resultMessage && (
                        <p
                            aria-live="polite"
                            className="mb-4 text-sm text-gray-600"
                        >
                            {resultMessage}
                        </p>
                    )}

                    {orders.length > 0 && (
                        <div className="overflow-x-auto rounded-lg border border-gray-200">
                            <table className="w-full min-w-[900px] border-collapse text-left">
                                <thead className="bg-gray-100">
                                    <tr>
                                        <th className="whitespace-nowrap border-b px-4 py-3">
                                            購入日時
                                        </th>

                                        <th className="whitespace-nowrap border-b px-4 py-3">
                                            顧客アカウント名
                                        </th>

                                        <th className="border-b px-4 py-3">
                                            注文内容
                                        </th>

                                        <th className="whitespace-nowrap border-b px-4 py-3">
                                            注文ステータス
                                        </th>

                                        <th className="whitespace-nowrap border-b px-4 py-3 text-center">
                                            ステータス更新
                                        </th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {orders.map(
                                        (order) => (
                                            <tr
                                                key={
                                                    order.orderUuid
                                                }
                                                className="odd:bg-white even:bg-gray-50"
                                            >
                                                {/* 購入日時 */}
                                                <td className="whitespace-nowrap border-b px-4 py-3">
                                                    {
                                                        order.orderDate ||
                                                        "-"
                                                    }
                                                </td>

                                                {/* 顧客アカウント名 */}
                                                <td className="border-b px-4 py-3">
                                                    {
                                                        order.customerAccountName ||
                                                        "-"
                                                    }
                                                </td>

                                                {/* 注文内容 */}
                                                <td className="border-b px-4 py-3">
                                                    {
                                                        order.orderContent ||
                                                        "-"
                                                    }
                                                </td>

                                                {/* 注文ステータス */}
                                                <td className="whitespace-nowrap border-b px-4 py-3">
                                                    {
                                                        order.orderStatus ||
                                                        "-"
                                                    }
                                                </td>

                                                {/* ステータス更新 */}
                                                <td className="border-b px-4 py-3 text-center">
                                                    <Link
                                                        href={
                                                            order.statusUpdateUrl ||
                                                            `/admin/order/status/update/${order.orderUuid}`
                                                        }
                                                        className="inline-block whitespace-nowrap rounded bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
                                                    >
                                                        更新
                                                    </Link>
                                                </td>
                                            </tr>
                                        )
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>
            </section>
        </main>
    );
};