import { container } from "@/di/container";
import { TYPES } from "@/di/types";
import type { IRegisterProductService } from "@/interfaces/IRegisterProductService";
import type { ProductCategory } from "@/models/ProductCategory";

import { useEffect, useMemo, useState } from "react";

/**
 * 商品カテゴリ一覧を取得するカスタムフック
 */
export const useProductCategories = () => {
  // 商品カテゴリ一覧
  const [categories, setCategories] = useState<ProductCategory[]>([]);

  // 通信中フラグ
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // エラーメッセージ
  const [error, setError] = useState<string | null>(null);

  /**
   * カテゴリ一覧取得処理を持つServiceを取得する
   */
  const service = useMemo<IRegisterProductService>(
    () => container.get<IRegisterProductService>(TYPES.IRegisterProductService),
    [],
  );

  /**
   * 初回表示時に商品カテゴリ一覧を取得する
   */
  useEffect(() => {
    const getCategories = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const data = await service.getCategories();

        setCategories(data);
      } catch (e: unknown) {
        const message =
          e instanceof Error
            ? e.message
            : "商品カテゴリ一覧の取得に失敗しました。";

        setError(message);
        setCategories([]);
      } finally {
        setIsLoading(false);
      }
    };

    void getCategories();
  }, [service]);

  return {
    categories,
    isLoading,
    error,
  };
};
