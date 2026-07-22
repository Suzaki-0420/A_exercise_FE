"use client";

import { useUpdateProductContext } from "@/components/product/edit/UpdateProductContext";
import {
    clearProductForUpdate,
    loadProductForUpdate,
} from "@/components/product/edit/productUpdateStorage";
import { container } from "@/di/container";
import { TYPES } from "@/di/types";
import type { IUpdateProductService } from "@/interfaces/IUpdateProductService";
import type { Product } from "@/models/Product";
import type { ProductCategory } from "@/models/ProductCategory";
import {
    ProductUpdateError,
    type ProductUpdateFieldErrors,
    type ProductUpdateResult,
} from "@/models/ProductUpdate";
import {
    isProductUuid,
    validateUpdateProduct,
} from "@/components/hooks/updateProductValidation";
import { useRouter } from "next/navigation";
import {
    type ChangeEvent,
    type FormEvent,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";

const PRODUCT_SEARCH_PATH = "/admin/product";
const PRODUCT_CONFIRM_PATH =
    "/admin/product/edit/confirm";
const PRODUCT_COMPLETE_PATH =
    "/admin/product/edit/complete";

/**
 * 商品修正フローの完了時に行う画面固有の処理
 */
export type UseUpdateProductOptions = {
    initialProduct?: Product;
    onProceedToConfirm?: () => void;
    onUpdateSuccess?: (
        result: ProductUpdateResult
    ) => void | Promise<void>;
    onUpdatePendingChange?: (
        isPending: boolean
    ) => void;
    onBackToInput?: () => void;
    onCancel?: () => void;
};

const createImagePreviewUrl = (
    imageFile: File | null
): string | null => {
    if (
        !imageFile ||
        typeof URL === "undefined" ||
        typeof URL.createObjectURL !== "function"
    ) {
        return null;
    }

    return URL.createObjectURL(imageFile);
};

const revokeImagePreviewUrl = (
    previewUrl: string | null
): void => {
    if (
        previewUrl &&
        typeof URL !== "undefined" &&
        typeof URL.revokeObjectURL === "function"
    ) {
        URL.revokeObjectURL(previewUrl);
    }
};

/**
 * 商品修正画面用カスタムフック
 */
export const useUpdateProduct = (
    productUuid?: string,
    options: UseUpdateProductOptions = {}
) => {
    const {
        initialProduct,
        onProceedToConfirm,
        onUpdateSuccess,
        onUpdatePendingChange,
        onBackToInput,
        onCancel,
    } = options;
    const router = useRouter();
    const service = useMemo(
        () =>
            container.get<IUpdateProductService>(
                TYPES.IUpdateProductService
            ),
        []
    );
    const {
        draft,
        imageFile: draftImageFile,
        completedResult,
        saveDraft,
        setCompletedResult,
        clearFlow,
    } = useUpdateProductContext();

    const [formData, setFormData] =
        useState<Product | null>(
            draft?.productUuid === productUuid
                ? draft
                : initialProduct?.productUuid ===
                    productUuid
                    ? initialProduct ?? null
                    : null
        );
    const [categories, setCategories] =
        useState<ProductCategory[]>([]);
    const initialImageFile =
        draft &&
        (!productUuid || draft.productUuid === productUuid)
            ? draftImageFile
            : null;
    const [imageFile, setImageFile] =
        useState<File | null>(initialImageFile);
    const [imagePreviewUrl, setImagePreviewUrl] =
        useState<string | null>(null);
    const [fieldErrors, setFieldErrors] =
        useState<ProductUpdateFieldErrors>({});
    const [submitError, setSubmitError] =
        useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(
        Boolean(productUuid)
    );
    const originalProductNameRef =
        useRef<string | null>(null);
    const currentProductNameRef = useRef("");
    const validatedProductNameRef =
        useRef<string | null>(null);
    const pendingNameValidationRef = useRef<{
        name: string;
        promise: Promise<boolean>;
    } | null>(null);

    useEffect(() => {
        let nextPreviewUrl: string | null = null;
        const previewTimer = window.setTimeout(() => {
            nextPreviewUrl =
                createImagePreviewUrl(imageFile);

            setImagePreviewUrl(nextPreviewUrl);
        }, 0);

        return () => {
            window.clearTimeout(previewTimer);
            revokeImagePreviewUrl(nextPreviewUrl);
        };
    }, [imageFile]);

    useEffect(() => {
        if (!productUuid) {
            return;
        }

        let isActive = true;
        let redirectTimer: number | null = null;

        const initializeProduct = async () => {
            if (!isProductUuid(productUuid)) {
                setSubmitError(
                    "指定された商品は存在しません。商品検索画面へ戻ります。"
                );
                setIsLoading(false);
                redirectTimer = window.setTimeout(
                    () =>
                        router.replace(
                            PRODUCT_SEARCH_PATH
                        ),
                    1500
                );
                return;
            }

            const storedProduct =
                loadProductForUpdate(productUuid);
            const selectedProduct =
                draft?.productUuid === productUuid
                    ? draft
                    : initialProduct?.productUuid ===
                        productUuid
                        ? initialProduct
                        : storedProduct;

            if (!selectedProduct) {
                setSubmitError(
                    "商品検索画面から修正する商品を選択してください。商品検索画面へ戻ります。"
                );
                setIsLoading(false);
                redirectTimer = window.setTimeout(
                    () =>
                        router.replace(
                            PRODUCT_SEARCH_PATH
                        ),
                    1500
                );
                return;
            }

            const originalProduct =
                initialProduct?.productUuid ===
                    productUuid
                    ? initialProduct
                    : storedProduct ?? selectedProduct;
            originalProductNameRef.current =
                originalProduct.name.trim();
            currentProductNameRef.current =
                selectedProduct.name;
            validatedProductNameRef.current =
                originalProduct.name.trim();

            try {
                const productCategories =
                    await service.getCategories();

                if (!isActive) {
                    return;
                }

                setFormData(selectedProduct);
                setCategories(productCategories);
            } catch (error: unknown) {
                if (!isActive) {
                    return;
                }

                if (
                    error instanceof ProductUpdateError &&
                    error.status === 401
                ) {
                    router.replace("/admin/login");
                    router.refresh();
                    return;
                }

                setFormData(null);
                setCategories([]);
                setSubmitError(
                    "商品修正画面の表示に必要な情報を取得できませんでした。"
                );
            } finally {
                if (isActive) {
                    setIsLoading(false);
                }
            }
        };

        void initializeProduct();

        return () => {
            isActive = false;
            if (redirectTimer) {
                window.clearTimeout(redirectTimer);
            }
        };
    }, [
        draft,
        initialProduct,
        productUuid,
        router,
        service,
    ]);

    const handleChange = useCallback(
        (
            event: ChangeEvent<
                HTMLInputElement | HTMLSelectElement
            >
        ) => {
            const { name, value } = event.target;

            if (name === "name") {
                currentProductNameRef.current = value;
                validatedProductNameRef.current = null;
            }

            setFormData((previous) => {
                if (!previous) {
                    return previous;
                }

                switch (name) {
                    case "name":
                        return {
                            ...previous,
                            name: value,
                        };
                    case "price":
                        return {
                            ...previous,
                            price:
                                value === ""
                                    ? Number.NaN
                                    : Number(value),
                        };
                    case "stockQuantity":
                        return {
                            ...previous,
                            productStock: {
                                stockUuid:
                                    previous.productStock
                                        ?.stockUuid ?? "",
                                quantity:
                                    value === ""
                                        ? Number.NaN
                                        : Number(value),
                            },
                        };
                    case "categoryUuid": {
                        const category = categories.find(
                            (item) =>
                                item.categoryUuid === value
                        ) ?? null;
                        return {
                            ...previous,
                            productCategory: category,
                        };
                    }
                    default:
                        return previous;
                }
            });

            setFieldErrors((previous) => ({
                ...previous,
                [name]: undefined,
            }));
            setSubmitError(null);
        },
        [categories]
    );

    const handleImageChange = useCallback(
        (event: ChangeEvent<HTMLInputElement>) => {
            const nextImageFile =
                event.target.files?.[0] ?? null;

            setImageFile(nextImageFile);
            setFieldErrors((previous) => ({
                ...previous,
                image: undefined,
            }));
            setSubmitError(null);
        },
        []
    );

    /**
     * 指定された入力項目を検証する
     */
    const validateField = useCallback(
        (fieldName: keyof ProductUpdateFieldErrors) => {
            if (!formData) {
                return;
            }

            const validationErrors =
                validateUpdateProduct(
                    formData,
                    imageFile
                );

            setFieldErrors((previous) => ({
                ...previous,
                [fieldName]: validationErrors[fieldName],
            }));
        },
        [formData, imageFile]
    );

    /**
     * 商品名の形式と重複を確認する
     */
    const validateName = useCallback(
        async (): Promise<boolean> => {
            if (!formData) {
                return false;
            }

            const validationError =
                validateUpdateProduct(
                    formData,
                    imageFile
                ).name;

            if (validationError) {
                setFieldErrors((previous) => ({
                    ...previous,
                    name: validationError,
                }));
                return false;
            }

            const normalizedName =
                formData.name.trim();

            if (
                normalizedName ===
                    originalProductNameRef.current ||
                normalizedName ===
                    validatedProductNameRef.current
            ) {
                setFieldErrors((previous) => ({
                    ...previous,
                    name: undefined,
                }));
                return true;
            }

            const pendingValidation =
                pendingNameValidationRef.current;

            if (
                pendingValidation?.name === normalizedName
            ) {
                return await pendingValidation.promise;
            }

            const validationPromise = (async () => {
                try {
                    await service.validateProductName(
                        normalizedName
                    );

                    if (
                        currentProductNameRef.current.trim() !==
                        normalizedName
                    ) {
                        return false;
                    }

                    validatedProductNameRef.current =
                        normalizedName;
                    setFieldErrors((previous) => ({
                        ...previous,
                        name: undefined,
                    }));
                    return true;
                } catch (error: unknown) {
                    if (
                        currentProductNameRef.current.trim() ===
                        normalizedName
                    ) {
                        setFieldErrors((previous) => ({
                            ...previous,
                            name:
                                error instanceof Error
                                    ? error.message
                                    : "商品名の重複確認に失敗しました。",
                        }));
                    }

                    validatedProductNameRef.current = null;
                    return false;
                } finally {
                    if (
                        pendingNameValidationRef.current
                            ?.name === normalizedName
                    ) {
                        pendingNameValidationRef.current =
                            null;
                    }
                }
            })();

            pendingNameValidationRef.current = {
                name: normalizedName,
                promise: validationPromise,
            };

            return await validationPromise;
        },
        [formData, imageFile, service]
    );

    /**
     * 商品名からフォーカスが外れた場合
     */
    const handleNameBlur = useCallback(async () => {
        await validateName();
    }, [validateName]);

    /**
     * 単価からフォーカスが外れた場合
     */
    const handlePriceBlur = useCallback(() => {
        validateField("price");
    }, [validateField]);

    /**
     * 在庫数からフォーカスが外れた場合
     */
    const handleStockBlur = useCallback(() => {
        validateField("stockQuantity");
    }, [validateField]);

    /**
     * 商品カテゴリからフォーカスが外れた場合
     */
    const handleCategoryBlur = useCallback(() => {
        validateField("categoryUuid");
    }, [validateField]);

    /**
     * 商品画像からフォーカスが外れた場合
     */
    const handleImageBlur = useCallback(() => {
        validateField("image");
    }, [validateField]);

    const handleProceedToConfirm = useCallback(
        async (event: FormEvent<HTMLFormElement>) => {
            event.preventDefault();

            if (!formData) {
                return;
            }

            const validationErrors =
                validateUpdateProduct(
                    formData,
                    imageFile
                );

            if (Object.keys(validationErrors).length > 0) {
                setFieldErrors(validationErrors);
                setSubmitError(null);
                return;
            }

            const isNameValid = await validateName();

            if (!isNameValid) {
                return;
            }

            const normalizedProduct = {
                ...formData,
                name: formData.name.trim(),
            };

            saveDraft(normalizedProduct, imageFile);

            if (onProceedToConfirm) {
                onProceedToConfirm();
                return;
            }

            router.push(PRODUCT_CONFIRM_PATH);
        },
        [
            formData,
            imageFile,
            router,
            saveDraft,
            validateName,
            onProceedToConfirm,
        ]
    );

    const handleUpdate = useCallback(async () => {
        if (!draft) {
            router.replace(PRODUCT_SEARCH_PATH);
            return;
        }

        setIsLoading(true);
        setSubmitError(null);
        onUpdatePendingChange?.(true);

        let result: ProductUpdateResult;
        try {
            result = await service.updateProduct(
                draft,
                imageFile
            );
        } catch (error: unknown) {
            setIsLoading(false);
            onUpdatePendingChange?.(false);

            if (error instanceof ProductUpdateError) {
                if (error.status === 401) {
                    router.replace("/admin/login");
                    router.refresh();
                    return;
                }

                setFieldErrors(error.fieldErrors);
                setSubmitError(error.message);
            } else {
                setSubmitError(
                    "商品情報の修正に失敗しました。管理者に連絡してください。"
                );
            }
            return;
        }

        setCompletedResult(result);
        clearProductForUpdate();

        try {
            if (onUpdateSuccess) {
                await onUpdateSuccess(result);
                return;
            }

            router.push(PRODUCT_COMPLETE_PATH);
        } catch {
            setSubmitError(
                "商品情報の修正は完了しましたが、商品一覧を再取得できませんでした。商品検索画面を再読み込みしてください。"
            );
        } finally {
            setIsLoading(false);
            onUpdatePendingChange?.(false);
        }
    }, [
        draft,
        imageFile,
        router,
        service,
        setCompletedResult,
        onUpdateSuccess,
        onUpdatePendingChange,
    ]);

    const handleBackToInput = useCallback(() => {
        if (!draft) {
            router.replace(PRODUCT_SEARCH_PATH);
            return;
        }

        if (onBackToInput) {
            onBackToInput();
            return;
        }

        router.push(
            `/admin/product/edit/${encodeURIComponent(draft.productUuid)}`
        );
    }, [draft, onBackToInput, router]);

    const handleCancel = useCallback(() => {
        clearFlow();
        clearProductForUpdate();

        if (onCancel) {
            onCancel();
            return;
        }

        router.push(PRODUCT_SEARCH_PATH);
    }, [clearFlow, onCancel, router]);

    const handleInvalidFlow = useCallback(
        (destination: "/admin" | "/admin/product") => {
            clearFlow();
            clearProductForUpdate();
            router.replace(destination);
        },
        [clearFlow, router]
    );

    const handleLeaveComplete = useCallback(
        (destination: "/admin" | "/admin/product") => {
            clearProductForUpdate();
            router.push(destination);
        },
        [router]
    );

    return {
        formData,
        categories,
        imageFile,
        imagePreviewUrl,
        fieldErrors,
        submitError,
        isLoading,
        draft,
        completedResult,
        handleChange,
        handleImageChange,
        handleNameBlur,
        handlePriceBlur,
        handleStockBlur,
        handleCategoryBlur,
        handleImageBlur,
        handleProceedToConfirm,
        handleUpdate,
        handleBackToInput,
        handleCancel,
        handleInvalidFlow,
        handleLeaveComplete,
    };
};
