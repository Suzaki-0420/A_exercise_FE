// @vitest-environment jsdom

import { AdminHeader } from "@/components/common/AdminHeader";
import { AdminHeaderNavigation } from "@/components/common/AdminHeaderNavigation";
import {
    cleanup,
    render,
    screen,
} from "@testing-library/react";
import {
    afterEach,
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from "vitest";

const { mockUsePathname } = vi.hoisted(() => ({
    mockUsePathname: vi.fn(),
}));

vi.mock("next/navigation", () => ({
    usePathname: mockUsePathname,
}));

vi.mock(
    "@/components/api/auth/logout/AdminLogoutButton",
    () => ({
        AdminLogoutButton: () => (
            <button type="button">ログアウト</button>
        ),
    })
);

describe("AdminHeaderNavigation", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        cleanup();
    });

    it("ログイン画面では管理機能へのリンクを表示しない", () => {
        mockUsePathname.mockReturnValue("/admin/login");

        render(<AdminHeaderNavigation />);

        expect(screen.queryAllByRole("link")).toHaveLength(
            0
        );
        expect(
            screen.queryByRole("button", {
                name: "ログアウト",
            })
        ).toBeNull();
    });

    it("ログイン画面以外では管理機能へのリンクを表示する", () => {
        mockUsePathname.mockReturnValue("/admin");

        render(<AdminHeaderNavigation />);

        expect(screen.getAllByRole("link")).toHaveLength(
            3
        );
        expect(
            screen.getByRole("button", {
                name: "ログアウト",
            })
        ).toBeTruthy();
    });

    it("管理画面タイトルから管理メニューへ遷移できる", () => {
        mockUsePathname.mockReturnValue("/admin/login");

        render(<AdminHeader />);

        expect(
            screen
                .getByRole("link", {
                    name: "フルネス文具 管理画面",
                })
                .getAttribute("href")
        ).toBe("/admin");
    });
});
