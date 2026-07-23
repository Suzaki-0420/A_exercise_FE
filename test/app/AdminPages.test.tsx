// @vitest-environment jsdom

import AdminLayout from "@/app/admin/layout";
import AdminLoginPage from "@/app/admin/login/page";
import AdminMenuPage from "@/app/admin/page";
import UpdateProductPage from "@/app/admin/product/edit/[productId]/page";
import UpdateProductCompletePage from "@/app/admin/product/edit/complete/page";
import UpdateProductConfirmPage from "@/app/admin/product/edit/confirm/page";
import UpdateProductLayout from "@/app/admin/product/edit/layout";
import { cleanup, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { mockCookies, mockRedirect, mockUpdateProductFlow } = vi.hoisted(() => ({
  mockCookies: vi.fn(),
  mockRedirect: vi.fn(),
  mockUpdateProductFlow: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: mockCookies,
}));

vi.mock("next/navigation", () => ({
  redirect: mockRedirect,
}));

/*
 * Server Componentのページテストでは、
 * Next.js Linkの内部ルーター処理を対象にしない。
 */
vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

/*
 * ButtonのasChild処理はButton側のテストへ任せる。
 * このファイルでは管理画面ページの表示だけを確認する。
 */
vi.mock("@/components/ui/button", () => ({
  Button: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

vi.mock("@/components/common/AdminHeader", () => ({
  AdminHeader: () => <header>管理画面ヘッダー</header>,
}));

vi.mock("@/components/api/auth/login/AdminLoginForm", () => ({
  AdminLoginForm: () => <div>ログインフォーム</div>,
}));

vi.mock("@/components/api/auth/AdminWelcome", () => ({
  AdminWelcome: () => <p>担当者への案内</p>,
}));

vi.mock("@/components/product/edit/UpdateProductFlow", () => ({
  UpdateProductFlow: (props: { productUuid: string }) => {
    mockUpdateProductFlow(props);

    return <div>商品修正入力</div>;
  },
}));

vi.mock("@/components/product/edit/UpdateProductConfirm", () => ({
  UpdateProductConfirm: () => <div>商品修正確認</div>,
}));

vi.mock("@/components/product/edit/UpdateProductComplete", () => ({
  UpdateProductComplete: () => <div>商品修正完了</div>,
}));

describe("管理画面ページ", () => {
  beforeEach(() => {
    /*
     * 呼び出し履歴だけでなく、
     * 前のテストで設定された戻り値も初期化する。
     */
    mockCookies.mockReset();
    mockRedirect.mockReset();
    mockUpdateProductFlow.mockReset();

    mockRedirect.mockImplementation(() => {
      throw new Error("NEXT_REDIRECT");
    });
  });

  afterEach(() => {
    cleanup();
  });

  it("認証Cookieがない場合は管理メニューからログイン画面へ遷移する", async () => {
    mockCookies.mockResolvedValue({
      get: vi.fn().mockReturnValue(undefined),
    });

    await expect(AdminMenuPage()).rejects.toThrow("NEXT_REDIRECT");

    expect(mockRedirect).toHaveBeenCalledWith("/admin/login");
  });

  it("空の認証Cookieでもログイン画面へ遷移する", async () => {
    mockCookies.mockResolvedValue({
      get: vi.fn().mockReturnValue({
        value: "",
      }),
    });

    await expect(AdminMenuPage()).rejects.toThrow("NEXT_REDIRECT");
  });

  it("認証Cookieがある場合は管理メニューを表示する", async () => {
    mockCookies.mockResolvedValue({
      get: vi.fn().mockReturnValue({
        value: "auth-cookie",
      }),
    });

    const page = await AdminMenuPage();

    render(page);

    expect(
      screen.getByRole("heading", {
        name: "メニュー",
      }),
    ).toBeTruthy();

    expect(screen.getByText("担当者への案内")).toBeTruthy();

    expect(mockRedirect).not.toHaveBeenCalled();
  });

  it("ログインページを表示する", () => {
    render(<AdminLoginPage />);

    expect(screen.getByText("ログインフォーム")).toBeTruthy();
  });

  it("管理画面レイアウトにヘッダーと子要素を表示する", () => {
    render(
      <AdminLayout>
        <main>管理画面本文</main>
      </AdminLayout>,
    );

    expect(screen.getByText("管理画面ヘッダー")).toBeTruthy();

    expect(screen.getByText("管理画面本文")).toBeTruthy();
  });

  it("商品UUIDを入力画面コンポーネントへ渡す", async () => {
    const page = await UpdateProductPage({
      params: Promise.resolve({
        productId: "product-uuid",
      }),
    });

    render(page);

    expect(mockUpdateProductFlow).toHaveBeenCalledWith({
      productUuid: "product-uuid",
    });
  });

  it("商品修正の確認ページと完了ページを表示する", () => {
    const { rerender } = render(<UpdateProductConfirmPage />);

    expect(screen.getByText("商品修正確認")).toBeTruthy();

    rerender(<UpdateProductCompletePage />);

    expect(screen.getByText("商品修正完了")).toBeTruthy();
  });

  it("商品修正レイアウト内で子要素を表示する", () => {
    render(
      <UpdateProductLayout>
        <main>商品修正本文</main>
      </UpdateProductLayout>,
    );

    expect(screen.getByText("商品修正本文")).toBeTruthy();
  });
});
