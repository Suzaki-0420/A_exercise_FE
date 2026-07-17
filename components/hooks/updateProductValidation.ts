import type { Product } from "@/models/Product";
import type { ProductUpdateFieldErrors } from "@/models/ProductUpdate";

const UUID_PATTERN =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMPTY_UUID = "00000000-0000-0000-0000-000000000000";

/**
 * 商品識別IDとして使用できるUUID形式かを判定する
 */
export const isProductUuid = (value: string): boolean =>
    UUID_PATTERN.test(value) && value.toLowerCase() !== EMPTY_UUID;

/**
 * BP009の商品修正入力値を検証する
 */
export const validateUpdateProduct = (
    product: Product
): ProductUpdateFieldErrors => {
    const errors: ProductUpdateFieldErrors = {};
    const name = product.name.trim();
    const stockQuantity =
        product.productStock?.quantity ?? Number.NaN;

    if (!name) {
        errors.name = "商品名を入力してください。";
    } else if (name.length < 2 || name.length > 20) {
        errors.name =
            "商品名は2～20文字で入力してください。";
    } else if (!/^[\p{L}\p{N}ー・\s]+$/u.test(name)) {
        errors.name =
            "商品名は全角・半角英数字で入力してください。";
    }

    if (Number.isNaN(product.price)) {
        errors.price = "価格を入力してください。";
    } else if (
        !Number.isInteger(product.price) ||
        product.price < 0
    ) {
        errors.price =
            "正しい価格形式で入力してください。";
    } else if (product.price > 1_000_000) {
        errors.price =
            "価格は100万円以下で入力してください。";
    }

    if (Number.isNaN(stockQuantity)) {
        errors.stockQuantity =
            "数量を入力してください。";
    } else if (
        !Number.isInteger(stockQuantity) ||
        stockQuantity < 0
    ) {
        errors.stockQuantity =
            "正しい数量形式で入力してください。";
    } else if (stockQuantity > 1_000) {
        errors.stockQuantity =
            "数量は1000個以下で入力してください。";
    }

    if (!product.productCategory?.categoryUuid) {
        errors.categoryUuid =
            "カテゴリを選択してください。";
    }

    return errors;
};
