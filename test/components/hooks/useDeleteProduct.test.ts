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
 * DeleteProductServiceのモック
 *
 * vi.mockより前に使用できるよう
 * vi.hoistedで定義する
 */
const {
    mockExecute,
} = vi.hoisted(() => {
    return {
        mockExecute: vi.fn(),
    };
});

/**
 * DIコンテナをモックする
 *
 * useDeleteProduct内で
 * container.get()が呼ばれた場合、
 * モックServiceを返す
 */
vi.mock(
    "@/di/container",
    () => ({
        container: {
            get: vi.fn(() => ({
                execute:
                    mockExecute,
            })),
        },
    })
);

import {
    useDeleteProduct,
} from "@/components/hooks/useDeleteProduct";

/**
 * useDeleteProductの単体テスト
 */
describe(
    "useDeleteProduct",
    () => {
        /**
         * テスト用の商品
         */
        const product = {
            productUuid:
                "test-product-uuid",
        } as Product;

        beforeEach(() => {
            /**
             * 各テスト前に
             * モックの呼び出し履歴をリセット
             */
            vi.clearAllMocks();
        });

        afterEach(() => {
            cleanup();
        });

        /**
         * 初期状態
         *
         * Hook初期化時の状態が
         * 正しいことを確認する
         */
        it(
            "初期状態が正しい",
            () => {
                const {
                    result,
                } = renderHook(
                    () =>
                        useDeleteProduct()
                );

                expect(
                    result.current
                        .deleteTarget
                ).toBeNull();

                expect(
                    result.current
                        .isDeleteModalOpen
                ).toBe(
                    false
                );

                expect(
                    result.current
                        .isDeleting
                ).toBe(
                    false
                );

                expect(
                    result.current
                        .deleteError
                ).toBeNull();

                expect(
                    result.current
                        .isDeleteToastVisible
                ).toBe(
                    false
                );
            }
        );

        /**
         * openDeleteModal
         *
         * 商品を指定すると、
         * 削除確認モーダルが開くことを確認する
         */
        it(
            "openDeleteModalで削除確認モーダルを開ける",
            () => {
                const {
                    result,
                } = renderHook(
                    () =>
                        useDeleteProduct()
                );

                act(() => {
                    result.current
                        .openDeleteModal(
                            product
                        );
                });

                expect(
                    result.current
                        .deleteTarget
                ).toBe(
                    product
                );

                expect(
                    result.current
                        .isDeleteModalOpen
                ).toBe(
                    true
                );

                expect(
                    result.current
                        .deleteError
                ).toBeNull();
            }
        );

        /**
         * closeDeleteModal
         *
         * 削除処理中でない場合、
         * 削除確認モーダルを閉じられることを確認する
         */
        it(
            "closeDeleteModalで削除確認モーダルを閉じられる",
            () => {
                const {
                    result,
                } = renderHook(
                    () =>
                        useDeleteProduct()
                );

                act(() => {
                    result.current
                        .openDeleteModal(
                            product
                        );
                });

                expect(
                    result.current
                        .isDeleteModalOpen
                ).toBe(
                    true
                );

                act(() => {
                    result.current
                        .closeDeleteModal();
                });

                expect(
                    result.current
                        .deleteTarget
                ).toBeNull();

                expect(
                    result.current
                        .isDeleteModalOpen
                ).toBe(
                    false
                );

                expect(
                    result.current
                        .deleteError
                ).toBeNull();
            }
        );

        /**
         * closeDeleteModal
         *
         * 削除処理中の場合、
         * モーダルを閉じられないことを確認する
         */
        it(
            "削除処理中はモーダルを閉じられない",
            async () => {
                /**
                 * executeの完了を
                 * 任意のタイミングまで保留する
                 */
                let resolveDelete:
                    (
                        value: boolean
                    ) => void =
                    () => { };

                mockExecute
                    .mockImplementation(
                        () =>
                            new Promise<boolean>(
                                (
                                    resolve
                                ) => {
                                    resolveDelete =
                                        resolve;
                                }
                            )
                    );

                const {
                    result,
                } = renderHook(
                    () =>
                        useDeleteProduct()
                );

                act(() => {
                    result.current
                        .openDeleteModal(
                            product
                        );
                });

                /**
                 * 削除処理を開始する
                 *
                 * この時点ではPromiseを
                 * 完了させない
                 */
                let deletePromise:
                    Promise<boolean>;

                act(() => {
                    deletePromise =
                        result.current
                            .confirmDelete();
                });

                expect(
                    result.current
                        .isDeleting
                ).toBe(
                    true
                );

                /**
                 * 削除中にモーダルを
                 * 閉じようとする
                 */
                act(() => {
                    result.current
                        .closeDeleteModal();
                });

                /**
                 * モーダルが閉じていないこと
                 */
                expect(
                    result.current
                        .deleteTarget
                ).toBe(
                    product
                );

                expect(
                    result.current
                        .isDeleteModalOpen
                ).toBe(
                    true
                );

                /**
                 * 削除処理を完了させる
                 */
                await act(
                    async () => {
                        resolveDelete(
                            true
                        );

                        await deletePromise;
                    }
                );

                expect(
                    result.current
                        .isDeleting
                ).toBe(
                    false
                );
            }
        );

        /**
         * confirmDelete
         *
         * 削除対象が設定されていない場合、
         * falseが返り、
         * Serviceが呼ばれないことを確認する
         */
        it(
            "削除対象がない場合confirmDeleteはfalseを返す",
            async () => {
                const {
                    result,
                } = renderHook(
                    () =>
                        useDeleteProduct()
                );

                let deleteResult:
                    boolean = true;

                await act(
                    async () => {
                        deleteResult =
                            await result.current
                                .confirmDelete();
                    }
                );

                expect(
                    deleteResult
                ).toBe(
                    false
                );

                expect(
                    mockExecute
                ).not
                    .toHaveBeenCalled();

                expect(
                    result.current
                        .isDeleting
                ).toBe(
                    false
                );
            }
        );

        /**
         * confirmDelete
         *
         * Serviceがtrueを返した場合、
         * 商品削除に成功することを確認する
         */
        it(
            "商品削除に成功した場合trueを返しモーダルを閉じてトーストを表示する",
            async () => {
                mockExecute
                    .mockResolvedValue(
                        true
                    );

                const {
                    result,
                } = renderHook(
                    () =>
                        useDeleteProduct()
                );

                act(() => {
                    result.current
                        .openDeleteModal(
                            product
                        );
                });

                let deleteResult:
                    boolean = false;

                await act(
                    async () => {
                        deleteResult =
                            await result.current
                                .confirmDelete();
                    }
                );

                /**
                 * Serviceに正しいUUIDが
                 * 渡されていること
                 */
                expect(
                    mockExecute
                ).toHaveBeenCalledWith(
                    product.productUuid
                );

                expect(
                    mockExecute
                ).toHaveBeenCalledTimes(
                    1
                );

                /**
                 * trueが返ること
                 */
                expect(
                    deleteResult
                ).toBe(
                    true
                );

                /**
                 * モーダルが閉じること
                 */
                expect(
                    result.current
                        .deleteTarget
                ).toBeNull();

                expect(
                    result.current
                        .isDeleteModalOpen
                ).toBe(
                    false
                );

                /**
                 * 削除完了トーストが
                 * 表示されること
                 */
                expect(
                    result.current
                        .isDeleteToastVisible
                ).toBe(
                    true
                );

                /**
                 * 削除処理中状態が
                 * 解除されること
                 */
                expect(
                    result.current
                        .isDeleting
                ).toBe(
                    false
                );

                expect(
                    result.current
                        .deleteError
                ).toBeNull();
            }
        );

        /**
         * confirmDelete
         *
         * Serviceがfalseを返した場合、
         * 削除失敗エラーが設定されることを確認する
         */
        it(
            "Serviceがfalseを返した場合エラーを設定してfalseを返す",
            async () => {
                mockExecute
                    .mockResolvedValue(
                        false
                    );

                const {
                    result,
                } = renderHook(
                    () =>
                        useDeleteProduct()
                );

                act(() => {
                    result.current
                        .openDeleteModal(
                            product
                        );
                });

                let deleteResult:
                    boolean = true;

                await act(
                    async () => {
                        deleteResult =
                            await result.current
                                .confirmDelete();
                    }
                );

                expect(
                    deleteResult
                ).toBe(
                    false
                );

                expect(
                    result.current
                        .deleteError
                ).toBe(
                    "商品を削除できませんでした。"
                );

                /**
                 * 削除失敗時は
                 * モーダルが開いたままであること
                 */
                expect(
                    result.current
                        .deleteTarget
                ).toBe(
                    product
                );

                expect(
                    result.current
                        .isDeleteModalOpen
                ).toBe(
                    true
                );

                expect(
                    result.current
                        .isDeleteToastVisible
                ).toBe(
                    false
                );

                expect(
                    result.current
                        .isDeleting
                ).toBe(
                    false
                );
            }
        );

        /**
         * confirmDelete
         *
         * ServiceがErrorをthrowした場合、
         * Errorのmessageが設定されることを確認する
         */
        it(
            "Serviceが例外を投げた場合エラーメッセージを設定する",
            async () => {
                mockExecute
                    .mockRejectedValue(
                        new Error(
                            "商品削除エラー"
                        )
                    );

                const {
                    result,
                } = renderHook(
                    () =>
                        useDeleteProduct()
                );

                act(() => {
                    result.current
                        .openDeleteModal(
                            product
                        );
                });

                let deleteResult:
                    boolean = true;

                await act(
                    async () => {
                        deleteResult =
                            await result.current
                                .confirmDelete();
                    }
                );

                expect(
                    deleteResult
                ).toBe(
                    false
                );

                expect(
                    result.current
                        .deleteError
                ).toBe(
                    "商品削除エラー"
                );

                expect(
                    result.current
                        .isDeleteModalOpen
                ).toBe(
                    true
                );

                expect(
                    result.current
                        .isDeleting
                ).toBe(
                    false
                );
            }
        );

        /**
         * closeDeleteToast
         *
         * 削除完了トーストを
         * 閉じられることを確認する
         */
        it(
            "closeDeleteToastで削除完了トーストを閉じられる",
            async () => {
                mockExecute
                    .mockResolvedValue(
                        true
                    );

                const {
                    result,
                } = renderHook(
                    () =>
                        useDeleteProduct()
                );

                act(() => {
                    result.current
                        .openDeleteModal(
                            product
                        );
                });

                await act(
                    async () => {
                        await result.current
                            .confirmDelete();
                    }
                );

                /**
                 * 削除成功後は
                 * トーストが表示されていること
                 */
                expect(
                    result.current
                        .isDeleteToastVisible
                ).toBe(
                    true
                );

                /**
                 * トーストを閉じる
                 */
                act(() => {
                    result.current
                        .closeDeleteToast();
                });

                expect(
                    result.current
                        .isDeleteToastVisible
                ).toBe(
                    false
                );
            }
        );

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
                        useDeleteProduct()
                );

                act(() => {
                    result.current
                        .openDeleteModal(
                            product
                        );
                });

                let deleteResult:
                    boolean = true;

                await act(
                    async () => {
                        deleteResult =
                            await result.current
                                .confirmDelete();
                    }
                );

                expect(
                    deleteResult
                ).toBe(
                    false
                );

                expect(
                    result.current
                        .deleteError
                ).toBe(
                    "商品の削除に失敗しました。"
                );

                expect(
                    result.current
                        .isDeleteModalOpen
                ).toBe(
                    true
                );

                expect(
                    result.current
                        .isDeleting
                ).toBe(
                    false
                );
            }
        );
    }
);