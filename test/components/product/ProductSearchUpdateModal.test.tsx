// @vitest-environment jsdom

import { ProductSearch } from "@/components/product/ProductSearch";
import type { Product } from "@/models/Product";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockSearchByCategory,
  mockSearchByKeyword,
  mockRouterPush,
  mockSaveProductForUpdate,
} = vi.hoisted(() => ({
  mockSearchByCategory: vi.fn(),
  mockSearchByKeyword: vi.fn(),
  mockRouterPush: vi.fn(),
  mockSaveProductForUpdate: vi.fn(),
}));

const product: Product = {
  productUuid: "10000000-0000-0000-0000-000000000001",
  name: "水性ボールペン黒",
  price: 120,
  imageUrl: null,
  productCategory: {
    categoryUuid: "e50d978b-b73d-4afb-8e85-ace9cf1e12a7",
    name: "文房具",
  },
  productStock: {
    stockUuid: "20000000-0000-0000-0000-000000000001",
    quantity: 80,
  },
  deleteFlg: 0,
};

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockRouterPush,
  }),
}));

vi.mock("@/components/product/edit/productUpdateStorage", () => ({
  saveProductForUpdate: mockSaveProductForUpdate,
}));

vi.mock("@/components/hooks/useSearchProductByCategory", () => ({
  useSearchProductByCategory: () => ({
    products: [product],
    isLoading: false,
    error: null,
    search: mockSearchByCategory,
  }),
}));

vi.mock("@/components/hooks/useSearchProductByKeyword", () => ({
  useSearchProductByKeyword: () => ({
    products: [product],
    isLoading: false,
    error: null,
    search: mockSearchByKeyword,
  }),
}));

vi.mock("@/components/hooks/useProductCategories", () => ({
  useProductCategories: () => ({
    categories: [product.productCategory],
    isLoading: false,
  }),
}));

vi.mock("@/components/hooks/useDeleteProduct", () => ({
  useDeleteProduct: () => ({
    deleteTarget: null,
    isDeleteModalOpen: false,
    isDeleting: false,
    deleteError: null,
    openDeleteModal: vi.fn(),
    closeDeleteModal: vi.fn(),
    confirmDelete: vi.fn(),
  }),
}));

vi.mock("@/components/product/CategorySearchForm", () => ({
  CategorySearchForm: () => <div>カテゴリ検索フォーム</div>,
}));

vi.mock("@/components/product/KeywordSearchForm", () => ({
  KeywordSearchForm: () => <div>キーワード検索フォーム</div>,
}));

vi.mock("@/components/product/ProductCardList", () => ({
  ProductCardList: ({
    products,
    onUpdate,
  }: {
    products: Product[];
    onUpdate: (selectedProduct: Product) => void;
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
}));

describe("ProductSearchの商品修正遷移", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchByCategory.mockResolvedValue(undefined);
    mockSearchByKeyword.mockResolvedValue(undefined);
  });

  afterEach(() => {
    cleanup();
  });

  it("検索結果の内容にかかわらず商品検索領域を最大幅で表示する", () => {
    render(<ProductSearch />);

    const searchContainer = screen.getByRole("heading", {
      name: "商品検索",
    }).parentElement?.parentElement;

    expect(searchContainer?.classList.contains("w-full")).toBe(true);
  });

  it("更新ボタンで商品を保存して入力画面へ遷移する", () => {
    render(<ProductSearch />);

    fireEvent.click(
      screen.getByRole("button", {
        name: "商品を更新",
      }),
    );

    expect(mockSaveProductForUpdate).toHaveBeenCalledWith(product);
    expect(mockRouterPush).toHaveBeenCalledWith(
      `/admin/product/edit/${product.productUuid}`,
    );
  });
});
