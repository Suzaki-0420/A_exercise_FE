// @vitest-environment jsdom

import { ProductSearch } from
    "@/components/product/ProductSearch";
import type { Product } from "@/models/Product";
import type { ProductUpdateResult } from
    "@/models/ProductUpdate";
import {
    cleanup,
    fireEvent,
    render,
    screen,
    waitFor,
} from "@testing-library/react";
import {
    afterEach,
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from "vitest";

const {
    mockSearchByCategory,
    mockSearchByKeyword,
    mockRouterPush,
} = vi.hoisted(() => ({
    mockSearchByCategory: vi.fn(),
    mockSearchByKeyword: vi.fn(),
    mockRouterPush: vi.fn(),
}));

const product: Product = {
    productUuid:
        "10000000-0000-0000-0000-000000000001",
    name: "水性ボールペン黒",
    price: 120,
    imageUrl: null,
    productCategory: {
        categoryUuid:
            "e50d978b-b73d-4afb-8e85-ace9cf1e12a7",
        name: "文房具",
    },
    productStock: {
        stockUuid:
            "20000000-0000-0000-0000-000000000001",
        quantity: 80,
    },
    deleteFlg: 0,
};

const updateResult: ProductUpdateResult = {
    productUuid: product.productUuid,
    name: product.name,
    price: product.price,
    stockQuantity:
        product.productStock!.quantity,
    categoryUuid:
        product.productCategory!.categoryUuid,
    imageUrl: null,
    updated: true,
};

vi.mock("next/navigation", () => ({
    useRouter: () => ({
        push: mockRouterPush,
    }),
}));

vi.mock(
    "@/components/hooks/useSearchProductByCategory",
    () => ({
        useSearchProductByCategory: () => ({
            products: [product],
            isLoading: false,
            error: null,
            search: mockSearchByCategory,
        }),
    })
);

vi.mock(
    "@/components/hooks/useSearchProductByKeyword",
    () => ({
        useSearchProductByKeyword: () => ({
            products: [product],
            isLoading: false,
            error: null,
            search: mockSearchByKeyword,
        }),
    })
);

vi.mock(
    "@/components/hooks/useProductCategories",
    () => ({
        useProductCategories: () => ({
            categories: [
                product.productCategory,
            ],
            isLoading: false,
        }),
    })
);

vi.mock(
    "@/components/hooks/useDeleteProduct",
    () => ({
        useDeleteProduct: () => ({
            deleteTarget: null,
            isDeleteModalOpen: false,
            isDeleting: false,
            deleteError: null,
            openDeleteModal: vi.fn(),
            closeDeleteModal: vi.fn(),
            confirmDelete: vi.fn(),
        }),
    })
);

vi.mock(
    "@/components/product/CategorySearchForm",
    () => ({
        CategorySearchForm: () => (
            <div>カテゴリ検索フォーム</div>
        ),
    })
);

vi.mock(
    "@/components/product/KeywordSearchForm",
    () => ({
        KeywordSearchForm: () => (
            <div>キーワード検索フォーム</div>
        ),
    })
);

vi.mock(
    "@/components/product/ProductCardList",
    () => ({
        ProductCardList: ({
            products,
            onUpdate,
        }: {
            products: Product[];
            onUpdate: (
                selectedProduct: Product
            ) => void;
        }) => (
            <button
                type="button"
                onClick={() => {
                    onUpdate(products[0]);
                }}
            >
                商品を更新
            </button>
        ),
    })
);

vi.mock(
    "@/components/product/edit/UpdateProductModal",
    () => ({
        UpdateProductModal: ({
            onClose,
            onUpdated,
        }: {
            onClose: () => void;
            onUpdated: (
                result: ProductUpdateResult
            ) => void | Promise<void>;
        }) => (
            <div role="dialog">
                <button
                    type="button"
                    onClick={onClose}
                >
                    モーダルを閉じる
                </button>
                <button
                    type="button"
                    onClick={() => {
                        void onUpdated(
                            updateResult
                        );
                    }}
                >
                    更新成功
                </button>
            </div>
        ),
    })
);

describe("ProductSearchの商品更新モーダル", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockSearchByCategory.mockResolvedValue(
            undefined
        );
        mockSearchByKeyword.mockResolvedValue(
            undefined
        );
    });

    afterEach(() => {
        cleanup();
    });

    it("検索結果の内容にかかわらず商品検索領域を最大幅で表示する", () => {
        render(<ProductSearch />);

        const searchContainer = screen
            .getByRole("heading", {
                name: "商品検索",
                exact: true,
            })
            .parentElement?.parentElement;

        expect(
            searchContainer?.classList.contains("w-full")
        ).toBe(true);
    });

    it("更新ボタンでモーダルを開きキャンセルで閉じる", () => {
        render(<ProductSearch />);

        fireEvent.click(
            screen.getByRole("button", {
                name: "商品を更新",
            })
        );

        expect(
            screen.getByRole("dialog")
        ).toBeTruthy();
        expect(mockRouterPush).not.toHaveBeenCalledWith(
            `/admin/product/edit/${product.productUuid}`
        );

        fireEvent.click(
            screen.getByRole("button", {
                name: "モーダルを閉じる",
            })
        );

        expect(
            screen.queryByRole("dialog")
        ).toBeNull();
    });

    it("更新成功後に一覧を再取得して完了通知を表示する", async () => {
        render(<ProductSearch />);

        fireEvent.click(
            screen.getByRole("button", {
                name: "商品を更新",
            })
        );
        fireEvent.click(
            screen.getByRole("button", {
                name: "更新成功",
            })
        );

        await waitFor(() => {
            expect(
                mockSearchByCategory
            ).toHaveBeenCalledTimes(2);
        });

        expect(
            mockSearchByCategory
        ).toHaveBeenLastCalledWith(
            "",
            false
        );
        expect(
            screen.getByRole("status")
                .textContent
        ).toContain(
            "水性ボールペン黒の商品情報を修正しました。"
        );
        expect(
            screen.queryByRole("dialog")
        ).toBeNull();
    });
});
