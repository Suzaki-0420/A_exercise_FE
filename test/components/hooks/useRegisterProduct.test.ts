// @vitest-environment jsdom

import { act, cleanup, renderHook } from "@testing-library/react";

import type { ChangeEvent } from "react";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { Product } from "@/models/Product";
import type { ProductCategory } from "@/models/ProductCategory";

/**
 * ServiceとカテゴリHookのモック
 */
const {
  mockRegisterProduct,
  mockValidateProductName,
  mockUseProductCategories,
} = vi.hoisted(() => ({
  mockRegisterProduct: vi.fn(),
  mockValidateProductName: vi.fn(),
  mockUseProductCategories: vi.fn(),
}));

vi.mock("@/di/container", () => ({
  container: {
    get: vi.fn(() => ({
      registerProduct: mockRegisterProduct,
      validateProductName: mockValidateProductName,
    })),
  },
}));

vi.mock("@/components/hooks/useProductCategories", () => ({
  useProductCategories: mockUseProductCategories,
}));

import { useRegisterProduct } from "@/components/hooks/useRegisterProduct";

/**
 * テスト用カテゴリ
 */
const category: ProductCategory = {
  categoryUuid: "category-uuid-001",
  name: "文房具",
} as ProductCategory;

/**
 * 登録成功時にServiceから返す商品
 */
const registeredProduct: Product = {
  productUuid: "registered-product-uuid",
  name: "ノート",
  price: 300,
  imageUrl: "https://example.com/note.png",
  productCategory: category,
  productStock: {
    stockUuid: "stock-uuid-001",
    quantity: 10,
  },
  deleteFlg: 0,
} as Product;

/**
 * input変更イベントを作る
 */
const createInputEvent = (
  name: string,
  value: string,
): ChangeEvent<HTMLInputElement> =>
  ({
    target: {
      name,
      value,
    },
  }) as ChangeEvent<HTMLInputElement>;

/**
 * file input変更イベントを作る
 */
const createFileEvent = (file: File | null): ChangeEvent<HTMLInputElement> =>
  ({
    target: {
      files: file ? [file] : [],
    },
  }) as unknown as ChangeEvent<HTMLInputElement>;

/**
 * テスト用画像を作る
 */
const createImageFile = (
  type = "image/png",
  size = 1024,
  name = "product.png",
): File => {
  const content = new Uint8Array(size);

  return new File([content], name, {
    type,
  });
};

/**
 * 全項目を正常値にする
 */
const fillValidForm = async (
  result: {
    current: ReturnType<typeof useRegisterProduct>;
  },
  file = createImageFile(),
) => {
  /*
   * 同期的な入力変更
   */
  act(() => {
    result.current.handleChange(createInputEvent("name", "ノート"));

    result.current.handleChange(createInputEvent("price", "300"));

    result.current.handleStockChange(createInputEvent("quantity", "10"));

    result.current.handleCategoryChange(category.categoryUuid);
  });

  /*
   * handleImageChangeは非同期処理なので、
   * 完了するまで待つ。
   */
  await act(async () => {
    await result.current.handleImageChange(createFileEvent(file));
  });

  return file;
};

/**
 * jsdomでは画像を実際に読み込まないため、
 * src設定時にonloadを発火させる。
 */
class MockImage {
  public width = 800;

  public height = 600;

  public onload: (() => void) | null = null;

  public onerror: (() => void) | null = null;

  public set src(_value: string) {
    this.onload?.();
  }
}

/**
 * 縦横サイズ上限を超える画像
 */
class OversizedMockImage {
  public width = 1001;

  public height = 1000;

  public onload: (() => void) | null = null;

  public onerror: (() => void) | null = null;

  public set src(_value: string) {
    this.onload?.();
  }
}

/**
 * 読み込みに失敗する画像
 */
class ErrorMockImage {
  public width = 0;

  public height = 0;

  public onload: (() => void) | null = null;

  public onerror: (() => void) | null = null;

  public set src(_value: string) {
    this.onerror?.();
  }
}

