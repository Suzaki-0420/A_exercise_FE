import { Product } from "./Product";

/**
 * 注文明細を表すモデル
 */
export interface OrdersDetail {
  /**
   * 注文明細ID
   */
  id: number;

  /**
   * 商品
   */
  product: Product;

  /**
   * 合計金額
   */
  count: number;
}
