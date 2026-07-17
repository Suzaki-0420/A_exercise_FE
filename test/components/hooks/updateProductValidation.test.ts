import {
    isProductUuid,
    validateUpdateProduct,
} from "@/components/hooks/updateProductValidation";
import type { Product } from "@/models/Product";
import { describe, expect, it } from "vitest";

const createProduct = (
    overrides: Partial<Product> = {}
): Product => ({
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
    ...overrides,
});

describe("isProductUuid", () => {
    it("サンプルデータのUUID形式を有効と判定する", () => {
        expect(
            isProductUuid(
                "10000000-0000-0000-0000-000000000001"
            )
        ).toBe(true);
    });

    it("空のUUIDと不正な文字列を無効と判定する", () => {
        expect(
            isProductUuid(
                "00000000-0000-0000-0000-000000000000"
            )
        ).toBe(false);
        expect(isProductUuid("invalid-product-id")).toBe(false);
    });
});

describe("validateUpdateProduct", () => {
    it("有効な入力ではエラーを返さない", () => {
        expect(validateUpdateProduct(createProduct())).toEqual({});
    });

    it("必須項目が未入力の場合は項目別エラーを返す", () => {
        const result = validateUpdateProduct(
            createProduct({
                name: "",
                price: Number.NaN,
                productCategory: null,
                productStock: null,
            })
        );

        expect(result).toEqual({
            name: "商品名を入力してください。",
            price: "価格を入力してください。",
            stockQuantity: "数量を入力してください。",
            categoryUuid: "カテゴリを選択してください。",
        });
    });

    it("価格と数量が上限を超えた場合は範囲エラーを返す", () => {
        const result = validateUpdateProduct(
            createProduct({
                price: 1_000_001,
                productStock: {
                    stockUuid: "stock-uuid",
                    quantity: 1_001,
                },
            })
        );

        expect(result).toMatchObject({
            price: "価格は100万円以下で入力してください。",
            stockQuantity:
                "数量は1000個以下で入力してください。",
        });
    });

    it("負数と小数は数値形式エラーを返す", () => {
        const negativeResult = validateUpdateProduct(
            createProduct({
                price: -1,
                productStock: {
                    stockUuid: "stock-uuid",
                    quantity: -1,
                },
            })
        );
        const decimalResult = validateUpdateProduct(
            createProduct({
                price: 100.5,
                productStock: {
                    stockUuid: "stock-uuid",
                    quantity: 1.5,
                },
            })
        );

        expect(negativeResult).toMatchObject({
            price: "正しい価格形式で入力してください。",
            stockQuantity:
                "正しい数量形式で入力してください。",
        });
        expect(decimalResult).toEqual(negativeResult);
    });
});
