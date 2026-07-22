// @vitest-environment jsdom

import { UpdateProductModal } from
    "@/components/product/edit/UpdateProductModal";
import type { UseUpdateProductOptions } from
    "@/components/hooks/useUpdateProduct";
import type { Product } from "@/models/Product";
import type { ProductUpdateResult } from
    "@/models/ProductUpdate";
import {
    cleanup,
    fireEvent,
    render,
    screen,
} from "@testing-library/react";
import type { ReactNode } from "react";
import {
    afterEach,
    describe,
    expect,
    it,
    vi,
} from "vitest";

const updateResult: ProductUpdateResult = {
    productUuid:
        "10000000-0000-0000-0000-000000000001",
    name: "水性ボールペン黒",
    price: 120,
    stockQuantity: 80,
    categoryUuid:
        "e50d978b-b73d-4afb-8e85-ace9cf1e12a7",
    imageUrl: null,
    updated: true,
};

vi.mock(
    "@/components/product/edit/UpdateProductContext",
    () => ({
        UpdateProductProvider: ({
            children,
        }: {
            children: ReactNode;
        }) => children,
    })
);

vi.mock(
    "@/components/product/edit/UpdateProduct",
    () => ({
        UpdateProduct: ({
            options,
        }: {
            options?: UseUpdateProductOptions;
        }) => (
            <div>
                <p>商品修正入力フォーム</p>
                <button
                    type="button"
                    onClick={
                        options?.onProceedToConfirm
                    }
                >
                    確認へ
                </button>
                <button
                    type="button"
                    onClick={options?.onCancel}
                >
                    入力をキャンセル
                </button>
            </div>
        ),
    })
);

vi.mock(
    "@/components/product/edit/UpdateProductConfirm",
    () => ({
        UpdateProductConfirm: ({
            options,
        }: {
            options?: UseUpdateProductOptions;
        }) => (
            <div>
                <p>商品修正確認内容</p>
                <button
                    type="button"
                    onClick={options?.onBackToInput}
                >
                    入力へ戻る
                </button>
                <button
                    type="button"
                    onClick={options?.onCancel}
                >
                    確認をキャンセル
                </button>
                <button
                    type="button"
                    onClick={() => {
                        void options?.onUpdateSuccess?.(
                            updateResult
                        );
                    }}
                >
                    更新を確定
                </button>
                <button
                    type="button"
                    onClick={() => {
                        options?.onUpdatePendingChange?.(
                            true
                        );
                    }}
                >
                    更新開始
                </button>
                <button
                    type="button"
                    onClick={() => {
                        options?.onUpdatePendingChange?.(
                            false
                        );
                    }}
                >
                    更新終了
                </button>
            </div>
        ),
    })
);

const product: Product = {
    productUuid: updateResult.productUuid,
    name: updateResult.name,
    price: updateResult.price,
    imageUrl: null,
    productCategory: {
        categoryUuid:
            updateResult.categoryUuid,
        name: "文房具",
    },
    productStock: {
        stockUuid:
            "20000000-0000-0000-0000-000000000001",
        quantity:
            updateResult.stockQuantity,
    },
    deleteFlg: 0,
};

describe("UpdateProductModal", () => {
    afterEach(() => {
        cleanup();
        vi.clearAllMocks();
    });

    it("入力と確認をモーダル内で行き来できる", () => {
        render(
            <UpdateProductModal
                product={product}
                onClose={vi.fn()}
                onUpdated={vi.fn()}
            />
        );

        expect(
            screen.getByRole("dialog")
        ).toBeTruthy();
        expect(
            screen.getByText(
                "商品修正入力フォーム"
            )
        ).toBeTruthy();

        fireEvent.click(
            screen.getByRole("button", {
                name: "確認へ",
            })
        );

        expect(
            screen.getByText(
                "商品修正確認内容"
            )
        ).toBeTruthy();

        fireEvent.click(
            screen.getByRole("button", {
                name: "入力へ戻る",
            })
        );

        expect(
            screen.getByText(
                "商品修正入力フォーム"
            )
        ).toBeTruthy();
    });

    it("キャンセル操作を親へ通知する", () => {
        const onClose = vi.fn();

        render(
            <UpdateProductModal
                product={product}
                onClose={onClose}
                onUpdated={vi.fn()}
            />
        );

        fireEvent.click(
            screen.getByRole("button", {
                name: "入力をキャンセル",
            })
        );

        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("更新処理中でなければEscapeキーで閉じられる", () => {
        const onClose = vi.fn();

        render(
            <UpdateProductModal
                product={product}
                onClose={onClose}
                onUpdated={vi.fn()}
            />
        );

        fireEvent.keyDown(document, {
            key: "Escape",
        });

        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("商品更新APIの実行中はEscapeキーで閉じない", () => {
        const onClose = vi.fn();

        render(
            <UpdateProductModal
                product={product}
                onClose={onClose}
                onUpdated={vi.fn()}
            />
        );

        fireEvent.click(
            screen.getByRole("button", {
                name: "確認へ",
            })
        );
        fireEvent.click(
            screen.getByRole("button", {
                name: "更新開始",
            })
        );
        fireEvent.keyDown(document, {
            key: "Escape",
        });

        expect(onClose).not.toHaveBeenCalled();

        fireEvent.click(
            screen.getByRole("button", {
                name: "更新終了",
            })
        );
        fireEvent.keyDown(document, {
            key: "Escape",
        });

        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("更新成功を親へ通知する", () => {
        const onUpdated = vi.fn();

        render(
            <UpdateProductModal
                product={product}
                onClose={vi.fn()}
                onUpdated={onUpdated}
            />
        );

        fireEvent.click(
            screen.getByRole("button", {
                name: "確認へ",
            })
        );
        fireEvent.click(
            screen.getByRole("button", {
                name: "更新を確定",
            })
        );

        expect(onUpdated).toHaveBeenCalledWith(
            updateResult
        );
    });
});
