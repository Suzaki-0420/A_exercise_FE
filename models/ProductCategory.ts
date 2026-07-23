/**
 * 商品カテゴリを表すモデル
 */
export interface ProductCategory {
  /**
   * 商品カテゴリ識別ID（UUID）
   */
  categoryUuid: string;

  /**
   * 商品カテゴリ名
   */
  name: string;
}
