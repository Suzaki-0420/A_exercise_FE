// @vitest-environment jsdom

import { act, cleanup, renderHook } from "@testing-library/react";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { Product } from "@/models/Product";

/**
 * Serviceのexecuteモック
 */
const { mockExecute, mockContainerGet } = vi.hoisted(() => ({
  mockExecute: vi.fn(),
  mockContainerGet: vi.fn(),
}));

/**
 * DIコンテナをモックする
 */
vi.mock("@/di/container", () => ({
  container: {
    get: mockContainerGet,
  },
}));

import { useSearchProductByCategory } from "@/components/hooks/useSearchProductByCategory";

/**
 * 商品カテゴリ検索Hookのテスト
 */
describe("useSearchProductByCategory", () => {
  const products = [
    {
      productUuid: "product-uuid-001",
      name: "ノート",
      price: 300,
      imageUrl: null,
      productCategory: null,
      productStock: {
        stockUuid: "stock-uuid-001",
        quantity: 10,
      },
      deleteFlg: 0,
    },
    {
      productUuid: "product-uuid-002",
      name: "ボールペン",
      price: 150,
      imageUrl: null,
      productCategory: null,
      productStock: {
        stockUuid: "stock-uuid-002",
        quantity: 20,
      },
      deleteFlg: 0,
    },
  ] satisfies Product[];

  beforeEach(() => {
    /*
     * 呼び出し履歴だけでなく、
     * 戻り値やmockImplementationOnceの
     * キューも完全に初期化する。
     */
    mockExecute.mockReset();
    mockContainerGet.mockReset();

    mockContainerGet.mockReturnValue({
      execute: mockExecute,
    });

    vi.spyOn(console, "log").mockImplementation(() => {
      // テスト中は出力しない
    });

    vi.spyOn(console, "error").mockImplementation(() => {
      // テスト中は出力しない
    });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  /**
   * 初期状態
   */
  it("初期状態が正しい", () => {
    const { result } = renderHook(() => useSearchProductByCategory());

    expect(result.current.products).toEqual([]);

    expect(result.current.isLoading).toBe(false);

    expect(result.current.error).toBeNull();

    expect(result.current.search).toEqual(expect.any(Function));
  });

  /**
   * DIコンテナからServiceを取得
   */
  it("ServiceをDIコンテナから取得する", () => {
    renderHook(() => useSearchProductByCategory());

    expect(mockContainerGet).toHaveBeenCalledTimes(1);
  });

  /**
   * 通常検索成功
   */
  it("カテゴリ検索に成功した場合商品一覧を設定する", async () => {
    mockExecute.mockResolvedValueOnce(products);

    const { result } = renderHook(() => useSearchProductByCategory());

    await act(async () => {
      await result.current.search("category-uuid-001", false);
    });

    expect(mockExecute).toHaveBeenCalledTimes(1);

    expect(mockExecute).toHaveBeenCalledWith("category-uuid-001", false);

    expect(result.current.products).toEqual(products);

    expect(result.current.error).toBeNull();

    expect(result.current.isLoading).toBe(false);
  });

  /**
   * 全カテゴリ検索
   */
  it("カテゴリUUIDが空文字の場合空文字のままServiceへ渡す", async () => {
    mockExecute.mockResolvedValueOnce(products);

    const { result } = renderHook(() => useSearchProductByCategory());

    await act(async () => {
      await result.current.search("", false);
    });

    expect(mockExecute).toHaveBeenCalledWith("", false);

    expect(result.current.products).toEqual(products);
  });

  /**
   * 削除済み商品のみ検索
   */
  it("削除済み商品のみ表示する場合trueをServiceへ渡す", async () => {
    mockExecute.mockResolvedValueOnce(products);

    const { result } = renderHook(() => useSearchProductByCategory());

    await act(async () => {
      await result.current.search("category-uuid-001", true);
    });

    expect(mockExecute).toHaveBeenCalledWith("category-uuid-001", true);

    expect(result.current.products).toEqual(products);
  });

  /**
   * 検索結果0件
   */
  it("検索結果が0件の場合空配列を設定する", async () => {
    mockExecute.mockResolvedValueOnce([]);

    const { result } = renderHook(() => useSearchProductByCategory());

    await act(async () => {
      await result.current.search("category-uuid-001", false);
    });

    expect(result.current.products).toEqual([]);

    expect(result.current.error).toBeNull();

    expect(result.current.isLoading).toBe(false);
  });

  /**
   * Error発生
   */
  it("ServiceがErrorを投げた場合messageを設定する", async () => {
    const serviceError = new Error("カテゴリ検索エラー");

    mockExecute.mockRejectedValueOnce(serviceError);

    const { result } = renderHook(() => useSearchProductByCategory());

    await act(async () => {
      await result.current.search("category-uuid-001", false);
    });

    expect(result.current.error).toBe("カテゴリ検索エラー");

    expect(result.current.products).toEqual([]);

    expect(result.current.isLoading).toBe(false);

    expect(console.error).toHaveBeenCalledWith(
      "カテゴリ商品検索エラー:",
      serviceError,
    );
  });

  /**
   * 既存商品がある状態で検索失敗
   */
  it("検索に失敗した場合既存の商品一覧を空にする", async () => {
    const { result } = renderHook(() => useSearchProductByCategory());

    /*
     * 1回目は成功
     */
    mockExecute.mockResolvedValueOnce(products);

    await act(async () => {
      await result.current.search("category-uuid-001", false);
    });

    expect(result.current.products).toEqual(products);

    /*
     * 2回目は失敗
     */
    mockExecute.mockRejectedValueOnce(new Error("カテゴリ検索エラー"));

    await act(async () => {
      await result.current.search("category-uuid-002", false);
    });

    expect(result.current.error).toBe("カテゴリ検索エラー");

    expect(result.current.products).toEqual([]);

    expect(result.current.isLoading).toBe(false);
  });

  /**
   * Error以外の値がthrowされる
   */
  it("ServiceがError以外を投げた場合既定メッセージを設定する", async () => {
    mockExecute.mockRejectedValueOnce("unexpected error");

    const { result } = renderHook(() => useSearchProductByCategory());

    await act(async () => {
      await result.current.search("category-uuid-001", false);
    });

    expect(result.current.error).toBe("カテゴリによる商品検索に失敗しました。");

    expect(result.current.products).toEqual([]);

    expect(result.current.isLoading).toBe(false);
  });

  /**
   * 通信中状態
   */
  it("検索処理中はisLoadingがtrueになる", async () => {
    let resolveSearch: (value: Product[]) => void;

    const pendingPromise = new Promise<Product[]>((resolve) => {
      resolveSearch = resolve;
    });

    mockExecute.mockReturnValueOnce(pendingPromise);

    const { result } = renderHook(() => useSearchProductByCategory());

    let searchPromise: Promise<void>;

    /*
     * 検索は完了させずに開始だけする。
     *
     * search()内の最初のawaitより前に
     * setIsLoading(true)が呼ばれるため、
     * 同期actでstateを反映できる。
     */
    act(() => {
      searchPromise = result.current.search("category-uuid-001", false);
    });

    expect(result.current.isLoading).toBe(true);

    expect(result.current.error).toBeNull();

    /*
     * Serviceを完了させる。
     */
    await act(async () => {
      resolveSearch!(products);
      await searchPromise!;
    });

    expect(result.current.isLoading).toBe(false);

    expect(result.current.products).toEqual(products);
  });

  /**
   * 再検索時のエラー初期化
   */
  it("再検索を開始すると以前のエラーをnullにする", async () => {
    const { result } = renderHook(() => useSearchProductByCategory());

    /*
     * 1回目の検索を失敗させる。
     */
    mockExecute.mockRejectedValueOnce(new Error("最初の検索エラー"));

    await act(async () => {
      await result.current.search("category-uuid-001", false);
    });

    expect(result.current.error).toBe("最初の検索エラー");

    /*
     * 2回目の検索を保留状態にする。
     */
    let resolveSearch: (value: Product[]) => void;

    const pendingPromise = new Promise<Product[]>((resolve) => {
      resolveSearch = resolve;
    });

    mockExecute.mockReturnValueOnce(pendingPromise);

    let searchPromise: Promise<void>;

    /*
     * 完了をawaitせず、検索開始時の
     * stateだけ確認する。
     */
    act(() => {
      searchPromise = result.current.search("category-uuid-002", false);
    });

    expect(result.current.error).toBeNull();

    expect(result.current.isLoading).toBe(true);

    /*
     * 保留中の検索を完了させる。
     */
    await act(async () => {
      resolveSearch!(products);
      await searchPromise!;
    });

    expect(result.current.products).toEqual(products);

    expect(result.current.error).toBeNull();

    expect(result.current.isLoading).toBe(false);
  });
});
