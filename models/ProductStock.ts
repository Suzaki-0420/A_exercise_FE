/**
 * 商品在庫を表すモデル
 */
export interface ProductStock {
  /**
   * 商品在庫識別ID（UUID）
   */
  stockUuid: string;

  /**
   * 商品在庫数
   */
  quantity: number;
}
