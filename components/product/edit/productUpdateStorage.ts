"use client";

import type { Product } from "@/models/Product";

const PRODUCT_UPDATE_STORAGE_KEY =
    "fullness:admin-product-update:selected-product";

const isRecord = (
    value: unknown
): value is Record<string, unknown> =>
    typeof value === "object" && value !== null;

const isProduct = (value: unknown): value is Product => {
    if (!isRecord(value)) {
        return false;
    }

    const category = value.productCategory;
    const stock = value.productStock;

    const hasValidCategory =
        category === null ||
        (isRecord(category) &&
            typeof category.categoryUuid === "string" &&
            typeof category.name === "string");
    const hasValidStock =
        stock === null ||
        (isRecord(stock) &&
            typeof stock.stockUuid === "string" &&
            typeof stock.quantity === "number" &&
            Number.isFinite(stock.quantity));

    return (
        typeof value.productUuid === "string" &&
        typeof value.name === "string" &&
        typeof value.price === "number" &&
        Number.isFinite(value.price) &&
        (value.imageUrl === null ||
            typeof value.imageUrl === "string") &&
        hasValidCategory &&
        hasValidStock &&
        typeof value.deleteFlg === "number"
    );
};

const getSessionStorage = (): Storage | null => {
    if (typeof window === "undefined") {
        return null;
    }

    try {
        return window.sessionStorage;
    } catch {
        return null;
    }
};

/**
 * 商品検索画面で選択した商品を修正画面へ引き継ぐ
 */
export const saveProductForUpdate = (
    product: Product
): void => {
    const storage = getSessionStorage();

    if (!storage) {
        throw new Error(
            "商品修正用の一時保存領域を利用できません。"
        );
    }

    storage.setItem(
        PRODUCT_UPDATE_STORAGE_KEY,
        JSON.stringify(product)
    );
};

/**
 * URLの商品UUIDと一致する引き継ぎ済み商品を取得する
 */
export const loadProductForUpdate = (
    productUuid: string
): Product | null => {
    const storage = getSessionStorage();

    if (!storage) {
        return null;
    }

    try {
        const storedValue = storage.getItem(
            PRODUCT_UPDATE_STORAGE_KEY
        );

        if (!storedValue) {
            return null;
        }

        const product: unknown = JSON.parse(storedValue);

        if (!isProduct(product)) {
            storage.removeItem(PRODUCT_UPDATE_STORAGE_KEY);
            return null;
        }

        return product.productUuid === productUuid
            ? product
            : null;
    } catch {
        return null;
    }
};

/**
 * 商品修正用に一時保存した商品を削除する
 */
export const clearProductForUpdate = (): void => {
    const storage = getSessionStorage();

    if (!storage) {
        return;
    }

    try {
        storage.removeItem(PRODUCT_UPDATE_STORAGE_KEY);
    } catch {
        // 保存領域を利用できない場合も画面遷移は継続する。
    }
};
