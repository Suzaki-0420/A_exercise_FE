// @vitest-environment jsdom

import { AdminLoginForm } from "@/components/api/auth/login/AdminLoginForm";
import { AdminLogoutButton } from "@/components/api/auth/logout/AdminLogoutButton";
import {
    cleanup,
    fireEvent,
    render,
    screen,
} from "@testing-library/react";
import type { ChangeEvent, FormEvent } from "react";
import {
    afterEach,
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from "vitest";

const {
    loginHookState,
    logoutHookState,
    mockUsePathname,
} = vi.hoisted(() => ({
    loginHookState: {
        credentials: {
            accountName: "",
            password: "",
        },
        fieldErrors: {},
        submitError: null as string | null,
        isLoading: false,
        handleChange: vi.fn<
            (event: ChangeEvent<HTMLInputElement>) => void
        >(),
        handleSubmit: vi.fn<
            (event: FormEvent<HTMLFormElement>) => void
        >(),
    },
    logoutHookState: {
        isLoading: false,
        submitError: null as string | null,
        handleLogout: vi.fn(),
    },
    mockUsePathname: vi.fn(),
}));

vi.mock("@/components/hooks/useAdminLogin", () => ({
    useAdminLogin: () => loginHookState,
}));

vi.mock("@/components/hooks/useAdminLogout", () => ({
    useAdminLogout: () => logoutHookState,
}));

vi.mock("next/navigation", () => ({
    usePathname: mockUsePathname,
}));

describe("担当者認証コンポーネント", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        Object.assign(loginHookState, {
            credentials: {
                accountName: "",
                password: "",
            },
            fieldErrors: {},
            submitError: null,
            isLoading: false,
        });
        Object.assign(logoutHookState, {
            isLoading: false,
            submitError: null,
        });
        mockUsePathname.mockReturnValue("/admin");
    });

    afterEach(() => {
        cleanup();
    });

    it("ログインフォームの入力と送信をHookへ渡す", () => {
        render(<AdminLoginForm />);

        fireEvent.change(
            screen.getByLabelText("アカウント名"),
            {
                target: {
                    name: "accountName",
                    value: "yamada01",
                },
            }
        );
        fireEvent.submit(
            screen.getByRole("button", {
                name: "ログイン",
            }).closest("form")!
        );

        expect(
            loginHookState.handleChange
        ).toHaveBeenCalledTimes(1);
        expect(
            loginHookState.handleSubmit
        ).toHaveBeenCalledTimes(1);
    });

    it("ログイン中の表示と項目・送信エラーを表示する", () => {
        Object.assign(loginHookState, {
            credentials: {
                accountName: "invalid",
                password: "invalid",
            },
            fieldErrors: {
                accountName: "アカウント名エラー",
                password: "パスワードエラー",
            },
            submitError: "ログインエラー",
            isLoading: true,
        });

        render(<AdminLoginForm />);

        expect(
            screen.getByText("ログインエラー")
        ).toBeTruthy();
        expect(
            screen.getByText("アカウント名エラー")
        ).toBeTruthy();
        expect(
            screen.getByText("パスワードエラー")
        ).toBeTruthy();
        expect(
            (
                screen.getByRole("button", {
                    name: "ログイン中...",
                }) as HTMLButtonElement
            ).disabled
        ).toBe(true);
    });

    it("ログアウトボタンの操作とエラーを表示する", () => {
        logoutHookState.submitError =
            "ログアウトエラー";

        render(<AdminLogoutButton />);
        fireEvent.click(
            screen.getByRole("button", {
                name: "ログアウト",
            })
        );

        expect(
            logoutHookState.handleLogout
        ).toHaveBeenCalledTimes(1);
        expect(
            screen.getByRole("alert").textContent
        ).toBe("ログアウトエラー");
    });

    it("ログイン画面ではログアウトボタンを操作対象外にする", () => {
        mockUsePathname.mockReturnValue("/admin/login");

        const { container } = render(
            <AdminLogoutButton />
        );
        const button = container.querySelector("button")!;

        expect(button.disabled).toBe(true);
        expect(button.getAttribute("aria-hidden")).toBe(
            "true"
        );
        expect(button.tabIndex).toBe(-1);
    });

    it("ログアウト中はボタンを無効化して進行状況を表示する", () => {
        logoutHookState.isLoading = true;

        render(<AdminLogoutButton />);

        expect(
            (
                screen.getByRole("button", {
                    name: "ログアウト中...",
                }) as HTMLButtonElement
            ).disabled
        ).toBe(true);
    });
});
