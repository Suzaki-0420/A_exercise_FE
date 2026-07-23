// @vitest-environment jsdom

import { UpdateProduct } from "@/components/product/edit/UpdateProduct";
import { UpdateProductComplete } from "@/components/product/edit/UpdateProductComplete";
import { UpdateProductConfirm } from "@/components/product/edit/UpdateProductConfirm";
import {
  UpdateProductProvider,
  useUpdateProductContext,
} from "@/components/product/edit/UpdateProductContext";
import type { Product } from "@/models/Product";
import type { ProductCategory } from "@/models/ProductCategory";
import type { ProductUpdateResult } from "@/models/ProductUpdate";
import {
  act,
  cleanup,
  fireEvent,
  render,
  renderHook,
  screen,
} from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { hookState, mockUseUpdateProduct } = vi.hoisted(() => ({
  hookState: {
    formData: null as Product | null,
    categories: [] as ProductCategory[],
    imageFile: null as File | null,
    imagePreviewUrl: null as string | null,
    fieldErrors: {} as Record<string, string | undefined>,
    submitError: null as string | null,
    isLoading: false,
    draft: null as Product | null,
    completedResult: null as ProductUpdateResult | null,
    handleChange: vi.fn(),
    handleImageChange: vi.fn(),
    handleNameBlur: vi.fn(),
    handlePriceBlur: vi.fn(),
    handleStockBlur: vi.fn(),
    handleCategoryBlur: vi.fn(),
    handleImageBlur: vi.fn(),
    handleProceedToConfirm: vi.fn(),
    handleUpdate: vi.fn(),
    handleBackToInput: vi.fn(),
    handleCancel: vi.fn(),
    handleInvalidFlow: vi.fn(),
    handleLeaveComplete: vi.fn(),
  },
  mockUseUpdateProduct: vi.fn(),
}));

