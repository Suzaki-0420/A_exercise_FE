// @vitest-environment jsdom

import {
    clearLoggedInAdmin,
    getLoggedInAdminSnapshot,
    loadLoggedInAdmin,
    parseLoggedInAdmin,
    saveLoggedInAdmin,
    subscribeLoggedInAdmin,
} from "@/components/api/auth/adminSessionStorage";
import type { LoggedInAdmin } from "@/models/AdminAuth";
import {
    afterEach,
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from "vitest";

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

    afterEach(() => {
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
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

    it.each([
        ["保存値なし", null],
        ["JSON形式不正", "{"],
        ["null", "null"],
        ["配列", "[]"],
        [
            "accountUuid不正",
            JSON.stringify({
                ...loggedInAdmin,
                accountUuid: 1,
            }),
        ],
        [
            "accountName不正",
            JSON.stringify({
                ...loggedInAdmin,
                accountName: 1,
            }),
        ],
        [
            "employeeName不正",
            JSON.stringify({
                ...loggedInAdmin,
                employeeName: 1,
            }),
        ],
    ])("%sは担当者情報として復元しない", (_name, value) => {
        expect(parseLoggedInAdmin(value)).toBeNull();
    });

    it("ブラウザ外では保存・取得・削除を行わない", () => {
        vi.stubGlobal("window", undefined);

        expect(() =>
            saveLoggedInAdmin(loggedInAdmin)
        ).not.toThrow();
        expect(getLoggedInAdminSnapshot()).toBeNull();
        expect(() => clearLoggedInAdmin()).not.toThrow();
        expect(loadLoggedInAdmin()).toBeNull();
        expect(
            subscribeLoggedInAdmin(vi.fn())()
        ).toBeUndefined();
    });

    it("保存領域を取得できない場合は処理を継続する", () => {
        vi.spyOn(window, "sessionStorage", "get").mockImplementation(
            () => {
                throw new Error("storage unavailable");
            }
        );

        expect(() =>
            saveLoggedInAdmin(loggedInAdmin)
        ).not.toThrow();
        expect(getLoggedInAdminSnapshot()).toBeNull();
        expect(() => clearLoggedInAdmin()).not.toThrow();
    });

    it("保存領域の読み書き・削除に失敗しても認証処理を止めない", () => {
        vi.spyOn(Storage.prototype, "setItem").mockImplementation(
            () => {
                throw new Error("write failed");
            }
        );
        expect(() =>
            saveLoggedInAdmin(loggedInAdmin)
        ).not.toThrow();
        vi.restoreAllMocks();

        vi.spyOn(Storage.prototype, "getItem").mockImplementation(
            () => {
                throw new Error("read failed");
            }
        );
        expect(getLoggedInAdminSnapshot()).toBeNull();
        vi.restoreAllMocks();

        vi.spyOn(
            Storage.prototype,
            "removeItem"
        ).mockImplementation(() => {
            throw new Error("remove failed");
        });
        expect(() => clearLoggedInAdmin()).not.toThrow();
    });

    it("担当者情報の変更イベントを購読し、解除できる", () => {
        const onStoreChange = vi.fn();
        const unsubscribe =
            subscribeLoggedInAdmin(onStoreChange);

        window.dispatchEvent(
            new StorageEvent("storage", {
                key: "unrelated-key",
            })
        );
        expect(onStoreChange).not.toHaveBeenCalled();

        window.dispatchEvent(
            new StorageEvent("storage", {
                key: sessionStorage.key(0),
            })
        );
        saveLoggedInAdmin(loggedInAdmin);
        expect(onStoreChange).toHaveBeenCalledTimes(1);

        const storageKey = sessionStorage.key(0);
        window.dispatchEvent(
            new StorageEvent("storage", {
                key: storageKey,
            })
        );
        expect(onStoreChange).toHaveBeenCalledTimes(2);

        unsubscribe();
        saveLoggedInAdmin(loggedInAdmin);
        expect(onStoreChange).toHaveBeenCalledTimes(2);
    });
});
