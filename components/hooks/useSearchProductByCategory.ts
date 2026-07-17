import { container } from "@/di/container";
import { TYPES } from "@/di/types";
import { ISearchProductByCategoryService } from "@/interfaces/ISearchProductByCategoryService";
import { Product } from "@/models/Product";
import {
    useCallback,
    useMemo,
    useState,
} from "react";

/**
 * 商品カテゴリ検索のStateと操作を提供するカスタムフック
 */
export const useSearchProductByCategory = () => {
    // 検索結果
    const [products, setProducts] =
        useState<Product[]>([]);

    // 通信中フラグ
    const [isLoading, setIsLoading] =
        useState<boolean>(false);

    // エラーメッセージ
    const [error, setError] =
        useState<string | null>(null);

    /**
     * DIコンテナからカテゴリ検索Serviceを取得する。
     * 再レンダーのたびに取得し直さないように
     * useMemoを使用する。
     */
    const searchService =
        useMemo<ISearchProductByCategoryService>(
            () =>
                container.get<ISearchProductByCategoryService>(
                    TYPES.ISearchProductByCategoryService
                ),
            []
        );

    /**
     * 商品カテゴリによる検索を実行する。
     *
     * categoryUuidが空文字の場合は、
     * カテゴリ未指定として全商品を取得する。
     *
     * @param categoryUuid 商品カテゴリUUID
     * @param showDeletedOnly 削除済み商品のみ取得するか
     */
    const search = useCallback(
        async (
            categoryUuid: string,
            showDeletedOnly: boolean
        ): Promise<void> => {
            setIsLoading(true);
            setError(null);

            try {
                const result =
                    await searchService.execute(
                        categoryUuid,
                        showDeletedOnly
                    );

                setProducts(result);
            } catch (e: unknown) {
                const message =
                    e instanceof Error
                        ? e.message
                        : "商品カテゴリによる検索に失敗しました。";

                setError(message);
                setProducts([]);
            } finally {
                setIsLoading(false);
            }
        },
        [searchService]
    );

    return {
        products,
        isLoading,
        error,
        search,
    };
};