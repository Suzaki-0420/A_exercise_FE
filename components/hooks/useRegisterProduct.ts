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

    const [formData, setFormData] = useState<Product>({
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

    const [categories, setCategories] =
        useState<ProductCategory[]>([]);

    const [errors, setErrors] =
        useState<{ [key: string]: string }>({});

    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    /**
     * フォームを初期状態に戻す
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
        setIsSuccess(false);
    }, []);

    /**
     * 商品カテゴリ一覧を取得する
     */
    useEffect(() => {
        const getCategories = async () => {
            try {
                const data = await service.getCategories();
                setCategories(data);
            } catch {
                setErrors((prev) => ({
                    ...prev,
                    system: "商品カテゴリ一覧の取得に失敗しました。",
                }));
            }
        };

        getCategories();
    }, [service]);

    /**
     * 商品名・価格・画像URLの変更処理
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
     * 商品登録処理
     */
    const handleRegisterProduct =
        useCallback(async (): Promise<Product | null> => {
            setIsLoading(true);
            setIsSuccess(false);

            try {
                const result =
                    await service.registerProduct(formData);

                setIsSuccess(true);

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

                        Object.entries(parsed.errors).forEach(
                            ([key, value]) => {
                                const normalizedKey =
                                    key.charAt(0).toLowerCase() +
                                    key.slice(1);

                                convertedErrors[normalizedKey] =
                                    String(value);
                            }
                        );

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

    return {
        formData,
        categories,
        errors,
        isLoading,
        isSuccess,
        handleChange,
        handleStockChange,
        handleCategoryChange,
        handleNameBlur,
        handleRegisterProduct,
        resetForm,
    };
};