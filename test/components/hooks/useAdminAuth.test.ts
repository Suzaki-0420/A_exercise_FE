// @vitest-environment jsdom

import {
  loadLoggedInAdmin,
  saveLoggedInAdmin,
} from "@/components/api/auth/adminSessionStorage";
import { useAdminLogin } from "@/components/hooks/useAdminLogin";
import { useAdminLogout } from "@/components/hooks/useAdminLogout";
import { TYPES } from "@/di/types";
import {
  AdminLoginError,
  AdminLogoutError,
  type LoggedInAdmin,
} from "@/models/AdminAuth";
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import type { ChangeEvent, FormEvent } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { mockContainerGet, mockLogin, mockLogout, mockReplace, mockRefresh } =
  vi.hoisted(() => ({
    mockContainerGet: vi.fn(),
    mockLogin: vi.fn(),
    mockLogout: vi.fn(),
    mockReplace: vi.fn(),
    mockRefresh: vi.fn(),
  }));

vi.mock("@/di/container", () => ({
  container: {
    get: mockContainerGet,
  },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: mockReplace,
    refresh: mockRefresh,
  }),
}));

const loggedInAdmin: LoggedInAdmin = {
  accountUuid: "10000000-0000-0000-0000-000000000001",
  accountName: "yamada01",
  employeeName: "山田太郎",
};

type AdminLoginHookResult = {
  current: ReturnType<typeof useAdminLogin>;
};

const setLoginCredentials = (
  result: AdminLoginHookResult,
  accountName: string,
  password: string,
) => {
  act(() => {
    result.current.handleChange({
      target: {
        name: "accountName",
        value: accountName,
      },
    } as ChangeEvent<HTMLInputElement>);
    result.current.handleChange({
      target: {
        name: "password",
        value: password,
      },
    } as ChangeEvent<HTMLInputElement>);
  });
};

const submitLogin = async (result: AdminLoginHookResult) => {
  await act(async () => {
    await result.current.handleSubmit({
      preventDefault: vi.fn(),
    } as unknown as FormEvent<HTMLFormElement>);
  });
};

