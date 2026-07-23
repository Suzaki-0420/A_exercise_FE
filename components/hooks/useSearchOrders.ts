"use client";

import { container } from "@/di/container";
import { TYPES } from "@/di/types";
import type { ISearchOrdersService } from "@/interfaces/ISearchOrdersService";
import {
  type ChangeEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { OrderSearchItem } from "@/models/OrderSearchItem";

/**
 * 購入履歴検索条件
 */
type SearchOrdersFormData = {
  orderDate: string;
  customerAccountName: string;
};

/**
 * 購入履歴検索画面のエラー
 */
type SearchOrdersErrors = {
  orderDate?: string;
  customerAccountName?: string;
  submit?: string;
  system?: string;
};

/**
 * 検索条件の初期値を生成する
 */
const createInitialFormData = (): SearchOrdersFormData => ({
  orderDate: "",
  customerAccountName: "",
});

/**
 * 現在日をYYYY-MM-DD形式で取得する
 */
const getToday = (): string => {
  const currentDate = new Date();

  const localDate = new Date(
    currentDate.getTime() - currentDate.getTimezoneOffset() * 60 * 1000,
  );

  return localDate.toISOString().slice(0, 10);
};

/**
 * 購入履歴検索画面用カスタムフック
 */
export const useSearchOrders = () => {
  const service = useMemo(
    () => container.get<ISearchOrdersService>(TYPES.ISearchOrdersService),
    [],
  );

  const [formData, setFormData] = useState<SearchOrdersFormData>(
    createInitialFormData,
  );

  const [orders, setOrders] = useState<OrderSearchItem[]>([]);

  const [errors, setErrors] = useState<SearchOrdersErrors>({});

  const [isLoading, setIsLoading] = useState(true);

  /**
   * 条件検索を実行したか
   */
  const [hasSearched, setHasSearched] = useState(false);

  const today = getToday();

  /**
   * すべての購入履歴を取得する
   */
  const loadAllOrders = useCallback(async (): Promise<void> => {
    setIsLoading(true);

    try {
      const result = await service.findAll();

      setOrders(result);
      setErrors({});
      setHasSearched(false);
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "購入履歴一覧の取得に失敗しました。";

      setOrders([]);

      setErrors({
        system: message,
      });
    } finally {
      setIsLoading(false);
    }
  }, [service]);

  /**
   * 初期表示時に購入履歴を全件取得する
   */
  /**
   * 初期表示時に購入履歴を全件取得する
   */
  useEffect(() => {
    let isActive = true;

    const initializeOrders = async (): Promise<void> => {
      try {
        const result = await service.findAll();

        if (!isActive) {
          return;
        }

        setOrders(result);
        setErrors({});
        setHasSearched(false);
      } catch (error: unknown) {
        if (!isActive) {
          return;
        }

        const message =
          error instanceof Error
            ? error.message
            : "購入履歴一覧の取得に失敗しました。";

        setOrders([]);

        setErrors({
          system: message,
        });
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    void initializeOrders();

    return () => {
      isActive = false;
    };
  }, [service]);

  /**
   * 検索条件を検証する
   */
  const validateSearchConditions = useCallback((): boolean => {
    const validationErrors: SearchOrdersErrors = {};

    if (formData.orderDate && formData.orderDate > today) {
      validationErrors.orderDate = "購入日に未来日は指定できません。";
    }

    const customerAccountName = formData.customerAccountName.trim();

    if (customerAccountName.length > 20) {
      validationErrors.customerAccountName =
        "顧客アカウント名は20文字以内で入力してください。";
    }

    setErrors(validationErrors);

    return Object.keys(validationErrors).length === 0;
  }, [formData.customerAccountName, formData.orderDate, today]);

  /**
   * 検索条件の変更処理
   */
  const handleChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setErrors((prev) => {
      const newErrors = {
        ...prev,
      };

      delete newErrors[name as keyof SearchOrdersErrors];
      delete newErrors.submit;

      return newErrors;
    });
  }, []);

  /**
   * 条件を指定して購入履歴を検索する
   */
  const handleSearch = useCallback(async (): Promise<void> => {
    const isValid = validateSearchConditions();

    if (!isValid) {
      return;
    }

    setIsLoading(true);

    try {
      const orderDate = formData.orderDate;

      const customerAccountName = formData.customerAccountName.trim();

      /*
       * 検索条件が両方空の場合は
       * 全件取得APIを呼び出す。
       */
      const result =
        !orderDate && !customerAccountName
          ? await service.findAll()
          : await service.searchOrders(orderDate, customerAccountName);

      setOrders(result);
      setHasSearched(Boolean(orderDate || customerAccountName));
      setErrors({});
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "購入履歴の検索に失敗しました。";

      setErrors({
        submit: message,
      });
    } finally {
      setIsLoading(false);
    }
  }, [
    formData.customerAccountName,
    formData.orderDate,
    service,
    validateSearchConditions,
  ]);

  /**
   * 検索条件を初期化して全件取得する
   */
  const resetSearch = useCallback(async (): Promise<void> => {
    setFormData(createInitialFormData());
    setErrors({});

    await loadAllOrders();
  }, [loadAllOrders]);

  /**
   * 検索結果メッセージ
   */
  const resultMessage = useMemo(() => {
    if (isLoading) {
      return "購入履歴を取得しています。";
    }

    if (errors.system) {
      return "";
    }

    if (orders.length === 0) {
      return hasSearched
        ? "検索条件に一致する購入履歴はありません。"
        : "注文が登録されていません。";
    }

    return `${orders.length}件の購入履歴があります。`;
  }, [errors.system, hasSearched, isLoading, orders.length]);

  /**
   * 入力項目にエラーがあるか
   */
  const hasValidationErrors = Boolean(
    errors.orderDate || errors.customerAccountName,
  );

  return {
    formData,
    orders,
    errors,
    isLoading,
    today,
    resultMessage,
    hasValidationErrors,

    handleChange,
    handleSearch,
    resetSearch,
  };
};
