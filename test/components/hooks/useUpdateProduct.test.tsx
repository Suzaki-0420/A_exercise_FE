// @vitest-environment jsdom

import {
  clearProductForUpdate,
  saveProductForUpdate,
} from "@/components/product/edit/productUpdateStorage";
import { useUpdateProduct } from "@/components/hooks/useUpdateProduct";
import type { Product } from "@/models/Product";
import type { ProductCategory } from "@/models/ProductCategory";
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import type { ChangeEvent, FormEvent } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockContainerGet,
  mockGetCategories,
  mockValidateProductName,
  mockUpdateProduct,
  mockSaveDraft,
  mockSetCompletedResult,
  mockClearFlow,
  mockRouter,
} = vi.hoisted(() => ({
  mockContainerGet: vi.fn(),
  mockGetCategories: vi.fn(),
  mockValidateProductName: vi.fn(),
  mockUpdateProduct: vi.fn(),
  mockSaveDraft: vi.fn(),
  mockSetCompletedResult: vi.fn(),
  mockClearFlow: vi.fn(),
  mockRouter: {
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
  },
}));

vi.mock("@/di/container", () => ({
  container: {
    get: mockContainerGet,
  },
}));

vi.mock("@/components/product/edit/UpdateProductContext", () => ({
  useUpdateProductContext: () => ({
    draft: null,
    imageFile: null,
    completedResult: null,
    saveDraft: mockSaveDraft,
    setCompletedResult: mockSetCompletedResult,
    clearFlow: mockClearFlow,
  }),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => mockRouter,
}));

const category: ProductCategory = {
  categoryUuid: "e50d978b-b73d-4afb-8e85-ace9cf1e12a7",
  name: "文房具",
};

const product: Product = {
  productUuid: "10000000-0000-0000-0000-000000000001",
  name: "水性ボールペン黒",
  price: 120,
  imageUrl: null,
  productCategory: category,
  productStock: {
    stockUuid: "20000000-0000-0000-0000-000000000001",
    quantity: 80,
  },
  deleteFlg: 0,
};

const renderUpdateProductHook = async () => {
  const hook = renderHook(() => useUpdateProduct(product.productUuid));

  await waitFor(() => {
    expect(hook.result.current.isLoading).toBe(false);
    expect(hook.result.current.formData).not.toBeNull();
  });

  return hook;
};

type UpdateProductHookResult = {
  current: ReturnType<typeof useUpdateProduct>;
};

const changeName = (result: UpdateProductHookResult, value: string) => {
  act(() => {
    result.current.handleChange({
      target: {
        name: "name",
        value,
      },
    } as ChangeEvent<HTMLInputElement>);
  });
};

describe("useUpdateProductの商品名重複確認", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    saveProductForUpdate(product);
    mockContainerGet.mockReturnValue({
      getCategories: mockGetCategories,
      validateProductName: mockValidateProductName,
      updateProduct: mockUpdateProduct,
    });
    mockGetCategories.mockResolvedValue([category]);
    mockValidateProductName.mockResolvedValue(undefined);
  });

  afterEach(() => {
    cleanup();
    clearProductForUpdate();
  });

  it("元の商品名から変更していない場合は重複確認APIを呼ばない", async () => {
    const { result } = await renderUpdateProductHook();

    await act(async () => {
      await result.current.handleNameBlur();
    });

    expect(mockValidateProductName).not.toHaveBeenCalled();
    expect(result.current.fieldErrors.name).toBeUndefined();
  });

  it("変更した商品名が重複している場合は項目エラーを表示する", async () => {
    mockValidateProductName.mockRejectedValue(
      new Error("同じ商品名の商品が既に存在します。"),
    );
    const { result } = await renderUpdateProductHook();
    changeName(result, "油性ボールペン黒");

    await act(async () => {
      await result.current.handleNameBlur();
    });

    expect(mockValidateProductName).toHaveBeenCalledWith("油性ボールペン黒");
    expect(result.current.fieldErrors.name).toBe(
      "同じ商品名の商品が既に存在します。",
    );
  });

  it("重複した商品名では確認画面へ遷移しない", async () => {
    mockValidateProductName.mockRejectedValue(
      new Error("同じ商品名の商品が既に存在します。"),
    );
    const { result } = await renderUpdateProductHook();
    changeName(result, "油性ボールペン黒");

    await act(async () => {
      await result.current.handleProceedToConfirm({
        preventDefault: vi.fn(),
      } as unknown as FormEvent<HTMLFormElement>);
    });

    expect(mockSaveDraft).not.toHaveBeenCalled();
    expect(mockRouter.push).not.toHaveBeenCalled();
    expect(result.current.fieldErrors.name).toBe(
      "同じ商品名の商品が既に存在します。",
    );
  });

  it("重複していない商品名は前後の空白を除いて確認画面へ引き継ぐ", async () => {
    const { result } = await renderUpdateProductHook();
    changeName(result, "  油性ボールペン黒  ");

    await act(async () => {
      await result.current.handleProceedToConfirm({
        preventDefault: vi.fn(),
      } as unknown as FormEvent<HTMLFormElement>);
    });

    expect(mockValidateProductName).toHaveBeenCalledWith("油性ボールペン黒");
    expect(mockSaveDraft).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "油性ボールペン黒",
      }),
      null,
    );
    expect(mockRouter.push).toHaveBeenCalledWith("/admin/product/edit/confirm");
  });
});
