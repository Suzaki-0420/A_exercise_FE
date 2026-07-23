import { Product } from "@/models/Product";
import { ProductCategory } from "@/models/ProductCategory";

/**
 * 商品登録Serviceインターフェイス
 */
export interface IRegisterProductService {
  /**
   * 商品名の重複確認をする
   */
  validateProductName(name: string): Promise<void>;

  /**
   * 商品カテゴリ一覧を取得する
   */
  getCategories(): Promise<ProductCategory[]>;

  /**
   * 商品を登録する
   */
  registerProduct(product: Product, imageFile: File): Promise<Product>;
}