describe("担当者認証Hook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    mockContainerGet.mockImplementation((identifier: symbol) => {
      if (identifier === TYPES.ILoginAdminService) {
        return { login: mockLogin };
      }

      return { logout: mockLogout };
    });
  });

  afterEach(() => {
    cleanup();
  });

  it("ログイン成功時に担当者情報を保存して管理メニューへ遷移する", async () => {
    mockLogin.mockResolvedValue(loggedInAdmin);
    const { result } = renderHook(() => useAdminLogin());

    setLoginCredentials(result, "yamada01", "passYamada");
    await submitLogin(result);

    expect(mockLogin).toHaveBeenCalledWith({
      accountName: "yamada01",
      password: "passYamada",
    });
    expect(loadLoggedInAdmin()).toEqual(loggedInAdmin);
    expect(mockReplace).toHaveBeenCalledWith("/admin");
    expect(mockRefresh).toHaveBeenCalledTimes(1);
  });

  it("ログイン画面を表示したときに以前の担当者情報を削除する", () => {
    saveLoggedInAdmin(loggedInAdmin);

    renderHook(() => useAdminLogin());

    expect(loadLoggedInAdmin()).toBeNull();
  });

  it.each([
    [
      "アカウント名の未入力",
      "",
      "passYamada",
      "accountName",
      "アカウント名を入力してください。",
    ],
    [
      "アカウント名の文字数不足",
      "abcd",
      "passYamada",
      "accountName",
      "アカウント名は5～20文字で入力してください。",
    ],
    [
      "アカウント名の文字数超過",
      "a".repeat(21),
      "passYamada",
      "accountName",
      "アカウント名は5～20文字で入力してください。",
    ],
    [
      "アカウント名の文字種不正",
      "yamada-01",
      "passYamada",
      "accountName",
      "アカウント名は半角英数字で入力してください。",
    ],
    [
      "パスワードの未入力",
      "yamada01",
      "",
      "password",
      "パスワードを入力してください。",
    ],
    [
      "パスワードの文字数不足",
      "yamada01",
      "pass",
      "password",
      "パスワードは5～20文字で入力してください。",
    ],
    [
      "パスワードの文字数超過",
      "yamada01",
      "a".repeat(21),
      "password",
      "パスワードは5～20文字で入力してください。",
    ],
    [
      "パスワードの文字種不正",
      "yamada01",
      "pass-word",
      "password",
      "パスワードは半角英数字で入力してください。",
    ],
  ])(
    "%sではAPIを呼ばず項目エラーを設定する",
    async (_caseName, accountName, password, field, message) => {
      const { result } = renderHook(() => useAdminLogin());
      setLoginCredentials(result, accountName, password);

      await submitLogin(result);

      expect(mockLogin).not.toHaveBeenCalled();
      expect(
        result.current.fieldErrors[field as "accountName" | "password"],
      ).toBe(message);
    },
  );

  it("ログインAPIの認証エラーを画面用エラーへ反映し、入力時に解除する", async () => {
    mockLogin.mockRejectedValue(
      new AdminLoginError("アカウント名またはパスワードが正しくありません。", {
        accountName: "アカウント名を確認してください。",
      }),
    );
    const { result } = renderHook(() => useAdminLogin());
    setLoginCredentials(result, "yamada01", "passYamada");

    await submitLogin(result);

    expect(result.current.submitError).toBe(
      "アカウント名またはパスワードが正しくありません。",
    );
    expect(result.current.fieldErrors.accountName).toBe(
      "アカウント名を確認してください。",
    );

    act(() => {
      result.current.handleChange({
        target: {
          name: "accountName",
          value: "suzuki01",
        },
      } as ChangeEvent<HTMLInputElement>);
    });

    expect(result.current.submitError).toBeNull();
    expect(result.current.fieldErrors.accountName).toBeUndefined();
  });

  it("ログイン中はローディング状態になり、想定外エラーを共通メッセージへ変換する", async () => {
    let rejectLogin!: (reason: unknown) => void;
    mockLogin.mockImplementation(
      () =>
        new Promise((_resolve, reject) => {
          rejectLogin = reject;
        }),
    );
    const { result } = renderHook(() => useAdminLogin());
    setLoginCredentials(result, "yamada01", "passYamada");

    act(() => {
      void result.current.handleSubmit({
        preventDefault: vi.fn(),
      } as unknown as FormEvent<HTMLFormElement>);
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(true);
    });

    await act(async () => {
      rejectLogin("unexpected");
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.submitError).toBe(
      "システムエラーが発生しました。管理者に連絡してください。",
    );
  });

  it("ログアウト成功時に担当者情報を削除してログイン画面へ遷移する", async () => {
    saveLoggedInAdmin(loggedInAdmin);
    mockLogout.mockResolvedValue(undefined);
    const { result } = renderHook(() => useAdminLogout());

    await act(async () => {
      await result.current.handleLogout();
    });

    expect(loadLoggedInAdmin()).toBeNull();
    expect(mockReplace).toHaveBeenCalledWith("/admin/login");
    expect(mockRefresh).toHaveBeenCalledTimes(1);
  });

  it("認証切れのログアウトでも担当者情報を削除してログイン画面へ遷移する", async () => {
    saveLoggedInAdmin(loggedInAdmin);
    mockLogout.mockRejectedValue(
      new AdminLogoutError("ログインの有効期限が切れています。", 401),
    );
    const { result } = renderHook(() => useAdminLogout());

    await act(async () => {
      await result.current.handleLogout();
    });

    expect(loadLoggedInAdmin()).toBeNull();
    expect(mockReplace).toHaveBeenCalledWith("/admin/login");
    expect(result.current.submitError).toBeNull();
  });

  it("ログアウトが401以外で失敗した場合は担当者情報を残す", async () => {
    saveLoggedInAdmin(loggedInAdmin);
    mockLogout.mockRejectedValue(
      new AdminLogoutError("ログアウトできませんでした。", 500),
    );
    const { result } = renderHook(() => useAdminLogout());

    await act(async () => {
      await result.current.handleLogout();
    });

    expect(loadLoggedInAdmin()).toEqual(loggedInAdmin);
    expect(mockReplace).not.toHaveBeenCalled();
    expect(result.current.submitError).toBe("ログアウトできませんでした。");
  });

  it("ログアウトで想定外エラーが発生した場合は共通メッセージを表示する", async () => {
    mockLogout.mockRejectedValue("unexpected");
    const { result } = renderHook(() => useAdminLogout());

    await act(async () => {
      await result.current.handleLogout();
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.submitError).toBe(
      "システムエラーが発生しました。管理者に連絡してください。",
    );
  });
});