vi.mock("@/components/hooks/useUpdateProduct", () => ({
  useUpdateProduct: mockUseUpdateProduct,
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

const completedResult: ProductUpdateResult = {
  productUuid: product.productUuid,
  name: product.name,
  price: product.price,
  stockQuantity: product.productStock!.quantity,
  categoryUuid: category.categoryUuid,
  imageUrl: null,
  updated: true,
};

describe("商品修正コンポーネント", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.assign(hookState, {
      formData: null,
      categories: [],
      imageFile: null,
      imagePreviewUrl: null,
      fieldErrors: {},
      submitError: null,
      isLoading: false,
      draft: null,
      completedResult: null,
    });
    mockUseUpdateProduct.mockReturnValue(hookState);
  });

  afterEach(() => {
    cleanup();
  });

  it("入力画面の読み込み中表示を行う", () => {
    hookState.isLoading = true;

    render(<UpdateProduct productUuid={product.productUuid} />);

    expect(screen.getByRole("status").textContent).toContain(
      "商品情報を読み込んでいます...",
    );
    expect(mockUseUpdateProduct).toHaveBeenCalledWith(
      product.productUuid,
      undefined,
    );
  });

  it.each([
    ["取得エラーあり", "商品取得エラー", "商品取得エラー"],
    ["取得エラーなし", null, "商品情報の取得に失敗しました。"],
  ])(
    "入力商品がない場合は%sのメッセージを表示する",
    (_name, submitError, expectedMessage) => {
      hookState.submitError = submitError;

      render(<UpdateProduct productUuid={product.productUuid} />);

      expect(screen.getByText(expectedMessage)).toBeTruthy();
    },
  );

  it("モーダルの初期化エラーから閉じる操作を行える", () => {
    hookState.submitError =
      "商品修正画面の表示に必要な情報を取得できませんでした。";

    render(<UpdateProduct productUuid={product.productUuid} variant="modal" />);

    fireEvent.click(
      screen.getByRole("button", {
        name: "閉じる",
      }),
    );

    expect(hookState.handleCancel).toHaveBeenCalledTimes(1);
  });

  it("入力画面の全項目を表示して操作をHookへ渡す", () => {
    Object.assign(hookState, {
      formData: product,
      categories: [category],
    });

    render(<UpdateProduct productUuid={product.productUuid} />);

    const nameInput = screen.getByLabelText("商品名");
    const priceInput = screen.getByLabelText("単価");
    const stockInput = screen.getByLabelText("在庫数");
    const categorySelect = screen.getByLabelText("商品カテゴリ");
    const imageInput = screen.getByLabelText("商品画像");

    fireEvent.change(nameInput, {
      target: { name: "name", value: "油性ペン" },
    });
    fireEvent.blur(nameInput);
    fireEvent.change(priceInput, {
      target: { name: "price", value: "200" },
    });
    fireEvent.blur(priceInput);
    fireEvent.change(stockInput, {
      target: {
        name: "stockQuantity",
        value: "20",
      },
    });
    fireEvent.blur(stockInput);
    fireEvent.change(categorySelect, {
      target: {
        name: "categoryUuid",
        value: category.categoryUuid,
      },
    });
    fireEvent.blur(categorySelect);
    fireEvent.change(imageInput, {
      target: { files: [] },
    });
    fireEvent.blur(imageInput);
    fireEvent.click(
      screen.getByRole("button", {
        name: "キャンセル",
      }),
    );
    fireEvent.submit(
      screen
        .getByRole("button", {
          name: "完了",
        })
        .closest("form")!,
    );

    expect(hookState.handleChange).toHaveBeenCalledTimes(4);
    expect(hookState.handleNameBlur).toHaveBeenCalled();
    expect(hookState.handlePriceBlur).toHaveBeenCalled();
    expect(hookState.handleStockBlur).toHaveBeenCalled();
    expect(hookState.handleCategoryBlur).toHaveBeenCalled();
    expect(hookState.handleImageChange).toHaveBeenCalled();
    expect(hookState.handleImageBlur).toHaveBeenCalled();
    expect(hookState.handleCancel).toHaveBeenCalled();
    expect(hookState.handleProceedToConfirm).toHaveBeenCalled();
    expect(screen.getByText("商品画像なし")).toBeTruthy();
  });

  it("入力値・画像・項目エラーと送信エラーを表示する", () => {
    const imageFile = new File(["image"], "change.png", {
      type: "image/png",
    });
    Object.assign(hookState, {
      formData: {
        ...product,
        price: Number.NaN,
        productCategory: null,
        productStock: null,
      },
      categories: [category],
      imageFile,
      imagePreviewUrl: "blob:preview",
      fieldErrors: {
        name: "商品名エラー",
        price: "価格エラー",
        stockQuantity: "在庫数エラー",
        categoryUuid: "カテゴリエラー",
        image: "画像エラー",
      },
      submitError: "送信エラー",
    });

    render(<UpdateProduct productUuid={product.productUuid} />);

    expect(screen.getByText("送信エラー")).toBeTruthy();
    expect(screen.getByText("商品名エラー")).toBeTruthy();
    expect(screen.getByText("価格エラー")).toBeTruthy();
    expect(screen.getByText("在庫数エラー")).toBeTruthy();
    expect(screen.getByText("カテゴリエラー")).toBeTruthy();
    expect(screen.getByText("画像エラー")).toBeTruthy();
    expect(screen.getByText("選択中：change.png")).toBeTruthy();
    expect(
      screen
        .getByAltText("水性ボールペン黒の変更後の商品画像")
        .getAttribute("src"),
    ).toBe("blob:preview");
    expect((screen.getByLabelText("単価") as HTMLInputElement).value).toBe("");
    expect((screen.getByLabelText("在庫数") as HTMLInputElement).value).toBe(
      "",
    );
  });

  it("変更後プレビューがない場合は現在の商品画像を表示する", () => {
    hookState.formData = {
      ...product,
      imageUrl: "https://example.com/current.png",
    };

    render(<UpdateProduct productUuid={product.productUuid} />);

    expect(
      screen
        .getByAltText("水性ボールペン黒の現在の商品画像")
        .getAttribute("src"),
    ).toBe("https://example.com/current.png");
  });

  it("確認情報がない場合は商品検索へ戻す", () => {
    render(<UpdateProductConfirm />);

    expect(hookState.handleInvalidFlow).toHaveBeenCalledWith("/admin/product");
    expect(screen.getByRole("status").textContent).toContain(
      "商品検索画面へ移動しています...",
    );
  });

  it("確認内容を表示して更新・戻る・キャンセル操作をHookへ渡す", async () => {
    hookState.draft = product;

    render(<UpdateProductConfirm />);

    expect(screen.getByText(product.name)).toBeTruthy();

    expect(screen.getByText("120円")).toBeTruthy();

    expect(screen.getByText("80個")).toBeTruthy();

    expect(screen.getByText(category.name)).toBeTruthy();

    expect(screen.getByText("商品画像なし")).toBeTruthy();

    expect(screen.getByText("画像は変更しません。")).toBeTruthy();

    await act(async () => {
      fireEvent.click(
        screen.getByRole("button", {
          name: "キャンセル",
        }),
      );

      await Promise.resolve();
    });

    expect(hookState.handleCancel).toHaveBeenCalledTimes(1);

    await act(async () => {
      fireEvent.click(
        screen.getByRole("button", {
          name: "戻る",
        }),
      );

      await Promise.resolve();
    });

    expect(hookState.handleBackToInput).toHaveBeenCalledTimes(1);

    await act(async () => {
      fireEvent.click(
        screen.getByRole("button", {
          name: "完了",
        }),
      );

      await Promise.resolve();
    });

    expect(hookState.handleUpdate).toHaveBeenCalledTimes(1);
  });

  it("確認画面に送信・項目エラー、変更画像、初期値を表示する", () => {
    const imageFile = new File(["image"], "change.png", {
      type: "image/png",
    });
    Object.assign(hookState, {
      draft: {
        ...product,
        productStock: null,
        productCategory: null,
      },
      imageFile,
      imagePreviewUrl: "blob:preview",
      submitError: "更新エラー",
      fieldErrors: {
        name: "商品名エラー",
        price: undefined,
      },
      isLoading: true,
    });

    render(<UpdateProductConfirm />);

    expect(screen.getByText("更新エラー")).toBeTruthy();
    expect(screen.getByText("商品名エラー")).toBeTruthy();
    expect(screen.getByText("0個")).toBeTruthy();
    expect(screen.getByText("－")).toBeTruthy();
    expect(screen.getByText("変更後：change.png")).toBeTruthy();
    expect(
      screen.getByAltText("水性ボールペン黒の変更後の商品画像"),
    ).toBeTruthy();
    expect(
      (
        screen.getByRole("button", {
          name: "変更中...",
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true);
  });

  it("確認画面で変更後プレビューがない場合は既存画像を表示する", () => {
    hookState.draft = {
      ...product,
      imageUrl: "https://example.com/current.png",
    };

    render(<UpdateProductConfirm />);

    expect(
      screen.getByAltText("水性ボールペン黒の商品画像").getAttribute("src"),
    ).toBe("https://example.com/current.png");
  });

  it("完了情報がない場合は管理メニューへ戻す", () => {
    render(<UpdateProductComplete />);

    expect(hookState.handleInvalidFlow).toHaveBeenCalledWith("/admin");
    expect(screen.getByRole("status").textContent).toContain(
      "メニュー画面へ移動しています...",
    );
  });

  it("完了情報を表示してメニュー・商品検索への遷移をHookへ渡す", () => {
    hookState.completedResult = completedResult;

    render(<UpdateProductComplete />);

    expect(screen.getByText(`対象商品：${product.name}`)).toBeTruthy();
    fireEvent.click(
      screen.getByRole("button", {
        name: "メニューへ",
      }),
    );
    fireEvent.click(
      screen.getByRole("button", {
        name: "商品検索へ戻る",
      }),
    );

    expect(hookState.handleLeaveComplete).toHaveBeenNthCalledWith(1, "/admin");
    expect(hookState.handleLeaveComplete).toHaveBeenNthCalledWith(
      2,
      "/admin/product",
    );
  });

  it("完了情報をモーダル用の内容だけで表示する", () => {
    hookState.completedResult = completedResult;

    const { container } = render(<UpdateProductComplete variant="modal" />);

    expect(
      screen.getByRole("heading", {
        name: "商品変更（完了）",
      }),
    ).toBeTruthy();
    expect(container.querySelector("main")).toBeNull();
  });
});

describe("UpdateProductContext", () => {
  afterEach(() => {
    cleanup();
  });

  const wrapper = ({ children }: { children: ReactNode }) => (
    <UpdateProductProvider>{children}</UpdateProductProvider>
  );

  it("入力内容・画像・完了結果を保存し、フローを初期化できる", () => {
    const imageFile = new File(["image"], "change.png", {
      type: "image/png",
    });
    const { result } = renderHook(() => useUpdateProductContext(), { wrapper });

    expect(result.current.draft).toBeNull();
    act(() => {
      result.current.saveDraft(product, imageFile);
    });
    expect(result.current.draft).toEqual(product);
    expect(result.current.imageFile).toBe(imageFile);
    expect(result.current.completedResult).toBeNull();

    act(() => {
      result.current.setCompletedResult(completedResult);
    });
    expect(result.current.completedResult).toEqual(completedResult);

    act(() => {
      result.current.clearFlow();
    });
    expect(result.current.draft).toBeNull();
    expect(result.current.imageFile).toBeNull();
    expect(result.current.completedResult).toBeNull();
  });

  it("Provider外でContextを利用した場合はエラーにする", () => {
    expect(() => renderHook(() => useUpdateProductContext())).toThrow(
      "useUpdateProductContextはUpdateProductProvider内で使用してください。",
    );
  });
});
