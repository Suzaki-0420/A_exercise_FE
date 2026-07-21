// @vitest-environment jsdom

import {
    loadLoggedInAdmin,
    saveLoggedInAdmin,
} from "@/components/api/auth/adminSessionStorage";
import { useAdminLogin } from "@/components/hooks/useAdminLogin";
import { useAdminLogout } from "@/components/hooks/useAdminLogout";
import { TYPES } from "@/di/types";
import {
    AdminLogoutError,
    type LoggedInAdmin,
} from "@/models/AdminAuth";
import {
    act,
    cleanup,
    renderHook,
} from "@testing-library/react";
import type {
    ChangeEvent,
    FormEvent,
} from "react";
import {
    afterEach,
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from "vitest";

const {
    mockContainerGet,
    mockLogin,
    mockLogout,
    mockReplace,
    mockRefresh,
} = vi.hoisted(() => ({
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
    accountUuid:
        "10000000-0000-0000-0000-000000000001",
    accountName: "yamada01",
    employeeName: "山田太郎",
};

describe("担当者認証Hook", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        sessionStorage.clear();
        mockContainerGet.mockImplementation(
            (identifier: symbol) => {
                if (
                    identifier ===
                    TYPES.ILoginAdminService
                ) {
                    return { login: mockLogin };
                }

                return { logout: mockLogout };
            }
        );
    });

    afterEach(() => {
        cleanup();
    });

    it("ログイン成功時に担当者情報を保存して管理メニューへ遷移する", async () => {
        mockLogin.mockResolvedValue(loggedInAdmin);
        const { result } = renderHook(() =>
            useAdminLogin()
        );

        act(() => {
            result.current.handleChange({
                target: {
                    name: "accountName",
                    value: "yamada01",
                },
            } as ChangeEvent<HTMLInputElement>);
            result.current.handleChange({
                target: {
                    name: "password",
                    value: "passYamada",
                },
            } as ChangeEvent<HTMLInputElement>);
        });

        await act(async () => {
            await result.current.handleSubmit({
                preventDefault: vi.fn(),
            } as unknown as FormEvent<HTMLFormElement>);
        });

        expect(mockLogin).toHaveBeenCalledWith({
            accountName: "yamada01",
            password: "passYamada",
        });
        expect(loadLoggedInAdmin()).toEqual(
            loggedInAdmin
        );
        expect(mockReplace).toHaveBeenCalledWith(
            "/admin"
        );
        expect(mockRefresh).toHaveBeenCalledTimes(1);
    });

    it("ログイン画面を表示したときに以前の担当者情報を削除する", () => {
        saveLoggedInAdmin(loggedInAdmin);

        renderHook(() => useAdminLogin());

        expect(loadLoggedInAdmin()).toBeNull();
    });

    it("ログアウト成功時に担当者情報を削除してログイン画面へ遷移する", async () => {
        saveLoggedInAdmin(loggedInAdmin);
        mockLogout.mockResolvedValue(undefined);
        const { result } = renderHook(() =>
            useAdminLogout()
        );

        await act(async () => {
            await result.current.handleLogout();
        });

        expect(loadLoggedInAdmin()).toBeNull();
        expect(mockReplace).toHaveBeenCalledWith(
            "/admin/login"
        );
        expect(mockRefresh).toHaveBeenCalledTimes(1);
    });

    it("認証切れのログアウトでも担当者情報を削除してログイン画面へ遷移する", async () => {
        saveLoggedInAdmin(loggedInAdmin);
        mockLogout.mockRejectedValue(
            new AdminLogoutError(
                "ログインの有効期限が切れています。",
                401
            )
        );
        const { result } = renderHook(() =>
            useAdminLogout()
        );

        await act(async () => {
            await result.current.handleLogout();
        });

        expect(loadLoggedInAdmin()).toBeNull();
        expect(mockReplace).toHaveBeenCalledWith(
            "/admin/login"
        );
        expect(result.current.submitError).toBeNull();
    });

    it("ログアウトが401以外で失敗した場合は担当者情報を残す", async () => {
        saveLoggedInAdmin(loggedInAdmin);
        mockLogout.mockRejectedValue(
            new AdminLogoutError(
                "ログアウトできませんでした。",
                500
            )
        );
        const { result } = renderHook(() =>
            useAdminLogout()
        );

        await act(async () => {
            await result.current.handleLogout();
        });

        expect(loadLoggedInAdmin()).toEqual(
            loggedInAdmin
        );
        expect(mockReplace).not.toHaveBeenCalled();
        expect(result.current.submitError).toBe(
            "ログアウトできませんでした。"
        );
    });
});
