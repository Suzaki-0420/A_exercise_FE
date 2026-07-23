import type { ProductCategory } from "@/models/ProductCategory";

/**
 * 商品カテゴリRepositoryインターフェイス
 */
export interface IProductCategoryRepository {
  /**
   * すべての商品カテゴリを取得する
   */
  findAll(): Promise<ProductCategory[]>;

  /**
   * 指定された商品カテゴリUUIDの商品カテゴリを取得する
   */
  findById(categoryUuid: string): Promise<ProductCategory | null>;

  /**
   * 商品カテゴリ名がすでに登録されていないか確認する
   */
  existsByName(name: string): Promise<void>;

  /**
   * 商品カテゴリを登録する
   */
  create(productCategory: ProductCategory): Promise<ProductCategory>;
}
