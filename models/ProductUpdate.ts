/**
 * 商品修正成功時の結果
 */
export interface ProductUpdateResult {
    productUuid: string;
    name: string;
    price: number;
    stockQuantity: number;
    categoryUuid: string;
    imageUrl: string | null;
    updated: boolean;
}

/**
 * 商品修正画面の項目別エラー
 */
export type ProductUpdateFieldErrors = Partial<
    Record<
        | "name"
        | "price"
        | "stockQuantity"
        | "categoryUuid",
        string
    >
>;

/**
 * 商品修正処理で画面へ通知するエラー
 */
export class ProductUpdateError extends Error {
    public readonly status?: number;
    public readonly fieldErrors: ProductUpdateFieldErrors;

    public constructor(
        message: string,
        status?: number,
        fieldErrors: ProductUpdateFieldErrors = {}
    ) {
        super(message);
        this.name = "ProductUpdateError";
        this.status = status;
        this.fieldErrors = fieldErrors;
    }
}
