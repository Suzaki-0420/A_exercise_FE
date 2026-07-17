import { container } from "@/di/container";
import { TYPES } from "@/di/types";

import type { Product } from "@/models/Product";
import type { ISearchProductByCategoryService } from "@/interfaces/ISearchProductByCategoryService";

import {
    useCallback,
    useMemo,
    useState,
} from "react";

/**
 * 商品をカテゴリで検索するカスタムフック
 */
export const useSearchProductByCategory = () => {
    /**
     * カテゴリ検索結果
     */
    const [products, setProducts] =
        useState<Product[]>([]);

    /**
     * 通信中フラグ
     */
    const [isLoading, setIsLoading] =
        useState<boolean>(false);

    /**
     * エラーメッセージ
     */
    const [error, setError] =
        useState<string | null>(null);

    /**
     * カテゴリ検索Service
     */
    const service =
        useMemo<ISearchProductByCategoryService>(
            () =>
                container.get<ISearchProductByCategoryService>(
                    TYPES.ISearchProductByCategoryService
                ),
            []
        );

    /**
     * 商品カテゴリで商品を検索する
     *
     * categoryUuidが空文字の場合は、
     * 全カテゴリの商品を取得する。
     */
    const search = useCallback(
        async (
            categoryUuid: string,
            showDeletedOnly: boolean
        ): Promise<void> => {
            setIsLoading(true);
            setError(null);

            try {
                console.log(
                    "カテゴリ検索UUID:",
                    categoryUuid
                );

                const data =
                    await service.execute(
                        categoryUuid,
                        showDeletedOnly
                    );

                setProducts(data);
            } catch (e: unknown) {
                const message =
                    e instanceof Error
                        ? e.message
                        : "カテゴリによる商品検索に失敗しました。";

                console.error(
                    "カテゴリ商品検索エラー:",
                    e
                );

                setError(message);
                setProducts([]);
            } finally {
                setIsLoading(false);
            }
        },
        [service]
    );

    return {
        products,
        isLoading,
        error,
        search,
    };
};