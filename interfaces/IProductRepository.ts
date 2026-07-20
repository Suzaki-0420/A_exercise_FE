import { Product } from "@/models/Product";
import { ProductCategory } from "@/models/ProductCategory";

/**
 * 商品Repositoryインターフェイス
 */
export interface IProductRepository {

    /**
     * すべての商品を取得する
     */
    findAll(): Promise<Product[]>;

    /**
     * 商品UUIDを指定して商品を取得する
     */
    findById(
        productUuid: string
    ): Promise<Product | null>;

    /**
     * 指定されたキーワードを商品名に含む商品を取得する
     */
    searchKeyword(
        keyword: string,
        showDeletedOnly: boolean
    ): Promise<Product[]>;

    /**
     * 指定された商品カテゴリに属する商品を取得する
     */
    selectByProductCategoryId(
        categoryUuid: string,
        showDeletedOnly: boolean
    ): Promise<Product[]>;

    /**
     * 商品名がすでに登録されていないか確認する
     */
    existsByName(name: string): Promise<void>;


    /**
     * 商品を登録する
     */
    register(product: Product, imageFile: File): Promise<Product>;

    /**
     * 商品を更新する
     */
    updateById(product: Product,imageFile?: File | null): Promise<boolean>;

    /**
     * 商品を削除する
     */
    deleteById(productUuid: string): Promise<boolean>;
}
