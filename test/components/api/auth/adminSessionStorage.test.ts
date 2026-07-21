// @vitest-environment jsdom

import {
    clearLoggedInAdmin,
    loadLoggedInAdmin,
    saveLoggedInAdmin,
} from "@/components/api/auth/adminSessionStorage";
import type { LoggedInAdmin } from "@/models/AdminAuth";
import { beforeEach, describe, expect, it } from "vitest";

const loggedInAdmin: LoggedInAdmin = {
    accountUuid:
        "10000000-0000-0000-0000-000000000001",
    accountName: "yamada01",
    employeeName: "山田太郎",
};

describe("adminSessionStorage", () => {
    beforeEach(() => {
        sessionStorage.clear();
    });

    it("ログインした担当者情報を保存して取得できる", () => {
        saveLoggedInAdmin(loggedInAdmin);

        expect(loadLoggedInAdmin()).toEqual(
            loggedInAdmin
        );
    });

    it("不正な保存データは利用しない", () => {
        saveLoggedInAdmin(loggedInAdmin);
        const storageKey = sessionStorage.key(0);

        expect(storageKey).not.toBeNull();
        sessionStorage.setItem(
            storageKey!,
            JSON.stringify({ accountName: "yamada01" })
        );

        expect(loadLoggedInAdmin()).toBeNull();
        expect(sessionStorage.length).toBe(0);
    });

    it("ログアウト時に担当者情報を削除できる", () => {
        saveLoggedInAdmin(loggedInAdmin);

        clearLoggedInAdmin();

        expect(loadLoggedInAdmin()).toBeNull();
    });
});
