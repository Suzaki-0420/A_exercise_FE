import { container } from "@/di/container";
import { TYPES } from "@/di/types";
import { ISearchProductByKeywordService } from "@/interfaces/ISearchProductByKeywordService";
import { Product } from "@/models/Product";
import { useCallback, useMemo, useState } from "react";

/**
 * キーワードによる商品検索の
 * Stateと操作を提供するカスタムフック
 */
export const useSearchProductByKeyword = () => {
  // 検索結果
  const [products, setProducts] = useState<Product[]>([]);

  // 通信中フラグ
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // エラーメッセージ
  const [error, setError] = useState<string | null>(null);

  /**
   * DIコンテナからServiceを取得する。
   * 再レンダーのたびに取得し直さないように
   * useMemoを使用する。
   */
  const searchService = useMemo<ISearchProductByKeywordService>(
    () =>
      container.get<ISearchProductByKeywordService>(
        TYPES.ISearchProductByKeywordService,
      ),
    [],
  );

  /**
   * キーワードで商品を検索する
   *
   * @param keyword 検索キーワード
   * @param showDeletedOnly 削除済み商品のみ取得するか
   */
  const search = useCallback(
    async (keyword: string, showDeletedOnly: boolean): Promise<void> => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await searchService.execute(keyword, showDeletedOnly);

        setProducts(result);
      } catch (e: unknown) {
        const message =
          e instanceof Error ? e.message : "商品の検索に失敗しました。";

        setError(message);
        setProducts([]);
      } finally {
        setIsLoading(false);
      }
    },
    [searchService],
  );

  return {
    products,
    isLoading,
    error,
    search,
  };
};
