import { Product } from "@/models/Product";
import { ProductCategory } from "@/models/ProductCategory";

/**
 * 商品登録Serviceインターフェイス
 */
export interface IRegisterProductService {
    /**
     * 商品カテゴリ一覧を取得する
     */
    getCategories(): Promise<ProductCategory[]>;

    /**
     * 商品を登録する
     */
    registerProduct(
        name: string,
        price: number,
        stock: number,
        productCategory: ProductCategory,
        imageUrl?: string | null
    ): Promise<Product>;
}