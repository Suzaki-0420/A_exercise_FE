// @vitest-environment jsdom

import {
    act,
    cleanup,
    renderHook,
} from "@testing-library/react";

import {
    afterEach,
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from "vitest";

import type { Product } from "@/models/Product";

/**
 * Serviceのexecuteモック
 */
const {
    mockExecute,
    mockContainerGet,
} = vi.hoisted(() => ({
    mockExecute: vi.fn(),
    mockContainerGet: vi.fn(),
}));

/**
 * DIコンテナをモックする
 */
vi.mock(
    "@/di/container",
    () => ({
        container: {
            get: mockContainerGet,
        },
    })
);

/**
 * TYPESをモックする
 */
vi.mock(
    "@/di/types",
    () => ({
        TYPES: {
            ISearchProductByKeywordService:
                Symbol(
                    "ISearchProductByKeywordService"
                ),
        },
    })
);

import {
    useSearchProductByKeyword,
} from "@/components/hooks/useSearchProductByKeyword";

/**
 * キーワード商品検索Hookのテスト
 */
describe(
    "useSearchProductByKeyword",
    () => {
        const products = [
            {
                productUuid:
                    "product-uuid-001",
                name: "ノート",
                price: 300,
                imageUrl: null,
                productCategory: null,
                productStock: {
                    stockUuid:
                        "stock-uuid-001",
                    quantity: 10,
                },
                deleteFlg: 0,
            },
            {
                productUuid:
                    "product-uuid-002",
                name: "ボールペン",
                price: 150,
                imageUrl: null,
                productCategory: null,
                productStock: {
                    stockUuid:
                        "stock-uuid-002",
                    quantity: 20,
                },
                deleteFlg: 0,
            },
        ] satisfies Product[];

        beforeEach(() => {
            vi.clearAllMocks();

            mockContainerGet.mockReturnValue({
                execute: mockExecute,
            });
        });

        afterEach(() => {
            cleanup();
        });

        /**
         * 初期状態
         */
        it(
            "初期状態が正しい",
            () => {
                const {
                    result,
                } = renderHook(
                    () =>
                        useSearchProductByKeyword()
                );

                expect(
                    result.current.products
                ).toEqual([]);

                expect(
                    result.current.isLoading
                ).toBe(false);

                expect(
                    result.current.error
                ).toBeNull();

                expect(
                    result.current.search
                ).toEqual(
                    expect.any(Function)
                );
            }
        );

        /**
         * Service取得
         */
        it(
            "ServiceをDIコンテナから取得する",
            () => {
                renderHook(
                    () =>
                        useSearchProductByKeyword()
                );

                expect(
                    mockContainerGet
                ).toHaveBeenCalledTimes(1);
            }
        );

        /**
         * 検索成功
         */
        it(
            "キーワード検索に成功した場合商品一覧を設定する",
            async () => {
                mockExecute
                    .mockResolvedValueOnce(
                        products
                    );

                const {
                    result,
                } = renderHook(
                    () =>
                        useSearchProductByKeyword()
                );

                await act(async () => {
                    await result.current.search(
                        "ノート",
                        false
                    );
                });

                expect(
                    mockExecute
                ).toHaveBeenCalledWith(
                    "ノート",
                    false
                );

                expect(
                    mockExecute
                ).toHaveBeenCalledTimes(1);

                expect(
                    result.current.products
                ).toEqual(products);

                expect(
                    result.current.error
                ).toBeNull();

                expect(
                    result.current.isLoading
                ).toBe(false);
            }
        );

        /**
         * 空文字キーワード
         */
        it(
            "キーワードが空文字の場合も空文字のままServiceへ渡す",
            async () => {
                mockExecute
                    .mockResolvedValueOnce(
                        products
                    );

                const {
                    result,
                } = renderHook(
                    () =>
                        useSearchProductByKeyword()
                );

                await act(async () => {
                    await result.current.search(
                        "",
                        false
                    );
                });

                expect(
                    mockExecute
                ).toHaveBeenCalledWith(
                    "",
                    false
                );

                expect(
                    result.current.products
                ).toEqual(products);
            }
        );

        /**
         * 削除済み商品のみ検索
         */
        it(
            "削除済み商品のみ検索する場合trueをServiceへ渡す",
            async () => {
                mockExecute
                    .mockResolvedValueOnce(
                        products
                    );

                const {
                    result,
                } = renderHook(
                    () =>
                        useSearchProductByKeyword()
                );

                await act(async () => {
                    await result.current.search(
                        "ノート",
                        true
                    );
                });

                expect(
                    mockExecute
                ).toHaveBeenCalledWith(
                    "ノート",
                    true
                );
            }
        );

        /**
         * Error発生
         */
        it(
            "ServiceがErrorを投げた場合messageを設定し商品一覧を空にする",
            async () => {
                const {
                    result,
                } = renderHook(
                    () =>
                        useSearchProductByKeyword()
                );

                /*
                 * 最初の検索を成功させ、
                 * 商品一覧に値を入れておく。
                 */
                mockExecute
                    .mockResolvedValueOnce(
                        products
                    );

                await act(async () => {
                    await result.current.search(
                        "ノート",
                        false
                    );
                });

                expect(
                    result.current.products
                ).toEqual(products);

                /*
                 * 次の検索を失敗させる。
                 */
                mockExecute
                    .mockRejectedValueOnce(
                        new Error(
                            "キーワード検索エラー"
                        )
                    );

                await act(async () => {
                    await result.current.search(
                        "ペン",
                        false
                    );
                });

                expect(
                    result.current.error
                ).toBe(
                    "キーワード検索エラー"
                );

                expect(
                    result.current.products
                ).toEqual([]);

                expect(
                    result.current.isLoading
                ).toBe(false);
            }
        );

        /**
         * Error以外が投げられる
         */
        it(
            "ServiceがError以外を投げた場合既定メッセージを設定する",
            async () => {
                mockExecute
                    .mockRejectedValueOnce(
                        "unexpected error"
                    );

                const {
                    result,
                } = renderHook(
                    () =>
                        useSearchProductByKeyword()
                );

                await act(async () => {
                    await result.current.search(
                        "ノート",
                        false
                    );
                });

                expect(
                    result.current.error
                ).toBe(
                    "商品の検索に失敗しました。"
                );

                expect(
                    result.current.products
                ).toEqual([]);

                expect(
                    result.current.isLoading
                ).toBe(false);
            }
        );

        /**
         * 通信中状態
         */
        it(
            "検索処理中はisLoadingがtrueになる",
            async () => {
                let resolveSearch:
                    (
                        value: Product[]
                    ) => void =
                    () => {
                        // 後で差し替える
                    };

                mockExecute
                    .mockImplementationOnce(
                        () =>
                            new Promise<
                                Product[]
                            >(
                                (
                                    resolve
                                ) => {
                                    resolveSearch =
                                        resolve;
                                }
                            )
                    );

                const {
                    result,
                } = renderHook(
                    () =>
                        useSearchProductByKeyword()
                );

                let searchPromise:
                    Promise<void>;

                await act(async () => {
                    searchPromise =
                        result.current.search(
                            "ノート",
                            false
                        );

                    /*
                     * setIsLoading(true)を
                     * Reactへ反映させる。
                     */
                    await Promise.resolve();
                });

                expect(
                    result.current.isLoading
                ).toBe(true);

                expect(
                    result.current.error
                ).toBeNull();

                await act(async () => {
                    resolveSearch(products);

                    await searchPromise!;
                });

                expect(
                    result.current.isLoading
                ).toBe(false);

                expect(
                    result.current.products
                ).toEqual(products);
            }
        );

        /**
         * 再検索時のエラー初期化
         */
        it(
            "再検索を開始すると以前のエラーをnullにする",
            async () => {
                mockExecute
                    .mockRejectedValueOnce(
                        new Error(
                            "最初の検索エラー"
                        )
                    );

                const {
                    result,
                } = renderHook(
                    () =>
                        useSearchProductByKeyword()
                );

                await act(async () => {
                    await result.current.search(
                        "失敗",
                        false
                    );
                });

                expect(
                    result.current.error
                ).toBe(
                    "最初の検索エラー"
                );

                let resolveSearch:
                    (
                        value: Product[]
                    ) => void =
                    () => {
                        // 後で差し替える
                    };

                mockExecute
                    .mockImplementationOnce(
                        () =>
                            new Promise<
                                Product[]
                            >(
                                (
                                    resolve
                                ) => {
                                    resolveSearch =
                                        resolve;
                                }
                            )
                    );

                let searchPromise:
                    Promise<void>;

                await act(async () => {
                    searchPromise =
                        result.current.search(
                            "再検索",
                            false
                        );

                    await Promise.resolve();
                });

                expect(
                    result.current.error
                ).toBeNull();

                expect(
                    result.current.isLoading
                ).toBe(true);

                await act(async () => {
                    resolveSearch(products);

                    await searchPromise!;
                });

                expect(
                    result.current.products
                ).toEqual(products);

                expect(
                    result.current.isLoading
                ).toBe(false);
            }
        );

        /**
         * 空配列取得
         */
        it(
            "検索結果が0件の場合空配列を設定する",
            async () => {
                mockExecute
                    .mockResolvedValueOnce(
                        []
                    );

                const {
                    result,
                } = renderHook(
                    () =>
                        useSearchProductByKeyword()
                );

                await act(async () => {
                    await result.current.search(
                        "存在しない商品",
                        false
                    );
                });

                expect(
                    result.current.products
                ).toEqual([]);

                expect(
                    result.current.error
                ).toBeNull();

                expect(
                    result.current.isLoading
                ).toBe(false);
            }
        );
    }
);