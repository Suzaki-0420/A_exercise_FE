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
        isSuccess,
        handleChange,
        handleStockChange,
        handleCategoryChange,
        handleNameBlur,
        handleRegisterProduct,
        resetForm,
    } = useRegisterProduct();

    /**
     * 商品登録処理
     */
    const handleSubmit = async (
        event: FormEvent<HTMLFormElement>
    ) => {
        event.preventDefault();

        await handleRegisterProduct();
    };

    /**
     * キャンセル処理
     */
    const handleCancel = () => {
        resetForm();
    };

    return (
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

                {errors.submit && (
                    <p className="mb-4 text-center text-sm text-red-600">
                        {errors.submit}
                    </p>
                )}

                {isSuccess && (
                    <p className="mb-4 text-center text-sm text-green-600">
                        商品を登録しました。
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
                                    formData.productStock
                                        ?.quantity ?? 0
                                }
                                onChange={handleStockChange}
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
                                    formData.productCategory
                                        ?.categoryUuid ?? ""
                                }
                                onChange={(event) =>
                                    handleCategoryChange(
                                        event.target.value
                                    )
                                }
                                disabled={isLoading}
                                className="w-full rounded border border-gray-300 px-3 py-2"
                            >
                                <option value="">
                                    選択してください
                                </option>

                                {categories.map((category) => (
                                    <option
                                        key={category.categoryUuid}
                                        value={category.categoryUuid}
                                    >
                                        {category.name}
                                    </option>
                                ))}
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

                    {/* ボタン */}
                    <div className="flex justify-center gap-6 pt-6">
                        <button
                            type="button"
                            onClick={handleCancel}
                            disabled={isLoading}
                            className="rounded border border-green-600 px-5 py-2 font-bold text-green-600"
                        >
                            キャンセル
                        </button>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="rounded bg-green-600 px-5 py-2 font-bold text-white"
                        >
                            {isLoading
                                ? "登録中..."
                                : "完了"}
                        </button>
                    </div>
                </form>
            </section>
        </main>
    );
};