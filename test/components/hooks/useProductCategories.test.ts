// @vitest-environment jsdom

import { act, renderHook, waitFor } from "@testing-library/react";

import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ProductCategory } from "@/models/ProductCategory";

const { mockContainerGet, mockGetCategories } = vi.hoisted(() => ({
  mockContainerGet: vi.fn(),

  mockGetCategories: vi.fn(),
}));

vi.mock("@/di/container", () => ({
  container: {
    get: mockContainerGet,
  },
}));

import { TYPES } from "@/di/types";

import { useProductCategories } from "@/components/hooks/useProductCategories";

/**
 * テスト用カテゴリ
 */
const categories: ProductCategory[] = [
  {
    categoryUuid: "category-uuid-001",
    name: "文房具",
  } as ProductCategory,
  {
    categoryUuid: "category-uuid-002",
    name: "雑貨",
  } as ProductCategory,
];

/**
 * 任意のタイミングで完了できるPromiseを生成する
 */
const createDeferred = <T>() => {
  let resolve: (value: T) => void = () => {};

  let reject: (reason?: unknown) => void = () => {};

  const promise = new Promise<T>((promiseResolve, promiseReject) => {
    resolve = promiseResolve;

    reject = promiseReject;
  });

  return {
    promise,
    resolve,
    reject,
  };
};

describe("useProductCategories", () => {
  beforeEach(() => {
    mockContainerGet.mockReset();

    mockGetCategories.mockReset();

    mockContainerGet.mockReturnValue({
      getCategories: mockGetCategories,
    });
  });

  it("初期表示時にカテゴリ一覧を取得する", async () => {
    mockGetCategories.mockResolvedValue(categories);

    const { result } = renderHook(() => useProductCategories());

    expect(mockContainerGet).toHaveBeenCalledWith(
      TYPES.IRegisterProductService,
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);

      expect(result.current.categories).toEqual(categories);
    });

    expect(result.current.error).toBeNull();

    expect(mockGetCategories).toHaveBeenCalledTimes(1);
  });

  it("カテゴリ取得中はisLoadingをtrueにする", async () => {
    const deferred = createDeferred<ProductCategory[]>();

    mockGetCategories.mockReturnValue(deferred.promise);

    const { result } = renderHook(() => useProductCategories());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(true);
    });

    expect(result.current.categories).toEqual([]);

    expect(result.current.error).toBeNull();

    await act(async () => {
      deferred.resolve(categories);

      await deferred.promise;
    });

    expect(result.current.isLoading).toBe(false);

    expect(result.current.categories).toEqual(categories);
  });

  it("Errorが発生した場合はmessageを設定してカテゴリ一覧を空にする", async () => {
    mockGetCategories.mockRejectedValue(new Error("カテゴリ取得APIエラー"));

    const { result } = renderHook(() => useProductCategories());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);

      expect(result.current.error).toBe("カテゴリ取得APIエラー");
    });

    expect(result.current.categories).toEqual([]);
  });

  it("Error以外が発生した場合は既定メッセージを設定する", async () => {
    mockGetCategories.mockRejectedValue("unexpected");

    const { result } = renderHook(() => useProductCategories());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);

      expect(result.current.error).toBe(
        "商品カテゴリ一覧の取得に失敗しました。",
      );
    });

    expect(result.current.categories).toEqual([]);
  });
});
