"use client";

import {
    useUpdateProduct,
    type UseUpdateProductOptions,
} from "@/components/hooks/useUpdateProduct";
import {
    Alert,
    AlertDescription,
    AlertTitle,
} from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
    ArrowLeftIcon,
    CheckIcon,
    CircleAlertIcon,
    ImageIcon,
} from "lucide-react";
import { useEffect } from "react";

const Detail = ({
    label,
    children,
}: {
    label: string;
    children: React.ReactNode;
}) => (
    <div className="grid min-w-0 gap-1 border-b py-4 sm:grid-cols-[10rem_1fr] sm:gap-4">
        <dt className="font-medium text-gray-700">
            {label}
        </dt>
        <dd className="min-w-0 break-words [overflow-wrap:anywhere] text-gray-900">
            {children}
        </dd>
    </div>
);

/**
 * BP010 商品修正（確認）画面
 */
export const UpdateProductConfirm = ({
    variant = "page",
    options,
}: {
    variant?: "page" | "modal";
    options?: UseUpdateProductOptions;
} = {}) => {
    const {
        draft,
        imageFile,
        imagePreviewUrl,
        fieldErrors,
        submitError,
        isLoading,
        handleUpdate,
        handleBackToInput,
        handleCancel,
        handleInvalidFlow,
    } = useUpdateProduct(
        undefined,
        options
    );

    useEffect(() => {
        if (!draft) {
            handleInvalidFlow("/admin/product");
        }
    }, [draft, handleInvalidFlow]);

    if (!draft) {
        if (variant === "modal") {
            return (
                <div
                    role="status"
                    className="flex min-h-48 items-center justify-center gap-2 px-4 py-12 text-sm text-gray-600"
                >
                    <Spinner aria-hidden="true" />
                    商品検索画面へ移動しています...
                </div>
            );
        }

        return (
            <main className="flex flex-1 items-center justify-center bg-gray-50 px-4 py-12">
                <div
                    role="status"
                    className="flex items-center gap-2 text-sm text-gray-600"
                >
                    <Spinner aria-hidden="true" />
                    商品検索画面へ移動しています...
                </div>
            </main>
        );
    }

    const content = (
        <section
            aria-labelledby="update-product-confirm-title"
            className="w-full min-w-0 max-w-3xl overflow-x-hidden rounded-lg border bg-white p-5 shadow-sm sm:p-8"
        >
                <div className="mb-6">
                    <h1
                        id="update-product-confirm-title"
                        className="text-2xl font-bold text-gray-900"
                    >
                        商品変更（確認）
                    </h1>
                    <p className="mt-2 text-sm text-gray-600">
                        以下の内容で商品情報を変更します。
                    </p>
                </div>

                {submitError && (
                    <Alert
                        variant="destructive"
                        className="mb-6"
                    >
                        <CircleAlertIcon />
                        <AlertTitle>
                            商品情報を修正できませんでした
                        </AlertTitle>
                        <AlertDescription>
                            {submitError}
                            {Object.entries(fieldErrors).map(
                                ([fieldName, message]) =>
                                    message ? (
                                        <p key={fieldName}>
                                            {message}
                                        </p>
                                    ) : null
                            )}
                        </AlertDescription>
                    </Alert>
                )}

                <dl className="min-w-0 border-t">
                    <Detail label="商品名">
                        {draft.name}
                    </Detail>
                    <Detail label="単価">
                        {draft.price.toLocaleString("ja-JP")}円
                    </Detail>
                    <Detail label="在庫数">
                        {draft.productStock?.quantity.toLocaleString(
                            "ja-JP"
                        ) ?? "0"}
                        個
                    </Detail>
                    <Detail label="商品カテゴリ">
                        {draft.productCategory?.name ?? "－"}
                    </Detail>
                    <Detail label="商品画像">
                        <div className="space-y-2">
                            {imagePreviewUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={imagePreviewUrl}
                                    alt={`${draft.name}の変更後の商品画像`}
                                    className="size-32 rounded-md border object-contain"
                                />
                            ) : draft.imageUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={draft.imageUrl}
                                    alt={`${draft.name}の商品画像`}
                                    className="size-32 rounded-md border object-contain"
                                />
                            ) : (
                                <div className="flex size-32 items-center justify-center rounded-md border bg-gray-50 text-gray-500">
                                    <ImageIcon
                                        aria-hidden="true"
                                        className="size-8"
                                    />
                                    <span className="sr-only">
                                        商品画像なし
                                    </span>
                                </div>
                            )}
                            <p className="break-all text-sm text-gray-600">
                                {imageFile
                                    ? `変更後：${imageFile.name}`
                                    : "画像は変更しません。"}
                            </p>
                        </div>
                    </Detail>
                </dl>

                <div className="mt-8 flex flex-col-reverse gap-3 border-t pt-6 sm:grid sm:grid-cols-3">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleCancel}
                        disabled={isLoading}
                        className="w-full"
                    >
                        キャンセル
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleBackToInput}
                        disabled={isLoading}
                        className="w-full"
                    >
                        <ArrowLeftIcon aria-hidden="true" />
                        戻る
                    </Button>
                    <Button
                        type="button"
                        onClick={handleUpdate}
                        disabled={isLoading}
                        className="w-full bg-green-700 text-white hover:bg-green-800"
                    >
                        {isLoading ? (
                            <>
                                <Spinner aria-hidden="true" />
                                変更中...
                            </>
                        ) : (
                            <>
                                <CheckIcon aria-hidden="true" />
                                完了
                            </>
                        )}
                    </Button>
                </div>
        </section>
    );

    if (variant === "modal") {
        return content;
    }

    return (
        <main className="flex flex-1 justify-center bg-gray-50 px-4 py-10 sm:py-12">
            {content}
        </main>
    );
};
