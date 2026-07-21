"use client";

import {
    useUpdateOrderStatus,
} from "@/components/hooks/useUpdateOrderStatus";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";

/**
 * 注文ステータス更新コンポーネントのProps
 */
type UpdateOrderStatusProps = {
    orderUuid: string;
    currentStatusId?: number;
    currentStatusName?: string;
};

/**
 * 注文ステータス更新コンポーネント
 */
export const UpdateOrderStatus = ({
    orderUuid,
    currentStatusId = 0,
    currentStatusName = "",
}: UpdateOrderStatusProps) => {
    const router = useRouter();

    const {
        order,
        confirmedOrder,

        orderStatusOptions,
        selectedStatusId,

        errors,
        isLoading,
        isConfirmOpen,
        isToastVisible,
        hasValidationErrors,

        handleStatusChange,
        handleStatusBlur,

        openConfirmModal,
        closeConfirmModal,
        confirmUpdateStatus,

        resetStatus,
        closeToast,
    } = useUpdateOrderStatus(
        orderUuid,
        currentStatusId,
        currentStatusName
    );

    /**
     * 購入日時を表示用に変換する
     */
    const formattedOrderDate =
        order?.orderDate
            ? new Date(
                order.orderDate
            ).toLocaleString(
                "ja-JP"
            )
            : "-";

    /**
     * 確認画面の購入日時を
     * 表示用に変換する
     */
    const formattedConfirmOrderDate =
        confirmedOrder?.orderDate
            ? new Date(
                confirmedOrder.orderDate
            ).toLocaleString(
                "ja-JP"
            )
            : formattedOrderDate;

    /**
     * 確認ボタン押下時の処理
     */
    const handleSubmit = async (
        event: FormEvent<HTMLFormElement>
    ) => {
        event.preventDefault();

        await openConfirmModal();
    };

    /**
     * キャンセルボタン押下時の処理
     */
    const handleCancel = () => {
        router.push(
            "/admin/order/search"
        );
    };

    /**
     * 初期読み込み中
     */
    if (
        isLoading &&
        !order
    ) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-white">
                <p className="text-gray-600">
                    注文情報を読み込んでいます...
                </p>
            </main>
        );
    }

    return (
        <>
            <main className="flex min-h-screen justify-center bg-white px-6 py-12">
                <section className="w-full max-w-2xl">
                    <h1 className="mb-10 text-center text-2xl font-bold">
                        注文ステータス更新（入力）
                    </h1>

                    {errors.system && (
                        <p className="mb-6 text-center text-sm text-red-600">
                            {errors.system}
                        </p>
                    )}

                    {errors.submit &&
                        !isConfirmOpen && (
                            <p className="mb-6 text-center text-sm text-red-600">
                                {errors.submit}
                            </p>
                        )}

                    {!order ? (
                        <div className="text-center">
                            <button
                                type="button"
                                onClick={
                                    handleCancel
                                }
                                className="rounded bg-green-600 px-5 py-2 font-bold text-white"
                            >
                                購入履歴検索へ戻る
                            </button>
                        </div>
                    ) : (
                        <form
                            onSubmit={
                                handleSubmit
                            }
                            className="space-y-6"
                            noValidate
                        >
                            {/* 購入日時 */}
                            <div className="grid grid-cols-[180px_1fr] items-start gap-4">
                                <p className="text-right font-semibold">
                                    購入日時
                                </p>

                                <p>
                                    {
                                        formattedOrderDate
                                    }
                                </p>
                            </div>

                            {/* 顧客アカウント名 */}
                            <div className="grid grid-cols-[180px_1fr] items-start gap-4">
                                <p className="text-right font-semibold">
                                    顧客アカウント名
                                </p>

                                <p>
                                    {order.customerAccountName ||
                                        "-"}
                                </p>
                            </div>

                            {/* 注文ID */}
                            <div className="grid grid-cols-[180px_1fr] items-start gap-4">
                                <p className="text-right font-semibold">
                                    注文ID
                                </p>

                                <p className="break-all">
                                    {order.orderId ||
                                        "-"}
                                </p>
                            </div>

                            {/* 注文内容 */}
                            <div className="grid grid-cols-[180px_1fr] items-start gap-4">
                                <p className="text-right font-semibold">
                                    注文内容
                                </p>

                                <p className="whitespace-pre-line break-words">
                                    {order.orderContent ||
                                        "注文内容がありません"}
                                </p>
                            </div>

                            {/* 現在のステータス */}
                            <div className="grid grid-cols-[180px_1fr] items-start gap-4">
                                <p className="text-right font-semibold">
                                    現在のステータス
                                </p>

                                <p>
                                    {order.currentStatusName ||
                                        "-"}
                                </p>
                            </div>

                            {/* 新しいステータス */}
                            <div className="grid grid-cols-[180px_1fr] items-start gap-4">
                                <label
                                    htmlFor="orderStatus"
                                    className="pt-2 text-right font-semibold"
                                >
                                    新しいステータス
                                </label>

                                <div>
                                    <select
                                        id="orderStatus"
                                        name="orderStatus"
                                        value={
                                            selectedStatusId
                                        }
                                        onChange={(
                                            event
                                        ) =>
                                            handleStatusChange(
                                                Number(
                                                    event
                                                        .target
                                                        .value
                                                )
                                            )
                                        }
                                        onBlur={
                                            handleStatusBlur
                                        }
                                        disabled={
                                            isLoading
                                        }
                                        className={`w-full rounded border px-3 py-2 ${errors.orderStatus
                                            ? "border-red-500"
                                            : "border-gray-300"
                                            }`}
                                    >
                                        <option
                                            value={0}
                                        >
                                            選択してください
                                        </option>

                                        {orderStatusOptions.map(
                                            (
                                                status
                                            ) => (
                                                <option
                                                    key={
                                                        status.id
                                                    }
                                                    value={
                                                        status.id
                                                    }
                                                >
                                                    {
                                                        status.name
                                                    }
                                                </option>
                                            )
                                        )}
                                    </select>

                                    {errors.orderStatus && (
                                        <p className="mt-1 text-sm text-red-600">
                                            {
                                                errors.orderStatus
                                            }
                                        </p>
                                    )}

                                    {orderStatusOptions
                                        .length ===
                                        0 && (
                                            <p className="mt-1 text-sm text-red-600">
                                                注文ステータス一覧を取得できませんでした。
                                            </p>
                                        )}
                                </div>
                            </div>

                            {/* 入力画面ボタン */}
                            <div className="flex justify-center gap-6 pt-8">
                                <button
                                    type="button"
                                    onClick={
                                        handleCancel
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
                                        selectedStatusId ===
                                        0 ||
                                        selectedStatusId ===
                                        order.currentStatusId ||
                                        orderStatusOptions
                                            .length ===
                                        0
                                    }
                                    className="rounded bg-green-600 px-5 py-2 font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {isLoading
                                        ? "確認中..."
                                        : "確認"}
                                </button>
                            </div>
                        </form>
                    )}
                </section>
            </main>

            {/* 確認モーダル */}
            {isConfirmOpen &&
                order &&
                confirmedOrder && (
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
                            aria-labelledby="update-order-status-confirm-title"
                            className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl"
                            onMouseDown={(
                                event
                            ) =>
                                event
                                    .stopPropagation()
                            }
                        >
                            <h2
                                id="update-order-status-confirm-title"
                                className="mb-6 text-center text-xl font-bold"
                            >
                                注文ステータス更新（確認）
                            </h2>

                            <p className="mb-6 text-center text-sm text-gray-600">
                                以下の内容で注文ステータスを更新します。
                            </p>

                            <dl className="space-y-4">
                                <div className="grid grid-cols-[150px_1fr] gap-4 border-b border-gray-200 pb-3">
                                    <dt className="font-semibold">
                                        購入日時
                                    </dt>

                                    <dd>
                                        {
                                            formattedConfirmOrderDate
                                        }
                                    </dd>
                                </div>

                                <div className="grid grid-cols-[150px_1fr] gap-4 border-b border-gray-200 pb-3">
                                    <dt className="font-semibold">
                                        顧客アカウント名
                                    </dt>

                                    <dd>
                                        {confirmedOrder
                                            .customerAccountName ||
                                            order
                                                .customerAccountName ||
                                            "-"}
                                    </dd>
                                </div>

                                <div className="grid grid-cols-[150px_1fr] gap-4 border-b border-gray-200 pb-3">
                                    <dt className="font-semibold">
                                        注文ID
                                    </dt>

                                    <dd className="break-all">
                                        {confirmedOrder
                                            .orderId ||
                                            order
                                                .orderId ||
                                            "-"}
                                    </dd>
                                </div>

                                <div className="grid grid-cols-[150px_1fr] gap-4 border-b border-gray-200 pb-3">
                                    <dt className="font-semibold">
                                        現在のステータス
                                    </dt>

                                    <dd>
                                        {confirmedOrder
                                            .currentStatusName ||
                                            order
                                                .currentStatusName ||
                                            "-"}
                                    </dd>
                                </div>

                                <div className="grid grid-cols-[150px_1fr] gap-4 border-b border-gray-200 pb-3">
                                    <dt className="font-semibold">
                                        新しいステータス
                                    </dt>

                                    <dd className="font-bold text-green-700">
                                        {confirmedOrder
                                            .newStatusName ||
                                            "-"}
                                    </dd>
                                </div>
                            </dl>

                            {errors.submit && (
                                <p className="mt-4 text-center text-sm text-red-600">
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
                                    className="rounded border border-gray-400 px-5 py-2 font-semibold text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    戻る
                                </button>

                                <button
                                    type="button"
                                    onClick={
                                        confirmUpdateStatus
                                    }
                                    disabled={
                                        isLoading
                                    }
                                    className="rounded bg-green-600 px-5 py-2 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {isLoading
                                        ? "更新中..."
                                        : "確定する"}
                                </button>
                            </div>
                        </section>
                    </div>
                )}

            {/* 更新完了トースト */}
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
                        注文ステータスを更新しました。
                    </p>

                    <button
                        type="button"
                        aria-label="通知を閉じる"
                        onClick={
                            closeToast
                        }
                        className="ml-2 text-xl leading-none text-gray-500 hover:text-gray-800"
                    >
                        ×
                    </button>
                </div>
            )}
        </>
    );
};