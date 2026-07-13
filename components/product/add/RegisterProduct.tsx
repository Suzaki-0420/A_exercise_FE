"use client";

import { useRegisterProduct } from "@/components/hooks/useRegisterProduct";
import type { FormEvent } from "react";

/**
 * 新商品登録（入力）コンポーネント
 */
export const RegisterProduct = () => {
    const {
        formData,
        categories,
        errors,
        isLoading,
        isConfirmOpen,
        isToastVisible,
        handleChange,
        handleStockChange,
        handleCategoryChange,
        handleNameBlur,
        openConfirmModal,
        closeConfirmModal,
        confirmRegisterProduct,
        closeToast,
        resetForm,
    } = useRegisterProduct();

    /**
     * 入力画面の確認ボタン押下処理
     */
    const handleSubmit = (
        event: FormEvent<HTMLFormElement>
    ) => {
        event.preventDefault();

        openConfirmModal();
    };

    return (
        <>
            <main className="flex min-h-screen justify-center bg-white px-6 py-12">
                <section className="w-full max-w-xl">
                    <h1 className="mb-10 text-center text-2xl font-bold">
                        新商品登録（入力）
                    </h1>

                    {errors.system && (
                        <p className="mb-4 text-center text-sm text-red-600">
                            {errors.system}
                        </p>
                    )}

                    {errors.submit &&
                        !isConfirmOpen && (
                            <p className="mb-4 text-center text-sm text-red-600">
                                {errors.submit}
                            </p>
                        )}

                    <form
                        onSubmit={handleSubmit}
                        className="space-y-6"
                    >
                        {/* 商品名 */}
                        <div className="grid grid-cols-[140px_1fr] items-start gap-4">
                            <label
                                htmlFor="name"
                                className="pt-2 text-right"
                            >
                                商品名
                            </label>

                            <div>
                                <input
                                    id="name"
                                    name="name"
                                    type="text"
                                    value={formData.name}
                                    onChange={handleChange}
                                    onBlur={handleNameBlur}
                                    maxLength={100}
                                    disabled={isLoading}
                                    className="w-full rounded border border-gray-300 px-3 py-2"
                                />

                                {errors.name && (
                                    <p className="mt-1 text-sm text-red-600">
                                        {errors.name}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* 単価 */}
                        <div className="grid grid-cols-[140px_1fr] items-start gap-4">
                            <label
                                htmlFor="price"
                                className="pt-2 text-right"
                            >
                                単価
                            </label>

                            <div>
                                <input
                                    id="price"
                                    name="price"
                                    type="number"
                                    value={formData.price}
                                    onChange={handleChange}
                                    min={0}
                                    max={1000000}
                                    disabled={isLoading}
                                    className="w-full rounded border border-gray-300 px-3 py-2"
                                />

                                {errors.price && (
                                    <p className="mt-1 text-sm text-red-600">
                                        {errors.price}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* 在庫数 */}
                        <div className="grid grid-cols-[140px_1fr] items-start gap-4">
                            <label
                                htmlFor="stock"
                                className="pt-2 text-right"
                            >
                                在庫数
                            </label>

                            <div>
                                <input
                                    id="stock"
                                    name="stock"
                                    type="number"
                                    value={
                                        formData
                                            .productStock
                                            ?.quantity ?? 0
                                    }
                                    onChange={
                                        handleStockChange
                                    }
                                    min={0}
                                    disabled={isLoading}
                                    className="w-full rounded border border-gray-300 px-3 py-2"
                                />

                                {(errors.stock ||
                                    errors.quantity) && (
                                        <p className="mt-1 text-sm text-red-600">
                                            {errors.stock ??
                                                errors.quantity}
                                        </p>
                                    )}
                            </div>
                        </div>

                        {/* 商品カテゴリ */}
                        <div className="grid grid-cols-[140px_1fr] items-start gap-4">
                            <label
                                htmlFor="categoryUuid"
                                className="pt-2 text-right"
                            >
                                商品カテゴリ
                            </label>

                            <div>
                                <select
                                    id="categoryUuid"
                                    name="categoryUuid"
                                    value={
                                        formData
                                            .productCategory
                                            ?.categoryUuid ??
                                        ""
                                    }
                                    onChange={(event) =>
                                        handleCategoryChange(
                                            event.target
                                                .value
                                        )
                                    }
                                    disabled={isLoading}
                                    className="w-full rounded border border-gray-300 px-3 py-2"
                                >
                                    <option value="">
                                        選択してください
                                    </option>

                                    {categories.map(
                                        (category) => (
                                            <option
                                                key={
                                                    category.categoryUuid
                                                }
                                                value={
                                                    category.categoryUuid
                                                }
                                            >
                                                {
                                                    category.name
                                                }
                                            </option>
                                        )
                                    )}
                                </select>

                                {(errors.categoryUuid ||
                                    errors.productCategory ||
                                    errors.category) && (
                                        <p className="mt-1 text-sm text-red-600">
                                            {errors.categoryUuid ??
                                                errors.productCategory ??
                                                errors.category}
                                        </p>
                                    )}
                            </div>
                        </div>

                        {/* 入力画面ボタン */}
                        <div className="flex justify-center gap-6 pt-6">
                            <button
                                type="button"
                                onClick={resetForm}
                                disabled={isLoading}
                                className="rounded border border-green-600 px-5 py-2 font-bold text-green-600 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                キャンセル
                            </button>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="rounded bg-green-600 px-5 py-2 font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                確認
                            </button>
                        </div>
                    </form>
                </section>
            </main>

            {/* 確認モーダル */}
            {isConfirmOpen && (
                <div
                    className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4"
                    role="presentation"
                    onMouseDown={closeConfirmModal}
                >
                    <section
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="register-confirm-title"
                        className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl"
                        onMouseDown={(event) =>
                            event.stopPropagation()
                        }
                    >
                        <h2
                            id="register-confirm-title"
                            className="mb-6 text-center text-xl font-bold"
                        >
                            登録内容の確認
                        </h2>

                        <p className="mb-6 text-center text-sm text-gray-600">
                            以下の内容で商品を登録します。
                        </p>

                        <dl className="space-y-4">
                            <div className="grid grid-cols-[120px_1fr] gap-4 border-b border-gray-200 pb-3">
                                <dt className="font-semibold">
                                    商品名
                                </dt>

                                <dd className="break-words">
                                    {formData.name}
                                </dd>
                            </div>

                            <div className="grid grid-cols-[120px_1fr] gap-4 border-b border-gray-200 pb-3">
                                <dt className="font-semibold">
                                    単価
                                </dt>

                                <dd>
                                    {formData.price.toLocaleString()}
                                    円
                                </dd>
                            </div>

                            <div className="grid grid-cols-[120px_1fr] gap-4 border-b border-gray-200 pb-3">
                                <dt className="font-semibold">
                                    在庫数
                                </dt>

                                <dd>
                                    {formData
                                        .productStock
                                        ?.quantity ?? 0}
                                    個
                                </dd>
                            </div>

                            <div className="grid grid-cols-[120px_1fr] gap-4 border-b border-gray-200 pb-3">
                                <dt className="font-semibold">
                                    商品カテゴリ
                                </dt>

                                <dd>
                                    {formData
                                        .productCategory
                                        ?.name ??
                                        "未選択"}
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
                                disabled={isLoading}
                                className="rounded border border-gray-400 px-5 py-2 font-semibold text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                戻る
                            </button>

                            <button
                                type="button"
                                onClick={
                                    confirmRegisterProduct
                                }
                                disabled={isLoading}
                                className="rounded bg-green-600 px-5 py-2 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
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
                        商品を登録しました。
                    </p>

                    <button
                        type="button"
                        aria-label="通知を閉じる"
                        onClick={closeToast}
                        className="ml-2 text-xl leading-none text-gray-500 hover:text-gray-800"
                    >
                        ×
                    </button>
                </div>
            )}
        </>
    );
};