describe("useRegisterProduct", () => {
  const createObjectURLMock = vi.fn(() => "blob:product-preview");

  const revokeObjectURLMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    createObjectURLMock.mockReset();

    createObjectURLMock.mockReturnValue("blob:product-preview");

    revokeObjectURLMock.mockReset();

    vi.stubGlobal("Image", MockImage);

    mockUseProductCategories.mockReturnValue({
      categories: [category],
      isLoading: false,
      error: null,
    });

    mockValidateProductName.mockResolvedValue(undefined);

    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      value: createObjectURLMock,
    });

    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      value: revokeObjectURLMock,
    });
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  describe("初期状態", () => {
    it("フォームとUIの初期状態が正しい", () => {
      const { result } = renderHook(() => useRegisterProduct());

      expect(result.current.formData.name).toBe("");

      expect(Number.isNaN(result.current.formData.price)).toBe(true);

      expect(Number.isNaN(result.current.formData.productStock?.quantity)).toBe(
        true,
      );

      expect(result.current.formData.productCategory).toBeNull();

      expect(result.current.imageFile).toBeNull();

      expect(result.current.imagePreviewUrl).toBeNull();

      expect(result.current.errors).toEqual({});

      expect(result.current.isLoading).toBe(false);

      expect(result.current.isConfirmOpen).toBe(false);

      expect(result.current.isToastVisible).toBe(false);

      expect(result.current.hasValidationErrors).toBe(false);
    });

    it("カテゴリHookの値をそのまま返す", () => {
      mockUseProductCategories.mockReturnValue({
        categories: [category],
        isLoading: true,
        error: "カテゴリ取得エラー",
      });

      const { result } = renderHook(() => useRegisterProduct());

      expect(result.current.categories).toEqual([category]);

      expect(result.current.isCategoriesLoading).toBe(true);

      expect(result.current.categoriesError).toBe("カテゴリ取得エラー");

      expect(result.current.errors.system).toBe("カテゴリ取得エラー");
    });
  });

  describe("商品名", () => {
    it.each([
      ["", "商品名を入力してください。"],
      ["   ", "商品名を入力してください。"],
      ["あ", "商品名は2〜20文字で入力してください。"],
      ["あ".repeat(21), "商品名は2〜20文字で入力してください。"],
      ["商品@", "商品名は日本語または全角・半角英数字で入力してください。"],
    ])("不正な商品名「%s」でエラーになる", async (name, message) => {
      const { result } = renderHook(() => useRegisterProduct());

      act(() => {
        result.current.handleChange(createInputEvent("name", name));
      });

      await act(async () => {
        await result.current.handleNameBlur();
      });

      expect(result.current.errors.name).toBe(message);

      expect(mockValidateProductName).not.toHaveBeenCalled();
    });

    it("正常な商品名はtrimして重複確認する", async () => {
      const { result } = renderHook(() => useRegisterProduct());

      act(() => {
        result.current.handleChange(createInputEvent("name", "  ノート  "));
      });

      await act(async () => {
        await result.current.handleNameBlur();
      });

      expect(mockValidateProductName).toHaveBeenCalledWith("ノート");

      expect(result.current.errors.name).toBeUndefined();
    });

    it("重複確認でErrorが投げられた場合messageを表示する", async () => {
      mockValidateProductName.mockRejectedValueOnce(
        new Error("同名の商品が存在します。"),
      );

      const { result } = renderHook(() => useRegisterProduct());

      act(() => {
        result.current.handleChange(createInputEvent("name", "ノート"));
      });

      await act(async () => {
        await result.current.handleNameBlur();
      });

      expect(result.current.errors.name).toBe("同名の商品が存在します。");
    });

    it("重複確認でError以外が投げられた場合既定メッセージを表示する", async () => {
      mockValidateProductName.mockRejectedValueOnce("unexpected");

      const { result } = renderHook(() => useRegisterProduct());

      act(() => {
        result.current.handleChange(createInputEvent("name", "ノート"));
      });

      await act(async () => {
        await result.current.handleNameBlur();
      });

      expect(result.current.errors.name).toBe(
        "商品名の重複確認に失敗しました。",
      );
    });
  });

  describe("価格", () => {
    it.each([
      ["", "価格を入力してください。"],
      ["-1", "正しい価格形式で入力してください。"],
      ["10.5", "正しい価格形式で入力してください。"],
      ["1000001", "価格は100万円以下で入力してください。"],
    ])("価格「%s」でエラーになる", (value, message) => {
      const { result } = renderHook(() => useRegisterProduct());

      /**
       * 価格を変更する
       */
      act(() => {
        result.current.handleChange(createInputEvent("price", value));
      });

      /**
       * stateの更新後に
       * バリデーションを実行する
       */
      act(() => {
        result.current.handlePriceBlur();
      });

      expect(result.current.errors.price).toBe(message);
    });

    it.each(["0", "1000000"])("価格%s円は正常", (value) => {
      const { result } = renderHook(() => useRegisterProduct());

      act(() => {
        result.current.handleChange(createInputEvent("price", value));
      });

      act(() => {
        result.current.handlePriceBlur();
      });

      expect(result.current.errors.price).toBeUndefined();
    });
  });

  describe("在庫数", () => {
    it.each([
      ["", "在庫数を入力してください。"],
      ["-1", "正しい在庫数形式で入力してください。"],
      ["10.5", "正しい在庫数形式で入力してください。"],
      ["1001", "在庫数は1000個以下で入力してください。"],
    ])("在庫数「%s」でエラーになる", (value, message) => {
      const { result } = renderHook(() => useRegisterProduct());

      act(() => {
        result.current.handleStockChange(createInputEvent("quantity", value));
      });

      act(() => {
        result.current.handleStockBlur();
      });

      expect(result.current.errors.stock).toBe(message);
    });

    it.each(["0", "1000"])("在庫数%s個は正常", (value) => {
      const { result } = renderHook(() => useRegisterProduct());

      act(() => {
        result.current.handleStockChange(createInputEvent("quantity", value));
      });

      act(() => {
        result.current.handleStockBlur();
      });

      expect(result.current.errors.stock).toBeUndefined();

      expect(result.current.errors.quantity).toBeUndefined();
    });
  });

  describe("カテゴリ", () => {
    it("未選択の場合エラーになる", () => {
      const { result } = renderHook(() => useRegisterProduct());

      act(() => {
        result.current.handleCategoryBlur();
      });

      expect(result.current.errors.categoryUuid).toBe(
        "カテゴリを選択してください。",
      );
    });

    it("存在するUUIDを選ぶとカテゴリが設定される", () => {
      const { result } = renderHook(() => useRegisterProduct());

      act(() => {
        result.current.handleCategoryChange(category.categoryUuid);
      });

      expect(result.current.formData.productCategory).toBe(category);
    });

    it("存在しないUUIDを選ぶとnullになる", () => {
      const { result } = renderHook(() => useRegisterProduct());

      act(() => {
        result.current.handleCategoryChange("unknown");
      });

      expect(result.current.formData.productCategory).toBeNull();
    });
  });

  describe("画像", () => {
    it("ファイル未選択なら画像状態をnullにする", () => {
      const { result } = renderHook(() => useRegisterProduct());

      act(() => {
        result.current.handleImageChange(createFileEvent(null));
      });

      expect(result.current.imageFile).toBeNull();

      expect(result.current.imagePreviewUrl).toBeNull();
    });

    it.each(["image/jpeg", "image/png"])("%s画像を選択できる", async (type) => {
      const file = createImageFile(type);

      const { result } = renderHook(() => useRegisterProduct());

      await act(async () => {
        await result.current.handleImageChange(createFileEvent(file));
      });

      act(() => {
        result.current.handleImageBlur();
      });

      expect(result.current.imageFile).toBe(file);

      expect(result.current.imagePreviewUrl).toBe("blob:product-preview");

      expect(createObjectURLMock).toHaveBeenCalledWith(file);

      expect(result.current.errors.image).toBeUndefined();
    });

    it("非対応形式はエラーになる", async () => {
      const file = createImageFile("image/gif");

      const { result } = renderHook(() => useRegisterProduct());

      await act(async () => {
        await result.current.handleImageChange(createFileEvent(file));
      });

      expect(result.current.errors.image).toBe(
        "商品画像はJPEGまたはPNG形式を選択してください。",
      );
    });

    it("5MB超の画像はエラーになる", async () => {
      const file = createImageFile("image/png", 5 * 1024 * 1024 + 1);

      const { result } = renderHook(() => useRegisterProduct());

      await act(async () => {
        await result.current.handleImageChange(createFileEvent(file));
      });

      expect(result.current.errors.image).toBe(
        "商品画像は5MB以下を選択してください。",
      );
    });

    it("選択後の画像形式が不正な場合はフォーカス離脱時にエラーになる", async () => {
      const file = createImageFile("image/png");

      const { result } = renderHook(() => useRegisterProduct());

      await act(async () => {
        await result.current.handleImageChange(createFileEvent(file));
      });

      Object.defineProperty(file, "type", {
        configurable: true,
        value: "image/gif",
      });

      act(() => {
        result.current.handleImageBlur();
      });

      expect(result.current.errors.image).toBe(
        "商品画像はJPEGまたはPNG形式を選択してください。",
      );
    });

    it("選択後の画像サイズが5MBを超えた場合はフォーカス離脱時にエラーになる", async () => {
      const file = createImageFile("image/png");

      const { result } = renderHook(() => useRegisterProduct());

      await act(async () => {
        await result.current.handleImageChange(createFileEvent(file));
      });

      Object.defineProperty(file, "size", {
        configurable: true,
        value: 5 * 1024 * 1024 + 1,
      });

      act(() => {
        result.current.handleImageBlur();
      });

      expect(result.current.errors.image).toBe(
        "商品画像は5MB以下を選択してください。",
      );
    });

    it("縦横1000pxを超える画像は選択状態にしない", async () => {
      vi.stubGlobal("Image", OversizedMockImage);

      const file = createImageFile();

      const { result } = renderHook(() => useRegisterProduct());

      await act(async () => {
        await result.current.handleImageChange(createFileEvent(file));
      });

      expect(result.current.errors.image).toBe(
        "商品画像は縦横1000px以下を選択してください。",
      );

      expect(result.current.imageFile).toBeNull();

      expect(result.current.imagePreviewUrl).toBeNull();

      expect(revokeObjectURLMock).toHaveBeenCalledWith("blob:product-preview");
    });

    it("画像を読み込めない場合は選択状態にしない", async () => {
      vi.stubGlobal("Image", ErrorMockImage);

      const file = createImageFile();

      const { result } = renderHook(() => useRegisterProduct());

      await act(async () => {
        await result.current.handleImageChange(createFileEvent(file));
      });

      expect(result.current.errors.image).toBe(
        "商品画像を読み込めませんでした。",
      );

      expect(result.current.imageFile).toBeNull();

      expect(result.current.imagePreviewUrl).toBeNull();

      expect(revokeObjectURLMock).toHaveBeenCalledWith("blob:product-preview");
    });

    it("画像変更時とアンマウント時にURLを解放する", async () => {
      createObjectURLMock
        .mockReturnValueOnce("blob:dimension-first")
        .mockReturnValueOnce("blob:first")
        .mockReturnValueOnce("blob:dimension-second")
        .mockReturnValueOnce("blob:second");

      const first = createImageFile("image/png", 100, "first.png");

      const second = createImageFile("image/png", 100, "second.png");

      const { result, unmount } = renderHook(() => useRegisterProduct());

      await act(async () => {
        await result.current.handleImageChange(createFileEvent(first));
      });

      expect(result.current.imagePreviewUrl).toBe("blob:first");

      await act(async () => {
        await result.current.handleImageChange(createFileEvent(second));
      });

      expect(revokeObjectURLMock).toHaveBeenCalledWith("blob:first");

      expect(result.current.imagePreviewUrl).toBe("blob:second");

      unmount();

      expect(revokeObjectURLMock).toHaveBeenCalledWith("blob:second");
    });
  });

  describe("確認モーダル", () => {
    it("全項目が正常なら確認モーダルを開く", async () => {
      const { result } = renderHook(() => useRegisterProduct());

      await fillValidForm(result);

      await act(async () => {
        await result.current.openConfirmModal();
      });

      expect(result.current.isConfirmOpen).toBe(true);
    });

    it("複数項目が不正なら確認モーダルを開かない", async () => {
      const { result } = renderHook(() => useRegisterProduct());

      await act(async () => {
        await result.current.openConfirmModal();
      });

      expect(result.current.isConfirmOpen).toBe(false);

      expect(result.current.hasValidationErrors).toBe(true);
    });

    it("ローディング中でなければモーダルを閉じる", async () => {
      const { result } = renderHook(() => useRegisterProduct());

      await fillValidForm(result);

      await act(async () => {
        await result.current.openConfirmModal();
      });

      act(() => {
        result.current.closeConfirmModal();
      });

      expect(result.current.isConfirmOpen).toBe(false);
    });
  });

  describe("登録処理", () => {
    it("画像なしではServiceを呼ばず画像エラーになる", async () => {
      const { result } = renderHook(() => useRegisterProduct());

      await act(async () => {
        await result.current.confirmRegisterProduct();
      });

      expect(mockRegisterProduct).not.toHaveBeenCalled();

      expect(result.current.errors.image).toBe("商品画像を選択してください。");
    });

    it("登録成功時にServiceを正しい引数で呼び状態を初期化する", async () => {
      mockRegisterProduct.mockResolvedValueOnce(registeredProduct);

      const { result } = renderHook(() => useRegisterProduct());

      const file = await fillValidForm(result);

      await act(async () => {
        await result.current.openConfirmModal();
      });

      await act(async () => {
        await result.current.confirmRegisterProduct();
      });

      expect(mockRegisterProduct).toHaveBeenCalledTimes(1);

      expect(mockRegisterProduct).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "ノート",
          price: 300,
          productCategory: category,
        }),
        file,
      );

      expect(result.current.isLoading).toBe(false);

      expect(result.current.isConfirmOpen).toBe(false);

      expect(result.current.isToastVisible).toBe(true);

      expect(result.current.formData.name).toBe("");

      expect(Number.isNaN(result.current.formData.price)).toBe(true);

      expect(result.current.imageFile).toBeNull();

      expect(result.current.imageInputKey).toBe(1);

      expect(result.current.errors).toEqual({});
    });

    it("Serviceがnullを返した場合モーダルを閉じずトーストを表示しない", async () => {
      mockRegisterProduct.mockResolvedValueOnce(null);

      const { result } = renderHook(() => useRegisterProduct());

      await fillValidForm(result);

      await act(async () => {
        await result.current.openConfirmModal();
      });

      await act(async () => {
        await result.current.confirmRegisterProduct();
      });

      expect(result.current.isConfirmOpen).toBe(true);

      expect(result.current.isToastVisible).toBe(false);

      expect(result.current.isLoading).toBe(false);
    });

    it("通常のErrorはsubmitエラーになる", async () => {
      mockRegisterProduct.mockRejectedValueOnce(new Error("登録APIエラー"));

      const { result } = renderHook(() => useRegisterProduct());

      await fillValidForm(result);

      await act(async () => {
        await result.current.confirmRegisterProduct();
      });

      expect(result.current.errors.submit).toBe("登録APIエラー");

      expect(result.current.isLoading).toBe(false);
    });

    it("validation形式のJSONエラーを各項目へ変換する", async () => {
      mockRegisterProduct.mockRejectedValueOnce(
        new Error(
          JSON.stringify({
            type: "validation",
            errors: {
              Name: "商品名エラー",
              Price: "価格エラー",
              Image: "画像エラー",
            },
          }),
        ),
      );

      const { result } = renderHook(() => useRegisterProduct());

      await fillValidForm(result);

      await act(async () => {
        await result.current.confirmRegisterProduct();
      });

      expect(result.current.errors.name).toBe("商品名エラー");

      expect(result.current.errors.price).toBe("価格エラー");

      expect(result.current.errors.image).toBe("画像エラー");
    });

    it("validation以外のJSONはsubmitエラーになる", async () => {
      const message = JSON.stringify({
        type: "server",
        message: "サーバーエラー",
      });

      mockRegisterProduct.mockRejectedValueOnce(new Error(message));

      const { result } = renderHook(() => useRegisterProduct());

      await fillValidForm(result);

      await act(async () => {
        await result.current.confirmRegisterProduct();
      });

      expect(result.current.errors.submit).toBe(message);
    });

    it("Error以外をthrowした場合既定メッセージになる", async () => {
      mockRegisterProduct.mockRejectedValueOnce("unexpected");

      const { result } = renderHook(() => useRegisterProduct());

      await fillValidForm(result);

      await act(async () => {
        await result.current.confirmRegisterProduct();
      });

      expect(result.current.errors.submit).toBe("商品の登録に失敗しました。");
    });
  });

  describe("トースト", () => {
    it("closeToastで閉じる", async () => {
      mockRegisterProduct.mockResolvedValueOnce(registeredProduct);

      const { result } = renderHook(() => useRegisterProduct());

      await fillValidForm(result);

      await act(async () => {
        await result.current.confirmRegisterProduct();
      });

      act(() => {
        result.current.closeToast();
      });

      expect(result.current.isToastVisible).toBe(false);
    });

    it("10秒経過すると自動で閉じる", async () => {
      vi.useFakeTimers();

      mockRegisterProduct.mockResolvedValueOnce(registeredProduct);

      const { result } = renderHook(() => useRegisterProduct());

      await fillValidForm(result);

      await act(async () => {
        await result.current.confirmRegisterProduct();
      });

      expect(result.current.isToastVisible).toBe(true);

      act(() => {
        vi.advanceTimersByTime(9999);
      });

      expect(result.current.isToastVisible).toBe(true);

      act(() => {
        vi.advanceTimersByTime(1);
      });

      expect(result.current.isToastVisible).toBe(false);
    });
  });

  it("登録処理中は確認モーダルを閉じられない", async () => {
    let resolveRegister: (value: Product | null) => void = () => {};

    mockRegisterProduct.mockImplementationOnce(
      () =>
        new Promise<Product | null>((resolve) => {
          resolveRegister = resolve;
        }),
    );

    const { result } = renderHook(() => useRegisterProduct());

    await fillValidForm(result);

    await act(async () => {
      await result.current.openConfirmModal();
    });

    expect(result.current.isConfirmOpen).toBe(true);

    let registerPromise: Promise<void>;

    await act(async () => {
      registerPromise = result.current.confirmRegisterProduct();

      /**
       * setIsLoading(true)を反映させる
       */
      await Promise.resolve();
    });

    expect(result.current.isLoading).toBe(true);

    /**
     * 登録処理中に閉じようとする
     */
    act(() => {
      result.current.closeConfirmModal();
    });

    /**
     * returnされるため閉じない
     */
    expect(result.current.isConfirmOpen).toBe(true);

    /**
     * 登録処理を終了
     */
    await act(async () => {
      resolveRegister(registeredProduct);

      await registerPromise!;
    });

    expect(result.current.isLoading).toBe(false);
  });

  it("カテゴリ取得エラーが解消した場合systemエラーだけを削除する", () => {
    mockUseProductCategories.mockReturnValue({
      categories: [],
      isLoading: false,
      error: "カテゴリ取得エラー",
    });

    const { result, rerender } = renderHook(() => useRegisterProduct());

    expect(result.current.errors.system).toBe("カテゴリ取得エラー");

    /**
     * カテゴリ取得成功へ変更する
     */
    mockUseProductCategories.mockReturnValue({
      categories: [category],
      isLoading: false,
      error: null,
    });

    rerender();

    expect(result.current.errors.system).toBeUndefined();
  });

  it("カテゴリ取得成功時にsystemエラーが存在しなければerrorsを変更しない", () => {
    mockUseProductCategories.mockReturnValue({
      categories: [category],
      isLoading: false,
      error: null,
    });

    const { result, rerender } = renderHook(() => useRegisterProduct());

    const beforeErrors = result.current.errors;

    rerender();

    expect(result.current.errors).toBe(beforeErrors);

    expect(result.current.errors.system).toBeUndefined();
  });

  it("同じカテゴリ取得エラーで再レンダーした場合systemエラーを変更しない", () => {
    mockUseProductCategories.mockReturnValue({
      categories: [],
      isLoading: false,
      error: "カテゴリ取得エラー",
    });

    const { result, rerender } = renderHook(() => useRegisterProduct());

    expect(result.current.errors.system).toBe("カテゴリ取得エラー");

    const beforeErrors = result.current.errors;

    /**
     * categoriesErrorを変えずに
     * 再レンダーする
     */
    rerender();

    expect(result.current.errors.system).toBe("カテゴリ取得エラー");

    /**
     * return prevが実行され、
     * errorsオブジェクト自体も
     * 同じ参照のままであること
     */
    expect(result.current.errors).toBe(beforeErrors);
  });

  it("在庫数変更時に既存のstockUuidを保持する", () => {
    const { result } = renderHook(() => useRegisterProduct());

    const beforeStockUuid = result.current.formData.productStock?.stockUuid;

    act(() => {
      result.current.handleStockChange(createInputEvent("quantity", "10"));
    });

    expect(result.current.formData.productStock?.stockUuid).toBe(
      beforeStockUuid,
    );

    expect(result.current.formData.productStock?.quantity).toBe(10);
  });

  describe("resetForm", () => {
    it("入力・画像・エラー・モーダルを初期化する", async () => {
      mockValidateProductName.mockRejectedValueOnce(new Error("商品名エラー"));

      const { result } = renderHook(() => useRegisterProduct());

      await fillValidForm(result);

      await act(async () => {
        await result.current.handleNameBlur();
      });

      await act(async () => {
        await result.current.openConfirmModal();
      });

      const previousKey = result.current.imageInputKey;

      act(() => {
        result.current.resetForm();
      });

      expect(result.current.formData.name).toBe("");

      expect(Number.isNaN(result.current.formData.price)).toBe(true);

      expect(result.current.formData.productCategory).toBeNull();

      expect(result.current.imageFile).toBeNull();

      expect(result.current.imagePreviewUrl).toBeNull();

      expect(result.current.errors).toEqual({});

      expect(result.current.isConfirmOpen).toBe(false);

      expect(result.current.imageInputKey).toBe(previousKey + 1);
    });
  });
});
