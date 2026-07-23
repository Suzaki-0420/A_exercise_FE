import { ProductCategory } from "@/models/ProductCategory";
/**
 * UC014 カテゴリ登録Serviceインターフェイス
 */
export interface IRegisterCategoryService {
  /**
   * カテゴリ名の重複確認をする
   */
  validateCategoryName(name: string): Promise<void>;

  /**
   * カテゴリを登録する
   */
  registerCategory(productCategory: ProductCategory): Promise<ProductCategory>;
}
