import {
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from "vitest";

import { SearchProductByKeywordService } from "@/services/SearchProductByKeywordService";

import type { IProductRepository } from "@/interfaces/IProductRepository";
import type { Product } from "@/models/Product";

/**
 * SearchProductByKeywordServiceの単体テスト
 */
describe(
    "SearchProductByKeywordService",
    () => {
        let productRepository:
            IProductRepository;

        let service:
            SearchProductByKeywordService;

        beforeEach(() => {
            /**
             * IProductRepositoryのモックを作成
             */
            productRepository = {
                searchKeyword:
                    vi.fn(),
            } as unknown as IProductRepository;

            /**
             * モックRepositoryを注入して
             * テスト対象のServiceを生成
             */
            service =
                new SearchProductByKeywordService(
                    productRepository
                );
        });

        /**
         * 正常系
         *
         * キーワードを指定して、
         * 削除されていない商品一覧を取得できることを確認する
         */
        it(
            "キーワードを指定して商品一覧を取得できる",
            async () => {
                const keyword =
                    "テスト";

                const showDeletedOnly =
                    false;

                const products = [
                    {} as Product,
                    {} as Product,
                ];

                vi.mocked(
                    productRepository
                        .searchKeyword
                ).mockResolvedValue(
                    products
                );

                const result =
                    await service.execute(
                        keyword,
                        showDeletedOnly
                    );

                expect(
                    result
                ).toEqual(
                    products
                );

                expect(
                    productRepository
                        .searchKeyword
                ).toHaveBeenCalledWith(
                    keyword,
                    false
                );

                expect(
                    productRepository
                        .searchKeyword
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
                const keyword =
                    "テスト";

                const showDeletedOnly =
                    true;

                const deletedProducts = [
                    {} as Product,
                    {} as Product,
                ];

                vi.mocked(
                    productRepository
                        .searchKeyword
                ).mockResolvedValue(
                    deletedProducts
                );

                const result =
                    await service.execute(
                        keyword,
                        showDeletedOnly
                    );

                expect(
                    result
                ).toEqual(
                    deletedProducts
                );

                expect(
                    productRepository
                        .searchKeyword
                ).toHaveBeenCalledWith(
                    keyword,
                    true
                );

                expect(
                    productRepository
                        .searchKeyword
                ).toHaveBeenCalledTimes(
                    1
                );
            }
        );

        /**
         * 正常系
         *
         * 検索条件に一致する商品が存在しない場合、
         * 空配列が返ることを確認する
         */
        it(
            "該当する商品が存在しない場合空配列を返す",
            async () => {
                const keyword =
                    "存在しない商品";

                const showDeletedOnly =
                    false;

                vi.mocked(
                    productRepository
                        .searchKeyword
                ).mockResolvedValue(
                    []
                );

                const result =
                    await service.execute(
                        keyword,
                        showDeletedOnly
                    );

                expect(
                    result
                ).toEqual(
                    []
                );

                expect(
                    productRepository
                        .searchKeyword
                ).toHaveBeenCalledWith(
                    keyword,
                    false
                );

                expect(
                    productRepository
                        .searchKeyword
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
                const keyword =
                    "テスト";

                const showDeletedOnly =
                    false;

                vi.mocked(
                    productRepository
                        .searchKeyword
                ).mockRejectedValue(
                    new Error(
                        "商品キーワード検索エラー"
                    )
                );

                await expect(
                    service.execute(
                        keyword,
                        showDeletedOnly
                    )
                ).rejects.toThrow(
                    "商品キーワード検索エラー"
                );

                expect(
                    productRepository
                        .searchKeyword
                ).toHaveBeenCalledWith(
                    keyword,
                    false
                );

                expect(
                    productRepository
                        .searchKeyword
                ).toHaveBeenCalledTimes(
                    1
                );
            }
        );
    }
);