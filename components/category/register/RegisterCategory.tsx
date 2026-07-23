"use client";

import { useRegisterCategory } from "@/components/hooks/useRegisterCategory";
import type { FormEvent } from "react";

/**
 * 商品カテゴリー登録（入力）コンポーネント
 */
export const RegisterCategory = () => {
  const {
    formData,
    errors,
    isLoading,
    isConfirmOpen,
    isToastVisible,
    hasValidationErrors,

    handleChange,
    handleNameBlur,

    openConfirmModal,
    closeConfirmModal,
    confirmRegisterCategory,
    closeToast,
    resetForm,
  } = useRegisterCategory();

  /**
   * 確認ボタン押下時の処理
   */
  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> => {
    event.preventDefault();

    await openConfirmModal();
  };

  return (
    <>
      <main className="flex min-h-screen justify-center bg-white px-6 py-12">
        <section className="w-full max-w-xl">
          <h1 className="mb-10 text-center text-2xl font-bold">
            商品カテゴリー登録（入力）
          </h1>

          {/* システムエラー */}
          {errors.system && (
            <p role="alert" className="mb-4 text-center text-sm text-red-600">
              {errors.system}
            </p>
          )}

          {/* 登録エラー */}
          {errors.submit && !isConfirmOpen && (
            <p role="alert" className="mb-4 text-center text-sm text-red-600">
              {errors.submit}
            </p>
          )}

          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            {/* カテゴリー名 */}
            <div className="grid grid-cols-[140px_1fr] items-start gap-4">
              <label htmlFor="name" className="pt-2 text-right">
                カテゴリー名
              </label>

              <div>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  maxLength={30}
                  onChange={handleChange}
                  onBlur={handleNameBlur}
                  disabled={isLoading}
                  aria-invalid={Boolean(errors.name)}
                  aria-describedby={
                    errors.name ? "category-name-error" : undefined
                  }
                  className={`w-full rounded border px-3 py-2 ${
                    errors.name ? "border-red-500" : "border-gray-300"
                  }`}
                />

                <div className="mt-1 flex justify-between">
                  <div>
                    {errors.name && (
                      <p
                        id="category-name-error"
                        role="alert"
                        className="text-sm text-red-600"
                      >
                        {errors.name}
                      </p>
                    )}
                  </div>

                  <p className="text-sm text-gray-500">
                    {formData.name.length}
                    /30文字
                  </p>
                </div>
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
                disabled={isLoading || hasValidationErrors}
                className="rounded bg-green-600 px-5 py-2 font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isLoading ? "確認中..." : "確認"}
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
            aria-labelledby="category-register-confirm-title"
            className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <h2
              id="category-register-confirm-title"
              className="mb-6 text-center text-xl font-bold"
            >
              登録内容の確認
            </h2>

            <p className="mb-6 text-center text-sm text-gray-600">
              以下の内容で商品カテゴリーを 登録します。
            </p>

            <dl className="space-y-4">
              <div className="grid grid-cols-[140px_1fr] gap-4 border-b border-gray-200 pb-3">
                <dt className="font-semibold">カテゴリー名</dt>

                <dd className="break-words">{formData.name}</dd>
              </div>
            </dl>

            {/* 確認画面での登録エラー */}
            {errors.submit && (
              <p role="alert" className="mt-4 text-center text-sm text-red-600">
                {errors.submit}
              </p>
            )}

            <div className="mt-8 flex justify-center gap-4">
              <button
                type="button"
                onClick={closeConfirmModal}
                disabled={isLoading}
                className="rounded border border-gray-400 px-5 py-2 font-semibold text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                戻る
              </button>

              <button
                type="button"
                onClick={confirmRegisterCategory}
                disabled={isLoading}
                className="rounded bg-green-600 px-5 py-2 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isLoading ? "登録中..." : "登録する"}
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

          <p className="font-semibold">商品カテゴリーを登録しました。</p>

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
