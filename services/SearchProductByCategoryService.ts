import { inject, injectable } from "inversify";
import type { IProductRepository } from "@/interfaces/IProductRepository";
import type { ISearchProductByCategoryService } from "@/interfaces/ISearchProductByCategoryService";
import type { Product } from "@/models/Product";
import { TYPES } from "@/di/types";

/**
 * 商品カテゴリ検索サービスの実装
 */
@injectable()
export class SearchProductByCategoryService
    implements ISearchProductByCategoryService {

    /**
     * コンストラクタ
     *
     * @param productRepository 商品リポジトリ
     */
    constructor(
        @inject(TYPES.IProductRepository)
        private readonly productRepository: IProductRepository
    ) { }

    /**
     * 商品カテゴリによる検索を実行する
     *
     * @param categoryUuid 商品カテゴリUUID
     * @param showDeletedOnly 削除済み商品のみ表示するか
     * @returns 商品一覧
     */
    public async execute(
        categoryUuid: string,
        showDeletedOnly: boolean
    ): Promise<Product[]> {
        return await this.productRepository
            .selectByProductCategoryId(
                categoryUuid,
                showDeletedOnly
            );
    }
}