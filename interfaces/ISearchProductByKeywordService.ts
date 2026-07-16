import { Product } from "@/models/Product";
/**
 * 演習 6-2 データアクセスとサービスを実装する
 * 商品キーワード検索サービスインターフェイス
 */
export interface ISearchProductServiceByKeywordService {
    /**
     * 商品検索を実行する
     * @param keyword 検索キーワード
     * @returns 検索結果の商品のリスト
     */
    execute(keyword: string,showDeletedOnly: boolean): Promise<Product[]>;
}