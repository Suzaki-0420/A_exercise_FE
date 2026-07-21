// @vitest-environment jsdom

import {
    clearProductForUpdate,
    loadProductForUpdate,
    saveProductForUpdate,
} from "@/components/product/edit/productUpdateStorage";
import type { Product } from "@/models/Product";
import {
    afterEach,
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from "vitest";

const product: Product = {
    productUuid: "10000000-0000-0000-0000-000000000001",
    name: "水性ボールペン黒",
    price: 120,
    imageUrl: null,
    productCategory: {
        categoryUuid: "e50d978b-b73d-4afb-8e85-ace9cf1e12a7",
        name: "文房具",
    },
    productStock: {
        stockUuid: "20000000-0000-0000-0000-000000000001",
        quantity: 80,
    },
    deleteFlg: 0,
};

describe("productUpdateStorage", () => {
    beforeEach(() => {
        sessionStorage.clear();
    });

    afterEach(() => {
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
    });

    it("選択した商品を保存して同じUUIDで取得できる", () => {
        saveProductForUpdate(product);

        expect(
            loadProductForUpdate(product.productUuid)
        ).toEqual(product);
    });

    it("URLの商品UUIDと保存商品のUUIDが異なる場合は取得しない", () => {
        saveProductForUpdate(product);

        expect(
            loadProductForUpdate(
                "10000000-0000-0000-0000-000000000002"
            )
        ).toBeNull();
    });

    it("不正な保存データは利用しない", () => {
        saveProductForUpdate(product);
        const storageKey = sessionStorage.key(0);

        expect(storageKey).not.toBeNull();
        sessionStorage.setItem(
            storageKey!,
            JSON.stringify({ productUuid: product.productUuid })
        );

        expect(
            loadProductForUpdate(product.productUuid)
        ).toBeNull();
    });

    it("保存した商品を削除できる", () => {
        saveProductForUpdate(product);

        clearProductForUpdate();

        expect(
            loadProductForUpdate(product.productUuid)
        ).toBeNull();
    });

    it("保存値がない場合は商品を返さない", () => {
        expect(
            loadProductForUpdate(product.productUuid)
        ).toBeNull();
    });

    it("JSON形式が不正な場合は商品を返さない", () => {
        saveProductForUpdate(product);
        const storageKey = sessionStorage.key(0)!;
        sessionStorage.setItem(storageKey, "{");

        expect(
            loadProductForUpdate(product.productUuid)
        ).toBeNull();
    });

    it("画像URL・カテゴリ・在庫がnullでも商品を復元できる", () => {
        const productWithoutRelations: Product = {
            ...product,
            imageUrl: "https://example.com/product.png",
            productCategory: null,
            productStock: null,
        };
        saveProductForUpdate(productWithoutRelations);

        expect(
            loadProductForUpdate(
                productWithoutRelations.productUuid
            )
        ).toEqual(productWithoutRelations);
    });

    it.each([
        ["null", null],
        ["配列", []],
        ["商品UUID不正", { ...product, productUuid: 1 }],
        ["商品名不正", { ...product, name: 1 }],
        ["価格不正", { ...product, price: "120" }],
        ["画像URL不正", { ...product, imageUrl: 1 }],
        ["削除フラグ不正", { ...product, deleteFlg: "0" }],
        ["カテゴリ型不正", { ...product, productCategory: 1 }],
        [
            "カテゴリUUID不正",
            {
                ...product,
                productCategory: {
                    categoryUuid: 1,
                    name: "文房具",
                },
            },
        ],
        [
            "カテゴリ名不正",
            {
                ...product,
                productCategory: {
                    categoryUuid: "category-uuid",
                    name: 1,
                },
            },
        ],
        ["在庫型不正", { ...product, productStock: 1 }],
        [
            "在庫UUID不正",
            {
                ...product,
                productStock: {
                    stockUuid: 1,
                    quantity: 80,
                },
            },
        ],
        [
            "在庫数型不正",
            {
                ...product,
                productStock: {
                    stockUuid: "stock-uuid",
                    quantity: "80",
                },
            },
        ],
    ])("%sの保存データは利用しない", (_name, value) => {
        saveProductForUpdate(product);
        const storageKey = sessionStorage.key(0)!;
        sessionStorage.setItem(
            storageKey,
            JSON.stringify(value)
        );

        expect(
            loadProductForUpdate(product.productUuid)
        ).toBeNull();
    });

    it("有限でない価格と在庫数は利用しない", () => {
        saveProductForUpdate(product);

        vi.spyOn(JSON, "parse")
            .mockReturnValueOnce({
                ...product,
                price: Number.POSITIVE_INFINITY,
            })
            .mockReturnValueOnce({
                ...product,
                productStock: {
                    ...product.productStock!,
                    quantity: Number.POSITIVE_INFINITY,
                },
            });

        expect(
            loadProductForUpdate(product.productUuid)
        ).toBeNull();
        saveProductForUpdate(product);
        expect(
            loadProductForUpdate(product.productUuid)
        ).toBeNull();
    });

    it("ブラウザ外では保存できず、取得と削除は安全に終了する", () => {
        vi.stubGlobal("window", undefined);

        expect(() => saveProductForUpdate(product)).toThrow(
            "商品修正用の一時保存領域を利用できません。"
        );
        expect(
            loadProductForUpdate(product.productUuid)
        ).toBeNull();
        expect(() => clearProductForUpdate()).not.toThrow();
    });

    it("保存領域を取得できない場合も取得と削除は安全に終了する", () => {
        vi.spyOn(window, "sessionStorage", "get").mockImplementation(
            () => {
                throw new Error("storage unavailable");
            }
        );

        expect(() => saveProductForUpdate(product)).toThrow(
            "商品修正用の一時保存領域を利用できません。"
        );
        expect(
            loadProductForUpdate(product.productUuid)
        ).toBeNull();
        expect(() => clearProductForUpdate()).not.toThrow();
    });

    it("保存領域の削除に失敗しても画面処理を継続する", () => {
        vi.spyOn(
            Storage.prototype,
            "removeItem"
        ).mockImplementation(() => {
            throw new Error("remove failed");
        });

        expect(() => clearProductForUpdate()).not.toThrow();
    });
});
