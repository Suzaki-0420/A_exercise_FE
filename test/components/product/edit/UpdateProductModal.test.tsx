// @vitest-environment jsdom

import { UpdateProductFlow } from "@/components/product/edit/UpdateProductFlow";
import type { UseUpdateProductOptions } from "@/components/hooks/useUpdateProduct";
import type { ProductUpdateResult } from "@/models/ProductUpdate";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const updateResult: ProductUpdateResult = {
  productUuid: "10000000-0000-0000-0000-000000000001",
  name: "水性ボールペン黒",
  price: 120,
  stockQuantity: 80,
  categoryUuid: "e50d978b-b73d-4afb-8e85-ace9cf1e12a7",
  imageUrl: null,
  updated: true,
};

vi.mock("@/components/product/edit/UpdateProduct", () => ({
  UpdateProduct: ({
    productUuid,
    options,
  }: {
    productUuid: string;
    options?: UseUpdateProductOptions;
  }) => (
    <main>
      <p>
        商品修正入力フォーム：
        {productUuid}
      </p>
      <button type="button" onClick={options?.onProceedToConfirm}>
        確認へ
      </button>
    </main>
  ),
}));

vi.mock("@/components/product/edit/UpdateProductConfirm", () => ({
  UpdateProductConfirm: ({
    options,
  }: {
    options?: UseUpdateProductOptions;
  }) => (
    <div>
      <p>商品修正確認内容</p>
      <button type="button" onClick={options?.onBackToInput}>
        入力へ戻る
      </button>
      <button
        type="button"
        onClick={() => {
          void options?.onUpdateSuccess?.(updateResult);
        }}
      >
        更新を確定
      </button>
      <button
        type="button"
        onClick={() => {
          options?.onUpdatePendingChange?.(true);
        }}
      >
        更新開始
      </button>
      <button
        type="button"
        onClick={() => {
          options?.onUpdatePendingChange?.(false);
        }}
      >
        更新終了
      </button>
    </div>
  ),
}));

vi.mock("@/components/product/edit/UpdateProductComplete", () => ({
  UpdateProductComplete: ({ variant }: { variant?: "page" | "modal" }) => (
    <p>商品修正完了：{variant}</p>
  ),
}));

describe("商品修正のページ・モーダル遷移", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("入力はページに表示し、確認操作後にモーダルを開く", () => {
    render(<UpdateProductFlow productUuid={updateResult.productUuid} />);

    expect(
      screen.getByText(`商品修正入力フォーム：${updateResult.productUuid}`),
    ).toBeTruthy();
    expect(screen.queryByRole("dialog")).toBeNull();

    fireEvent.click(
      screen.getByRole("button", {
        name: "確認へ",
      }),
    );

    expect(screen.getByRole("dialog")).toBeTruthy();
    expect(screen.getByText("商品修正確認内容")).toBeTruthy();
  });

  it("確認モーダルから入力ページへ戻れる", () => {
    render(<UpdateProductFlow productUuid={updateResult.productUuid} />);

    fireEvent.click(
      screen.getByRole("button", {
        name: "確認へ",
      }),
    );
    fireEvent.click(
      screen.getByRole("button", {
        name: "入力へ戻る",
      }),
    );

    expect(screen.queryByRole("dialog")).toBeNull();
    expect(
      screen.getByText(`商品修正入力フォーム：${updateResult.productUuid}`),
    ).toBeTruthy();
  });

  it("更新成功後は完了内容をモーダルに表示する", () => {
    render(<UpdateProductFlow productUuid={updateResult.productUuid} />);

    fireEvent.click(
      screen.getByRole("button", {
        name: "確認へ",
      }),
    );
    fireEvent.click(
      screen.getByRole("button", {
        name: "更新を確定",
      }),
    );

    expect(screen.getByRole("dialog")).toBeTruthy();
    expect(screen.getByText("商品修正完了：modal")).toBeTruthy();
    expect(screen.queryByText("商品修正確認内容")).toBeNull();
  });

  it("更新処理中はEscapeキーで確認モーダルを閉じない", () => {
    render(<UpdateProductFlow productUuid={updateResult.productUuid} />);

    fireEvent.click(
      screen.getByRole("button", {
        name: "確認へ",
      }),
    );
    fireEvent.click(
      screen.getByRole("button", {
        name: "更新開始",
      }),
    );
    fireEvent.keyDown(document, {
      key: "Escape",
    });

    expect(screen.getByRole("dialog")).toBeTruthy();

    fireEvent.click(
      screen.getByRole("button", {
        name: "更新終了",
      }),
    );
    fireEvent.keyDown(document, {
      key: "Escape",
    });

    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("完了モーダルはEscapeキーで閉じない", () => {
    render(<UpdateProductFlow productUuid={updateResult.productUuid} />);

    fireEvent.click(
      screen.getByRole("button", {
        name: "確認へ",
      }),
    );
    fireEvent.click(
      screen.getByRole("button", {
        name: "更新を確定",
      }),
    );
    fireEvent.keyDown(document, {
      key: "Escape",
    });

    expect(screen.getByRole("dialog")).toBeTruthy();
    expect(screen.getByText("商品修正完了：modal")).toBeTruthy();
  });
});
