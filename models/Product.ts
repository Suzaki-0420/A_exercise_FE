import { ProductCategory } from "./ProductCategory";
import { ProductStock } from "./ProductStock";

/**
 * 商品を表すモデル
 */
export interface Product {
    /**
     * 商品識別ID（UUID）
     */
    productUuid: string;

    /**
     * 商品名
     */
    name: string;

    /**
     * 価格
     */
    price: number;

    /**
     * 画像URL
     */
    imageUrl: string | null;

    /**
     * 商品カテゴリ
     */
    productCategory: ProductCategory | null;

    /**
     * 商品在庫
     */
    productStock: ProductStock | null;

    /**
     * 削除フラグ
     * 0: 未削除
     * 1: 削除済み
     */
    deleteFlg: number;
}