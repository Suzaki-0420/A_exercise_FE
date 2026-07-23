"use client";

import {
  useUpdateProduct,
  type UseUpdateProductOptions,
} from "@/components/hooks/useUpdateProduct";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { Spinner } from "@/components/ui/spinner";
import { CircleAlertIcon, ImageIcon, SaveIcon } from "lucide-react";

const FieldError = ({ id, message }: { id: string; message?: string }) =>
  message ? (
    <p id={id} className="text-sm text-red-600">
      {message}
    </p>
  ) : null;

/**
 * BP009 商品修正（入力）画面
 */
export const UpdateProduct = ({
  productUuid,
  variant = "page",
  options,
}: {
  productUuid: string;
  variant?: "page" | "modal";
  options?: UseUpdateProductOptions;
}) => {
  const {
    formData,
    categories,
    imageFile,
    imagePreviewUrl,
    fieldErrors,
    submitError,
    isLoading,
    handleChange,
    handleImageChange,
    handleNameBlur,
    handlePriceBlur,
    handleStockBlur,
    handleCategoryBlur,
    handleImageBlur,
    handleProceedToConfirm,
    handleCancel,
  } = useUpdateProduct(productUuid, options);

  if (isLoading) {
    if (variant === "modal") {
      return (
        <div
          role="status"
          className="flex min-h-48 items-center justify-center gap-2 px-4 py-12 text-sm text-gray-600"
        >
          <Spinner aria-hidden="true" />
          商品情報を読み込んでいます...
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
          商品情報を読み込んでいます...
        </div>
      </main>
    );
  }

  if (!formData) {
    const errorContent = (
      <div className="w-full max-w-2xl">
        <Alert variant="destructive">
          <CircleAlertIcon />
          <AlertTitle>商品情報を表示できません</AlertTitle>
          <AlertDescription>
            {submitError ?? "商品情報の取得に失敗しました。"}
          </AlertDescription>
        </Alert>
      </div>
    );

    if (variant === "modal") {
      return (
        <div className="w-full min-w-0 space-y-4 overflow-x-hidden p-6">
          {errorContent}
          <div className="flex justify-end">
            <Button type="button" variant="outline" onClick={handleCancel}>
              閉じる
            </Button>
          </div>
        </div>
      );
    }

    return (
      <main className="flex flex-1 justify-center bg-gray-50 px-4 py-12">
        {errorContent}
      </main>
    );
  }

  const stockQuantity = formData.productStock?.quantity ?? Number.NaN;

  const content = (
    <section
      aria-labelledby="update-product-title"
      className="w-full min-w-0 max-w-3xl overflow-x-hidden rounded-lg border bg-white p-5 shadow-sm sm:p-8"
    >
      <div className="mb-8">
        <h1
          id="update-product-title"
          className="text-2xl font-bold text-gray-900"
        >
          商品変更（入力）
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          変更する商品情報を入力してください。
        </p>
      </div>

      {submitError && (
        <Alert variant="destructive" className="mb-6">
          <CircleAlertIcon />
          <AlertTitle>商品情報を表示できません</AlertTitle>
          <AlertDescription>{submitError}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleProceedToConfirm} noValidate className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="name">商品名</Label>
          <Input
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            onBlur={handleNameBlur}
            aria-invalid={Boolean(fieldErrors.name)}
            aria-describedby={
              fieldErrors.name
                ? "name-description name-error"
                : "name-description"
            }
          />
          <p id="name-description" className="text-xs text-gray-500">
            2～20文字の全角・半角英数字
          </p>
          <FieldError id="name-error" message={fieldErrors.name} />
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="price">単価</Label>
            <Input
              id="price"
              name="price"
              type="number"
              min="0"
              max="1000000"
              step="1"
              value={Number.isNaN(formData.price) ? "" : formData.price}
              onChange={handleChange}
              onBlur={handlePriceBlur}
              aria-invalid={Boolean(fieldErrors.price)}
              aria-describedby="price-description price-error"
            />
            <p id="price-description" className="text-xs text-gray-500">
              0円以上100万円以下
            </p>
            <FieldError id="price-error" message={fieldErrors.price} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="stockQuantity">在庫数</Label>
            <Input
              id="stockQuantity"
              name="stockQuantity"
              type="number"
              min="0"
              max="1000"
              step="1"
              value={Number.isNaN(stockQuantity) ? "" : stockQuantity}
              onChange={handleChange}
              onBlur={handleStockBlur}
              aria-invalid={Boolean(fieldErrors.stockQuantity)}
              aria-describedby="stock-description stock-error"
            />
            <p id="stock-description" className="text-xs text-gray-500">
              0個以上1000個以下
            </p>
            <FieldError id="stock-error" message={fieldErrors.stockQuantity} />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="categoryUuid">商品カテゴリ</Label>
          <NativeSelect
            id="categoryUuid"
            name="categoryUuid"
            value={formData.productCategory?.categoryUuid ?? ""}
            onChange={handleChange}
            onBlur={handleCategoryBlur}
            aria-invalid={Boolean(fieldErrors.categoryUuid)}
            aria-describedby="category-error"
            className="w-full"
          >
            <NativeSelectOption value="">選択してください</NativeSelectOption>
            {categories.map((category) => (
              <NativeSelectOption
                key={category.categoryUuid}
                value={category.categoryUuid}
              >
                {category.name}
              </NativeSelectOption>
            ))}
          </NativeSelect>
          <FieldError id="category-error" message={fieldErrors.categoryUuid} />
        </div>

        <div className="space-y-3">
          <Label htmlFor="image">商品画像</Label>
          <Input
            id="image"
            name="image"
            type="file"
            accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
            onChange={handleImageChange}
            onBlur={handleImageBlur}
            aria-invalid={Boolean(fieldErrors.image)}
            aria-describedby="image-description image-error"
          />
          <p id="image-description" className="text-xs text-gray-500">
            変更する場合のみ選択してください。jpg・jpeg・png・webp形式、2MB以下、縦横1000px以下
          </p>
          <FieldError id="image-error" message={fieldErrors.image} />
          {imageFile && (
            <p className="break-all text-sm text-gray-700">
              選択中：{imageFile.name}
            </p>
          )}
          {imagePreviewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imagePreviewUrl}
              alt={`${formData.name}の変更後の商品画像`}
              className="size-32 rounded-md border object-contain"
            />
          ) : formData.imageUrl ? (
            // バックエンド管理画像のURL形式が確定していないため、ブラウザ標準の表示を使用する。
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={formData.imageUrl}
              alt={`${formData.name}の現在の商品画像`}
              className="size-32 rounded-md border object-contain"
            />
          ) : (
            <div className="flex size-32 items-center justify-center rounded-md border bg-gray-50 text-gray-500">
              <ImageIcon aria-hidden="true" className="size-8" />
              <span className="sr-only">商品画像なし</span>
            </div>
          )}
        </div>

        <div className="flex flex-col-reverse gap-3 border-t pt-6 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            className="sm:min-w-28"
          >
            キャンセル
          </Button>
          <Button
            type="submit"
            className="bg-green-700 text-white hover:bg-green-800 sm:min-w-28"
          >
            <SaveIcon aria-hidden="true" />
            完了
          </Button>
        </div>
      </form>
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
