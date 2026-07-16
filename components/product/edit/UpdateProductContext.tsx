"use client";

import type { Product } from "@/models/Product";
import type { ProductUpdateResult } from "@/models/ProductUpdate";
import {
    createContext,
    type ReactNode,
    useCallback,
    useContext,
    useMemo,
    useState,
} from "react";

type UpdateProductContextValue = {
    draft: Product | null;
    imageFile: File | null;
    completedResult: ProductUpdateResult | null;
    saveDraft: (
        product: Product,
        imageFile: File | null
    ) => void;
    setCompletedResult: (
        result: ProductUpdateResult
    ) => void;
    clearFlow: () => void;
};

const UpdateProductContext =
    createContext<UpdateProductContextValue | null>(null);

/**
 * 商品修正の入力・確認・完了画面で状態を共有するProvider
 */
export const UpdateProductProvider = ({
    children,
}: {
    children: ReactNode;
}) => {
    const [draft, setDraft] =
        useState<Product | null>(null);
    const [imageFile, setImageFile] =
        useState<File | null>(null);
    const [completedResult, setCompletedResultState] =
        useState<ProductUpdateResult | null>(null);

    const saveDraft = useCallback(
        (product: Product, nextImageFile: File | null) => {
            setDraft(product);
            setImageFile(nextImageFile);
            setCompletedResultState(null);
        },
        []
    );

    const setCompletedResult = useCallback(
        (result: ProductUpdateResult) => {
            setCompletedResultState(result);
        },
        []
    );

    const clearFlow = useCallback(() => {
        setDraft(null);
        setImageFile(null);
        setCompletedResultState(null);
    }, []);

    const value = useMemo<UpdateProductContextValue>(
        () => ({
            draft,
            imageFile,
            completedResult,
            saveDraft,
            setCompletedResult,
            clearFlow,
        }),
        [
            completedResult,
            draft,
            imageFile,
            saveDraft,
            setCompletedResult,
            clearFlow,
        ]
    );

    return (
        <UpdateProductContext.Provider value={value}>
            {children}
        </UpdateProductContext.Provider>
    );
};

/**
 * 商品修正画面間の共有状態を取得する
 */
export const useUpdateProductContext = () => {
    const context = useContext(UpdateProductContext);

    if (!context) {
        throw new Error(
            "useUpdateProductContextはUpdateProductProvider内で使用してください。"
        );
    }

    return context;
};
