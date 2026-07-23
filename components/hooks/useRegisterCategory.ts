"use client";

import { container } from "@/di/container";
import { TYPES } from "@/di/types";
import type { IRegisterCategoryService } from "@/interfaces/IRegisterCategoryService";
import type { ProductCategory } from "@/models/ProductCategory";
import {
  type ChangeEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

/**
 * カテゴリー登録フォームのエラー
 */
type CategoryFormErrors = {
  name?: string;
  submit?: string;
  system?: string;
};

/**
 * カテゴリー登録フォームの初期値を生成する
 */
const createInitialFormData = (): ProductCategory => ({
  categoryUuid: "",
  name: "",
});

/**
 * カテゴリー登録画面用カスタムフック
 */
export const useRegisterCategory = () => {
  const service = useMemo(
    () =>
      container.get<IRegisterCategoryService>(TYPES.IRegisterCategoryService),
    [],
  );

  const [formData, setFormData] = useState<ProductCategory>(
    createInitialFormData,
  );

  const [errors, setErrors] = useState<CategoryFormErrors>({});

  const [isLoading, setIsLoading] = useState(false);

  /**
   * 確認モーダルの表示状態
   */
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  /**
   * 登録完了トーストの表示状態
   */
  const [isToastVisible, setIsToastVisible] = useState(false);

  /**
   * トーストを3秒後に閉じる
   */
  useEffect(() => {
    if (!isToastVisible) {
      return;
    }

    const timerId = window.setTimeout(() => {
      setIsToastVisible(false);
    }, 3000);

    return () => {
      window.clearTimeout(timerId);
    };
  }, [isToastVisible]);

  /**
   * カテゴリー名を検証する
   *
   * 形式チェックを通過した場合だけ、
   * バックエンドへ重複確認を行う。
   */
  const validateName = useCallback(async (): Promise<boolean> => {
    const name = formData.name.trim();

    // 必須チェック
    if (!name) {
      setErrors((prev) => ({
        ...prev,
        name: "カテゴリー名を入力してください。",
      }));

      return false;
    }

    // 文字数チェック
    if (name.length > 30) {
      setErrors((prev) => ({
        ...prev,
        name: "カテゴリー名は30文字以内で入力してください。",
      }));

      return false;
    }

    /*
     * 日本語・全角英数字・半角英数字を許可する。
     *
     * \p{L}: 日本語を含む各言語の文字
     * \p{N}: 全角・半角を含む数字
     * ー・: カテゴリー名で使用されやすい記号
     * \s: カテゴリー名内部の空白
     */
    const namePattern = /^[\p{L}\p{N}ー・\s]+$/u;

    if (!namePattern.test(name)) {
      setErrors((prev) => ({
        ...prev,
        name: "カテゴリー名は日本語または全角・半角英数字で入力してください。",
      }));

      return false;
    }

    try {
      /*
       * DBを参照する必要があるため、
       * 重複チェックだけバックエンドへ問い合わせる。
       */
      await service.validateCategoryName(name);

      setErrors((prev) => {
        const newErrors = { ...prev };

        delete newErrors.name;

        return newErrors;
      });

      return true;
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "カテゴリー名の重複確認に失敗しました。";

      setErrors((prev) => ({
        ...prev,
        name: message,
      }));

      return false;
    }
  }, [formData.name, service]);

  /**
   * カテゴリー名の変更処理
   */
  const handleChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setErrors((prev) => {
      const newErrors = { ...prev };

      delete newErrors[name as keyof CategoryFormErrors];
      delete newErrors.submit;

      return newErrors;
    });
  }, []);

  /**
   * カテゴリー名からフォーカスが外れた場合
   */
  const handleNameBlur = useCallback(async () => {
    await validateName();
  }, [validateName]);

  /**
   * フォームを初期状態へ戻す
   */
  const resetForm = useCallback(() => {
    setFormData(createInitialFormData());
    setErrors({});
    setIsConfirmOpen(false);
  }, []);

  /**
   * 入力内容の検証後、確認モーダルを開く
   */
  const openConfirmModal = useCallback(async () => {
    const isNameValid = await validateName();

    if (!isNameValid) {
      return;
    }

    setFormData((prev) => ({
      ...prev,
      name: prev.name.trim(),
    }));

    setErrors((prev) => {
      const newErrors = { ...prev };

      delete newErrors.submit;

      return newErrors;
    });

    setIsConfirmOpen(true);
  }, [validateName]);

  /**
   * 確認モーダルを閉じる
   */
  const closeConfirmModal = useCallback(() => {
    if (isLoading) {
      return;
    }

    setIsConfirmOpen(false);
  }, [isLoading]);

  /**
   * カテゴリー登録処理
   */
  const handleRegisterCategory =
    useCallback(async (): Promise<ProductCategory | null> => {
      setIsLoading(true);

      try {
        return await service.registerCategory({
          ...formData,
          name: formData.name.trim(),
        });
      } catch (error: unknown) {
        const message =
          error instanceof Error
            ? error.message
            : "カテゴリーの登録に失敗しました。";

        try {
          const parsed = JSON.parse(message) as {
            type?: string;
            errors?: Record<string, unknown>;
          };

          if (parsed.type === "validation" && parsed.errors) {
            const convertedErrors: CategoryFormErrors = {};

            Object.entries(parsed.errors).forEach(([key, value]) => {
              const normalizedKey = key.charAt(0).toLowerCase() + key.slice(1);

              convertedErrors[normalizedKey as keyof CategoryFormErrors] =
                String(value);
            });

            setErrors(convertedErrors);
          } else {
            setErrors({
              submit: message,
            });
          }
        } catch {
          setErrors({
            submit: message,
          });
        }

        return null;
      } finally {
        setIsLoading(false);
      }
    }, [formData, service]);

  /**
   * 確認モーダルからカテゴリーを登録する
   */
  const confirmRegisterCategory = useCallback(async () => {
    const result = await handleRegisterCategory();

    if (!result) {
      return;
    }

    setIsConfirmOpen(false);
    setIsToastVisible(true);

    setFormData(createInitialFormData());

    setErrors({});
  }, [handleRegisterCategory]);

  /**
   * トーストを閉じる
   */
  const closeToast = useCallback(() => {
    setIsToastVisible(false);
  }, []);

  /**
   * 入力項目にバリデーションエラーがあるか
   */
  const hasValidationErrors = Boolean(errors.name || errors.system);

  return {
    formData,
    errors,
    isLoading,
    isConfirmOpen,
    isToastVisible,
    hasValidationErrors,

    handleChange,
    handleNameBlur,

    openConfirmModal,
    closeConfirmModal,
    confirmRegisterCategory,
    closeToast,
    resetForm,
  };
};
