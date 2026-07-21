import {
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from "vitest";

import { SearchProductByCategoryService } from "@/services/SearchProductByCategoryService";

import type { IProductRepository } from "@/interfaces/IProductRepository";
import type { Product } from "@/models/Product";

/**
 * SearchProductByCategoryServiceの単体テスト
 */
describe(
    "SearchProductByCategoryService",
    () => {
        let productRepository:
            IProductRepository;

        let service:
            SearchProductByCategoryService;

        beforeEach(() => {
            /**
             * IProductRepositoryのモックを作成
             */
            productRepository = {
                selectByProductCategoryId:
                    vi.fn(),
            } as unknown as IProductRepository;

            /**
             * モックRepositoryを注入して
             * テスト対象のServiceを生成
             */
            service =
                new SearchProductByCategoryService(
                    productRepository
                );
        });

        /**
         * 正常系
         *
         * カテゴリUUIDを指定して、
         * 削除されていない商品一覧を取得できることを確認する
         */
        it(
            "カテゴリUUIDを指定して商品一覧を取得できる",
            async () => {
                const categoryUuid =
                    "test-category-uuid";

                const showDeletedOnly =
                    false;

                const products = [
                    {} as Product,
                    {} as Product,
                ];

                vi.mocked(
                    productRepository
                        .selectByProductCategoryId
                ).mockResolvedValue(
                    products
                );

                const result =
                    await service.execute(
                        categoryUuid,
                        showDeletedOnly
                    );

                expect(
                    result
                ).toEqual(
                    products
                );

                expect(
                    productRepository
                        .selectByProductCategoryId
                ).toHaveBeenCalledWith(
                    categoryUuid,
                    false
                );

                expect(
                    productRepository
                        .selectByProductCategoryId
                ).toHaveBeenCalledTimes(
                    1
                );
            }
        );

        /**
         * 正常系
         *
         * showDeletedOnlyがtrueの場合、
         * 削除済み商品一覧を取得できることを確認する
         */
        it(
            "削除済み商品のみを取得できる",
            async () => {
                const categoryUuid =
                    "test-category-uuid";

                const showDeletedOnly =
                    true;

                const deletedProducts = [
                    {} as Product,
                    {} as Product,
                ];

                vi.mocked(
                    productRepository
                        .selectByProductCategoryId
                ).mockResolvedValue(
                    deletedProducts
                );

                const result =
                    await service.execute(
                        categoryUuid,
                        showDeletedOnly
                    );

                expect(
                    result
                ).toEqual(
                    deletedProducts
                );

                expect(
                    productRepository
                        .selectByProductCategoryId
                ).toHaveBeenCalledWith(
                    categoryUuid,
                    true
                );

                expect(
                    productRepository
                        .selectByProductCategoryId
                ).toHaveBeenCalledTimes(
                    1
                );
            }
        );

        /**
         * 正常系
         *
         * 該当する商品が存在しない場合、
         * 空配列が返ることを確認する
         */
        it(
            "該当する商品が存在しない場合空配列を返す",
            async () => {
                const categoryUuid =
                    "test-category-uuid";

                const showDeletedOnly =
                    false;

                vi.mocked(
                    productRepository
                        .selectByProductCategoryId
                ).mockResolvedValue(
                    []
                );

                const result =
                    await service.execute(
                        categoryUuid,
                        showDeletedOnly
                    );

                expect(
                    result
                ).toEqual(
                    []
                );

                expect(
                    productRepository
                        .selectByProductCategoryId
                ).toHaveBeenCalledWith(
                    categoryUuid,
                    false
                );

                expect(
                    productRepository
                        .selectByProductCategoryId
                ).toHaveBeenCalledTimes(
                    1
                );
            }
        );

        /**
         * 異常系
         *
         * Repositoryで例外が発生した場合、
         * その例外が呼び出し元に伝播することを確認する
         */
        it(
            "Repositoryが例外を投げた場合例外が伝播する",
            async () => {
                const categoryUuid =
                    "test-category-uuid";

                const showDeletedOnly =
                    false;

                vi.mocked(
                    productRepository
                        .selectByProductCategoryId
                ).mockRejectedValue(
                    new Error(
                        "商品カテゴリ検索エラー"
                    )
                );

                await expect(
                    service.execute(
                        categoryUuid,
                        showDeletedOnly
                    )
                ).rejects.toThrow(
                    "商品カテゴリ検索エラー"
                );

                expect(
                    productRepository
                        .selectByProductCategoryId
                ).toHaveBeenCalledWith(
                    categoryUuid,
                    false
                );

                expect(
                    productRepository
                        .selectByProductCategoryId
                ).toHaveBeenCalledTimes(
                    1
                );
            }
        );
    }
);