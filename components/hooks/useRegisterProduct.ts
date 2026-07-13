"use client";

import { container } from "@/di/container";
import { TYPES } from "@/di/types";
import type { IRegisterProductService } from "@/interfaces/IRegisterProductService";
import type { Product } from "@/models/Product";
import type { ProductCategory } from "@/models/ProductCategory";
import {
    type ChangeEvent,
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";

/**
 * 商品登録画面用カスタムフック
 */
export const useRegisterProduct = () => {
    const service = useMemo(
        () =>
            container.get<IRegisterProductService>(
                TYPES.IRegisterProductService
            ),
        []
    );

    /**
     * フォーム初期値
     */
    const initialFormData: Product = {
        productUuid: "",
        name: "",
        price: 0,
        imageUrl: null,
        productCategory: null,
        productStock: {
            stockUuid: "",
            quantity: 0,
        },
        deleteFlg: 0,
    };

    const [formData, setFormData] =
        useState<Product>(initialFormData);

    const [categories, setCategories] =
        useState<ProductCategory[]>([]);

    const [errors, setErrors] =
        useState<{ [key: string]: string }>({});

    const [isLoading, setIsLoading] = useState(false);

    /**
     * 確認モーダルの表示状態
     */
    const [isConfirmOpen, setIsConfirmOpen] =
        useState(false);

    /**
     * 登録完了トーストの表示状態
     */
    const [isToastVisible, setIsToastVisible] =
        useState(false);

    /**
     * 商品カテゴリ一覧を取得する
     */
    useEffect(() => {
        const getCategories = async () => {
            try {
                const data = await service.getCategories();
                setCategories(data);
            } catch (error: unknown) {
                const message =
                    error instanceof Error
                        ? error.message
                        : "商品カテゴリ一覧の取得に失敗しました。";

                console.error(
                    "商品カテゴリ一覧取得エラー:",
                    error
                );

                setErrors((prev) => ({
                    ...prev,
                    system: message,
                }));
            }
        };

        getCategories();
    }, [service]);

    /**
     * トーストを3秒後に自動で閉じる
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
     * フォームを初期状態へ戻す
     */
    const resetForm = useCallback(() => {
        setFormData({
            productUuid: "",
            name: "",
            price: 0,
            imageUrl: null,
            productCategory: null,
            productStock: {
                stockUuid: "",
                quantity: 0,
            },
            deleteFlg: 0,
        });

        setErrors({});
        setIsConfirmOpen(false);
    }, []);

    /**
     * 商品名・価格などの変更処理
     */
    const handleChange = useCallback(
        (event: ChangeEvent<HTMLInputElement>) => {
            const { name, value } = event.target;

            setFormData((prev) => ({
                ...prev,
                [name]:
                    name === "price"
                        ? Number(value)
                        : name === "imageUrl"
                            ? value || null
                            : value,
            }));

            setErrors((prev) => {
                const newErrors = { ...prev };

                delete newErrors[name];
                delete newErrors.submit;

                return newErrors;
            });
        },
        []
    );

    /**
     * 在庫数の変更処理
     */
    const handleStockChange = useCallback(
        (event: ChangeEvent<HTMLInputElement>) => {
            const quantity = Number(event.target.value);

            setFormData((prev) => ({
                ...prev,
                productStock: {
                    stockUuid:
                        prev.productStock?.stockUuid ?? "",
                    quantity,
                },
            }));

            setErrors((prev) => {
                const newErrors = { ...prev };

                delete newErrors.stock;
                delete newErrors.quantity;
                delete newErrors.submit;

                return newErrors;
            });
        },
        []
    );

    /**
     * 商品カテゴリの変更処理
     */
    const handleCategoryChange = useCallback(
        (categoryUuid: string) => {
            const selectedCategory = categories.find(
                (category) =>
                    category.categoryUuid === categoryUuid
            );

            setFormData((prev) => ({
                ...prev,
                productCategory: selectedCategory ?? null,
            }));

            setErrors((prev) => {
                const newErrors = { ...prev };

                delete newErrors.categoryUuid;
                delete newErrors.productCategory;
                delete newErrors.category;
                delete newErrors.submit;

                return newErrors;
            });
        },
        [categories]
    );

    /**
     * 商品名の重複確認
     */
    const handleNameBlur = useCallback(async () => {
        if (!formData.name.trim()) {
            return;
        }

        try {
            setErrors((prev) => {
                const newErrors = { ...prev };

                delete newErrors.name;

                return newErrors;
            });

        } catch (error: unknown) {
            const message =
                error instanceof Error
                    ? error.message
                    : "商品名の確認に失敗しました。";

            setErrors((prev) => ({
                ...prev,
                name: message,
            }));
        }
    }, [formData.name, service]);

    /**
     * 確認モーダルを開く前の入力チェック
     */
    const openConfirmModal = useCallback(() => {
        const validationErrors: {
            [key: string]: string;
        } = {};

        if (!formData.name.trim()) {
            validationErrors.name =
                "商品名を入力してください。";
        }

        if (formData.price < 0) {
            validationErrors.price =
                "単価は0以上で入力してください。";
        }

        if (
            (formData.productStock?.quantity ?? 0) < 0
        ) {
            validationErrors.stock =
                "在庫数は0以上で入力してください。";
        }

        if (!formData.productCategory) {
            validationErrors.categoryUuid =
                "商品カテゴリを選択してください。";
        }

        if (
            Object.keys(validationErrors).length > 0
        ) {
            setErrors((prev) => ({
                ...prev,
                ...validationErrors,
            }));

            return;
        }

        setErrors((prev) => {
            const newErrors = { ...prev };

            delete newErrors.submit;

            return newErrors;
        });

        setIsConfirmOpen(true);
    }, [formData]);

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
     * 商品登録処理
     */
    const handleRegisterProduct =
        useCallback(async (): Promise<Product | null> => {
            setIsLoading(true);

            try {
                const result =
                    await service.registerProduct(formData);

                return result;
            } catch (error: unknown) {
                const message =
                    error instanceof Error
                        ? error.message
                        : "商品の登録に失敗しました。";

                try {
                    const parsed = JSON.parse(message);

                    if (parsed.type === "validation") {
                        const convertedErrors: {
                            [key: string]: string;
                        } = {};

                        Object.entries(
                            parsed.errors
                        ).forEach(([key, value]) => {
                            const normalizedKey =
                                key
                                    .charAt(0)
                                    .toLowerCase() +
                                key.slice(1);

                            convertedErrors[
                                normalizedKey
                            ] = String(value);
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
     * 確認モーダルから商品を登録する
     */
    const confirmRegisterProduct =
        useCallback(async () => {
            const result =
                await handleRegisterProduct();

            if (!result) {
                /*
                 * 登録失敗時はモーダルを残し、
                 * エラーメッセージを表示する。
                 */
                return;
            }

            setIsConfirmOpen(false);
            setIsToastVisible(true);

            setFormData({
                productUuid: "",
                name: "",
                price: 0,
                imageUrl: null,
                productCategory: null,
                productStock: {
                    stockUuid: "",
                    quantity: 0,
                },
                deleteFlg: 0,
            });

            setErrors({});
        }, [handleRegisterProduct]);

    /**
     * トーストを閉じる
     */
    const closeToast = useCallback(() => {
        setIsToastVisible(false);
    }, []);

    return {
        formData,
        categories,
        errors,
        isLoading,
        isConfirmOpen,
        isToastVisible,
        handleChange,
        handleStockChange,
        handleCategoryChange,
        handleNameBlur,
        openConfirmModal,
        closeConfirmModal,
        confirmRegisterProduct,
        closeToast,
        resetForm,
    };
};