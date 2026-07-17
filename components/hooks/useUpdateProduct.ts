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
    productUuid?: string
) => {
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
        useState<string | null>(() =>
            createImagePreviewUrl(initialImageFile)
        );
    const imagePreviewUrlRef =
        useRef<string | null>(imagePreviewUrl);
    const [fieldErrors, setFieldErrors] =
        useState<ProductUpdateFieldErrors>({});
    const [submitError, setSubmitError] =
        useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(
        Boolean(productUuid)
    );

    useEffect(
        () => () => {
            revokeImagePreviewUrl(
                imagePreviewUrlRef.current
            );
        },
        []
    );

    useEffect(() => {
        if (!productUuid) {
            return;
        }

        let isActive = true;
        let redirectTimer: number | null = null;

        const initializeProduct = async () => {
            if (!isProductUuid(productUuid)) {
                if (isActive) {
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
                }
                return;
            }

            const selectedProduct =
                draft?.productUuid === productUuid
                    ? draft
                    : loadProductForUpdate(productUuid);

            if (!selectedProduct) {
                if (isActive) {
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
                }
                return;
            }

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
    }, [draft, productUuid, router, service]);

    const handleChange = useCallback(
        (
            event: ChangeEvent<
                HTMLInputElement | HTMLSelectElement
            >
        ) => {
            const { name, value } = event.target;

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

            revokeImagePreviewUrl(
                imagePreviewUrlRef.current
            );

            const nextPreviewUrl =
                createImagePreviewUrl(nextImageFile);

            imagePreviewUrlRef.current = nextPreviewUrl;
            setImageFile(nextImageFile);
            setImagePreviewUrl(nextPreviewUrl);
            setFieldErrors((previous) => ({
                ...previous,
                image: undefined,
            }));
            setSubmitError(null);
        },
        []
    );

    const handleProceedToConfirm = useCallback(
        (event: FormEvent<HTMLFormElement>) => {
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

            const normalizedProduct = {
                ...formData,
                name: formData.name.trim(),
            };

            saveDraft(normalizedProduct, imageFile);
            router.push(PRODUCT_CONFIRM_PATH);
        },
        [formData, imageFile, router, saveDraft]
    );

    const handleUpdate = useCallback(async () => {
        if (!draft) {
            router.replace(PRODUCT_SEARCH_PATH);
            return;
        }

        setIsLoading(true);
        setSubmitError(null);

        try {
            const result =
                await service.updateProduct(
                    draft,
                    imageFile
                );
            setCompletedResult(result);
            clearProductForUpdate();
            router.push(PRODUCT_COMPLETE_PATH);
        } catch (error: unknown) {
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
        } finally {
            setIsLoading(false);
        }
    }, [
        draft,
        imageFile,
        router,
        service,
        setCompletedResult,
    ]);

    const handleBackToInput = useCallback(() => {
        if (!draft) {
            router.replace(PRODUCT_SEARCH_PATH);
            return;
        }

        router.push(
            `/admin/product/edit/${encodeURIComponent(draft.productUuid)}`
        );
    }, [draft, router]);

    const handleCancel = useCallback(() => {
        clearFlow();
        clearProductForUpdate();
        router.push(PRODUCT_SEARCH_PATH);
    }, [clearFlow, router]);

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
        handleProceedToConfirm,
        handleUpdate,
        handleBackToInput,
        handleCancel,
        handleInvalidFlow,
        handleLeaveComplete,
    };
};
