import type { Product } from "@/models/Product";

/**
 * 商品カテゴリ検索サービスのインターフェース
 */
export interface ISearchProductByCategoryService {
    /**
     * 商品カテゴリによる検索を実行する
     *
     * @param categoryUuid 商品カテゴリUUID
     * 未指定の場合は空文字を渡し、全商品を取得する
     * @param showDeletedOnly 削除済み商品のみ表示するか
     * @returns 検索結果の商品一覧
     */
    execute(
        categoryUuid: string,
        showDeletedOnly: boolean
    ): Promise<Product[]>;
}