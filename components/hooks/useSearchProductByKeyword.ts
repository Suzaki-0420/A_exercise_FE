import { container } from "@/di/container";
import { TYPES } from "@/di/types";
import { ISearchProductByCategoryService } from "@/interfaces/ISearchProductByCategoryService";
import { Product } from "@/models/Product";
import {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";

/**
 * 商品カテゴリ検索のStateと操作を提供するカスタムフック
 */
export const useSearchProductByCategory = () => {
    // 検索結果
    const [products, setProducts] = useState<Product[]>([]);

    // 通信中フラグ
    const [isLoading, setIsLoading] = useState<boolean>(false);

    // エラーメッセージ
    const [error, setError] = useState<string | null>(null);

    // 削除済み商品の表示フラグ
    const [showDeletedOnly, setShowDeletedOnly] =
        useState<boolean>(false);

    /**
     * DIコンテナからカテゴリ検索Serviceを取得する。
     * 再レンダーのたびに取得し直さないようにuseMemoを使用する。
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
     * 商品カテゴリによる検索を実行する
     *
     * categoryUuidが空文字の場合は全商品を取得する。
     */
    const search = useCallback(
        async (categoryUuid: string) => {
            setIsLoading(true);
            setError(null);

            try {
                const result = await searchService.execute(
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
        [searchService, showDeletedOnly]
    );

    /**
     * 初回表示時と、削除済み表示の切り替え時に検索する。
     *
     * 空文字を渡すことで、カテゴリ未指定として全商品を取得する。
     */
    useEffect(() => {
        void search("");
    }, [search]);

    return {
        products,
        isLoading,
        error,
        search,
        showDeletedOnly,
        setShowDeletedOnly,
    };
};