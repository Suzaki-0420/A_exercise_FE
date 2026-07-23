import { injectable, inject } from "inversify";
import type { IProductRepository } from "../interfaces/IProductRepository";
import type { Product } from "@/models/Product";
import { TYPES } from "../di/types";
import { ISearchProductByKeywordService } from "@/interfaces/ISearchProductByKeywordService";
/**
 * 演習 6-2 データアクセスとサービスを実装する
 * 商品キーワード検索サービスインターフェイスの実装
 */
@injectable()
export class SearchProductByKeywordService implements ISearchProductByKeywordService {
  /**
   * コンストラクタ
   * @param productRepository IProductRepositoryの実装をインジェクションする
   */
  constructor(
    @inject(TYPES.IProductRepository)
    private productRepository: IProductRepository,
  ) {}

  /**
   * 商品検索を実行する
   * @param keyword 検索キーワード
   * @returns 検索結果の商品のリスト
   */
  public async execute(
    keyword: string,
    showDeletedOnly: boolean,
  ): Promise<Product[]> {
    // ユースケース固有のビジネスロジックをここに記述可能
    return await this.productRepository.searchKeyword(keyword, showDeletedOnly);
  }
}
