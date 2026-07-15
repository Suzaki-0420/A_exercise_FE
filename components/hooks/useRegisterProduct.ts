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
 * 商品登録フォームのエラー
 */
type ProductFormErrors = {
    name?: string;
    price?: string;
    stock?: string;
    quantity?: string;
    categoryUuid?: string;
    productCategory?: string;
    category?: string;
    image?: string;
    submit?: string;
    system?: string;
};

/**
 * 商品登録フォームの初期値を生成する
 */
const createInitialFormData = (): Product => ({
    productUuid: "",
    name: "",

    /*
     * 空欄と0円を区別するため、初期値はNaNにする。
     */
    price: Number.NaN,

    /*
     * imageUrlは画像登録後にバックエンドから返されるURL。
     * 選択中の画像ファイルはimageFileで別管理する。
     */
    imageUrl: null,

    productCategory: null,

    productStock: {
        stockUuid: "",
        quantity: Number.NaN,
    },

    deleteFlg: 0,
});

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

    const [formData, setFormData] =
        useState<Product>(createInitialFormData);

    const [categories, setCategories] =
        useState<ProductCategory[]>([]);

    const [errors, setErrors] =
        useState<ProductFormErrors>({});

    const [isLoading, setIsLoading] =
        useState(false);

    /**
     * 選択された画像ファイル
     */
    const [imageFile, setImageFile] =
        useState<File | null>(null);

    /**
     * 選択された画像のプレビューURL
     */
    const [imagePreviewUrl, setImagePreviewUrl] =
        useState<string | null>(null);

    /**
     * ファイル入力欄を初期化するためのkey
     */
    const [imageInputKey, setImageInputKey] =
        useState(0);

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
                const data =
                    await service.getCategories();

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
     * 画像プレビューURLを解放する
     */
    useEffect(() => {
        return () => {
            if (imagePreviewUrl) {
                URL.revokeObjectURL(
                    imagePreviewUrl
                );
            }
        };
    }, [imagePreviewUrl]);

    /**
     * 商品名を検証する
     *
     * 形式チェックを通過した場合だけ、
     * バックエンドへ重複確認を行う。
     */
    const validateName = useCallback(
        async (): Promise<boolean> => {
            const name = formData.name.trim();

            // 必須チェック
            if (!name) {
                setErrors((prev) => ({
                    ...prev,
                    name: "商品名を入力してください。",
                }));

                return false;
            }

            // 文字数チェック
            if (
                name.length < 2 ||
                name.length > 20
            ) {
                setErrors((prev) => ({
                    ...prev,
                    name:
                        "商品名は2〜20文字で入力してください。",
                }));

                return false;
            }

            /*
             * 日本語・全角英数字・半角英数字を許可する。
             *
             * \p{L}: 日本語を含む各言語の文字
             * \p{N}: 全角・半角を含む数字
             * ー・: 商品名で使用されやすい記号
             * \s: 商品名内部の空白
             */
            const namePattern =
                /^[\p{L}\p{N}ー・\s]+$/u;

            if (!namePattern.test(name)) {
                setErrors((prev) => ({
                    ...prev,
                    name:
                        "商品名は日本語または全角・半角英数字で入力してください。",
                }));

                return false;
            }

            try {
                /*
                 * DBを参照する必要があるため、
                 * 重複チェックだけバックエンドへ問い合わせる。
                 */
                await service.validateProductName(name);

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
                        : "商品名の重複確認に失敗しました。";

                setErrors((prev) => ({
                    ...prev,
                    name: message,
                }));

                return false;
            }
        },
        [formData.name, service]
    );

    /**
     * 単価を検証する
     */
    const validatePrice =
        useCallback((): boolean => {
            const price = formData.price;

            // 必須チェック
            if (Number.isNaN(price)) {
                setErrors((prev) => ({
                    ...prev,
                    price:
                        "価格を入力してください。",
                }));

                return false;
            }

            // 数値形式チェック
            if (
                !Number.isInteger(price) ||
                price < 0
            ) {
                setErrors((prev) => ({
                    ...prev,
                    price:
                        "正しい価格形式で入力してください。",
                }));

                return false;
            }

            // 範囲チェック
            if (price > 1_000_000) {
                setErrors((prev) => ({
                    ...prev,
                    price:
                        "価格は100万円以下で入力してください。",
                }));

                return false;
            }

            setErrors((prev) => {
                const newErrors = { ...prev };
                delete newErrors.price;

                return newErrors;
            });

            return true;
        }, [formData.price]);

    /**
     * 在庫数を検証する
     */
    const validateStock =
        useCallback((): boolean => {
            const stock =
                formData.productStock?.quantity;

            // 必須チェック
            if (
                stock === undefined ||
                Number.isNaN(stock)
            ) {
                setErrors((prev) => ({
                    ...prev,
                    stock:
                        "在庫数を入力してください。",
                }));

                return false;
            }

            // 数値形式チェック
            if (
                !Number.isInteger(stock) ||
                stock < 0
            ) {
                setErrors((prev) => ({
                    ...prev,
                    stock:
                        "正しい在庫数形式で入力してください。",
                }));

                return false;
            }

            // 範囲チェック
            if (stock > 1000) {
                setErrors((prev) => ({
                    ...prev,
                    stock:
                        "在庫数は1000個以下で入力してください。",
                }));

                return false;
            }

            setErrors((prev) => {
                const newErrors = { ...prev };

                delete newErrors.stock;
                delete newErrors.quantity;

                return newErrors;
            });

            return true;
        }, [formData.productStock?.quantity]);

    /**
     * 商品カテゴリを検証する
     */
    const validateCategory =
        useCallback((): boolean => {
            if (!formData.productCategory) {
                setErrors((prev) => ({
                    ...prev,
                    categoryUuid:
                        "カテゴリを選択してください。",
                }));

                return false;
            }

            setErrors((prev) => {
                const newErrors = { ...prev };

                delete newErrors.categoryUuid;
                delete newErrors.productCategory;
                delete newErrors.category;

                return newErrors;
            });

            return true;
        }, [formData.productCategory]);

    /**
     * 商品画像を検証する
     */
    const validateImage =
        useCallback((): boolean => {
            // 画像必須チェック
            if (!imageFile) {
                setErrors((prev) => ({
                    ...prev,
                    image:
                        "商品画像を選択してください。",
                }));

                return false;
            }

            /*
             * 許可する画像形式
             */
            const allowedTypes = [
                "image/jpeg",
                "image/png",
            ];

            if (
                !allowedTypes.includes(
                    imageFile.type
                )
            ) {
                setErrors((prev) => ({
                    ...prev,
                    image:
                        "商品画像はJPEGまたはPNG形式を選択してください。",
                }));

                return false;
            }

            /*
             * ファイルサイズ上限：5MB
             */
            const maxFileSize =
                5 * 1024 * 1024;

            if (imageFile.size > maxFileSize) {
                setErrors((prev) => ({
                    ...prev,
                    image:
                        "商品画像は5MB以下を選択してください。",
                }));

                return false;
            }

            setErrors((prev) => {
                const newErrors = { ...prev };
                delete newErrors.image;

                return newErrors;
            });

            return true;
        }, [imageFile]);

    /**
     * 商品名からフォーカスが外れた場合
     */
    const handleNameBlur =
        useCallback(async () => {
            await validateName();
        }, [validateName]);

    /**
     * 単価からフォーカスが外れた場合
     */
    const handlePriceBlur =
        useCallback(() => {
            validatePrice();
        }, [validatePrice]);

    /**
     * 在庫数からフォーカスが外れた場合
     */
    const handleStockBlur =
        useCallback(() => {
            validateStock();
        }, [validateStock]);

    /**
     * カテゴリからフォーカスが外れた場合
     */
    const handleCategoryBlur =
        useCallback(() => {
            validateCategory();
        }, [validateCategory]);

    /**
     * 商品名・価格などの変更処理
     */
    const handleChange = useCallback(
        (
            event: ChangeEvent<HTMLInputElement>
        ) => {
            const { name, value } = event.target;

            setFormData((prev) => ({
                ...prev,

                [name]:
                    name === "price"
                        ? value === ""
                            ? Number.NaN
                            : Number(value)
                        : value,
            }));

            setErrors((prev) => {
                const newErrors = { ...prev };

                delete newErrors[
                    name as keyof ProductFormErrors
                ];
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
        (
            event: ChangeEvent<HTMLInputElement>
        ) => {
            const { value } = event.target;

            setFormData((prev) => ({
                ...prev,

                productStock: {
                    stockUuid:
                        prev.productStock
                            ?.stockUuid ?? "",

                    quantity:
                        value === ""
                            ? Number.NaN
                            : Number(value),
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
            const selectedCategory =
                categories.find(
                    (category) =>
                        category.categoryUuid ===
                        categoryUuid
                );

            setFormData((prev) => ({
                ...prev,

                productCategory:
                    selectedCategory ?? null,
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
     * 商品画像の変更処理
     */
    const handleImageChange = useCallback(
        (
            event: ChangeEvent<HTMLInputElement>
        ) => {
            const file =
                event.target.files?.[0] ?? null;

            if (!file) {
                setImageFile(null);
                setImagePreviewUrl(null);

                return;
            }

            /*
             * 選択したFileを登録用に保持する。
             */
            setImageFile(file);

            /*
             * ブラウザ上でプレビュー表示するための
             * 一時URLを生成する。
             */
            const previewUrl =
                URL.createObjectURL(file);

            setImagePreviewUrl(previewUrl);

            setErrors((prev) => {
                const newErrors = { ...prev };

                delete newErrors.image;
                delete newErrors.submit;

                return newErrors;
            });
        },
        []
    );

    /**
     * 商品画像からフォーカスが外れた場合
     */
    const handleImageBlur =
        useCallback(() => {
            validateImage();
        }, [validateImage]);

    /**
     * フォームを初期状態へ戻す
     */
    const resetForm = useCallback(() => {
        setFormData(createInitialFormData());

        setImageFile(null);
        setImagePreviewUrl(null);

        /*
         * input type="file"の表示も初期化する。
         */
        setImageInputKey((prev) => prev + 1);

        setErrors({});
        setIsConfirmOpen(false);
    }, []);

    /**
     * 全項目の検証後、確認モーダルを開く
     */
    const openConfirmModal =
        useCallback(async () => {
            const isNameValid =
                await validateName();

            const isPriceValid =
                validatePrice();

            const isStockValid =
                validateStock();

            const isCategoryValid =
                validateCategory();

            const isImageValid =
                validateImage();

            if (
                !isNameValid ||
                !isPriceValid ||
                !isStockValid ||
                !isCategoryValid ||
                !isImageValid
            ) {
                return;
            }

            setErrors((prev) => {
                const newErrors = { ...prev };
                delete newErrors.submit;

                return newErrors;
            });

            setIsConfirmOpen(true);
        }, [
            validateName,
            validatePrice,
            validateStock,
            validateCategory,
            validateImage,
        ]);

    /**
     * 確認モーダルを閉じる
     */
    const closeConfirmModal =
        useCallback(() => {
            if (isLoading) {
                return;
            }

            setIsConfirmOpen(false);
        }, [isLoading]);

    /**
     * 商品登録処理
     */
    const handleRegisterProduct =
        useCallback(
            async (): Promise<Product | null> => {
                if (!imageFile) {
                    setErrors((prev) => ({
                        ...prev,
                        image:
                            "商品画像を選択してください。",
                    }));

                    return null;
                }

                setIsLoading(true);

                try {
                    /*
                     * Productと画像ファイルをServiceへ渡す。
                     */
                    return await service.registerProduct(
                        formData,
                        imageFile
                    );
                } catch (error: unknown) {
                    const message =
                        error instanceof Error
                            ? error.message
                            : "商品の登録に失敗しました。";

                    try {
                        const parsed =
                            JSON.parse(message);

                        if (
                            parsed.type ===
                            "validation"
                        ) {
                            const convertedErrors:
                                ProductFormErrors = {};

                            Object.entries(
                                parsed.errors
                            ).forEach(
                                ([key, value]) => {
                                    const normalizedKey =
                                        key
                                            .charAt(0)
                                            .toLowerCase() +
                                        key.slice(1);

                                    /*
                                     * バックエンド側の
                                     * Imageプロパティのエラーも
                                     * imageとして格納される。
                                     */
                                    convertedErrors[
                                        normalizedKey as keyof ProductFormErrors
                                    ] = String(value);
                                }
                            );

                            setErrors(
                                convertedErrors
                            );
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
            },
            [
                formData,
                imageFile,
                service,
            ]
        );

    /**
     * 確認モーダルから商品を登録する
     */
    const confirmRegisterProduct =
        useCallback(async () => {
            const result =
                await handleRegisterProduct();

            if (!result) {
                return;
            }

            setIsConfirmOpen(false);
            setIsToastVisible(true);

            setFormData(createInitialFormData());
            setImageFile(null);
            setImagePreviewUrl(null);

            /*
             * ファイル入力欄を初期化する。
             */
            setImageInputKey((prev) => prev + 1);

            setErrors({});
        }, [handleRegisterProduct]);

    /**
     * トーストを閉じる
     */
    const closeToast = useCallback(() => {
        setIsToastVisible(false);
    }, []);

    /**
     * 入力項目にバリデーションエラーがあるか
     */
    const hasValidationErrors = Boolean(
        errors.name ||
        errors.price ||
        errors.stock ||
        errors.quantity ||
        errors.categoryUuid ||
        errors.productCategory ||
        errors.category ||
        errors.image ||
        errors.system
    );

    return {
        formData,
        categories,
        errors,
        isLoading,
        isConfirmOpen,
        isToastVisible,
        hasValidationErrors,

        imageFile,
        imagePreviewUrl,
        imageInputKey,

        handleChange,
        handleStockChange,
        handleCategoryChange,
        handleImageChange,

        handleNameBlur,
        handlePriceBlur,
        handleStockBlur,
        handleCategoryBlur,
        handleImageBlur,

        openConfirmModal,
        closeConfirmModal,
        confirmRegisterProduct,
        closeToast,
        resetForm,
    };
};