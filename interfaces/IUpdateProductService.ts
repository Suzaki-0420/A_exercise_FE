import type { Product } from "@/models/Product";
import type { ProductCategory } from "@/models/ProductCategory";
import type { ProductUpdateResult } from "@/models/ProductUpdate";

/**
 * 商品修正Serviceインターフェイス
 */
export interface IUpdateProductService {
    /**
     * 商品名の重複を確認する
     */
    validateProductName(name: string): Promise<void>;

    /**
     * 商品カテゴリ一覧を取得する
     */
    getCategories(): Promise<ProductCategory[]>;

    /**
     * 商品を修正する
     *
     * @param product 修正する商品
     * @param imageFile 差し替える画像。変更しない場合はnull
     * @returns 商品修正結果
     */
    updateProduct(
        product: Product,
        imageFile?: File | null
    ): Promise<ProductUpdateResult>;
}
