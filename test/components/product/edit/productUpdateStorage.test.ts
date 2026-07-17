// @vitest-environment jsdom

import {
    clearProductForUpdate,
    loadProductForUpdate,
    saveProductForUpdate,
} from "@/components/product/edit/productUpdateStorage";
import type { Product } from "@/models/Product";
import { beforeEach, describe, expect, it } from "vitest";

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
});
