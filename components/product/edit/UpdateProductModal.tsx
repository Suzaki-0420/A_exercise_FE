"use client";

import { UpdateProduct } from
    "@/components/product/edit/UpdateProduct";
import { UpdateProductConfirm } from
    "@/components/product/edit/UpdateProductConfirm";
import { UpdateProductProvider } from
    "@/components/product/edit/UpdateProductContext";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogTitle,
} from "@/components/ui/dialog";
import type { Product } from "@/models/Product";
import type { ProductUpdateResult } from
    "@/models/ProductUpdate";
import {
    useCallback,
    useState,
} from "react";

type UpdateProductModalProps = {
    product: Product;
    onClose: () => void;
    onUpdated: (
        result: ProductUpdateResult
    ) => void | Promise<void>;
};

type UpdateStep = "input" | "confirm";

/**
 * 商品検索画面上で商品修正を完結させるモーダル
 */
const UpdateProductModalContent = ({
    product,
    onClose,
    onUpdated,
}: UpdateProductModalProps) => {
    const [step, setStep] =
        useState<UpdateStep>("input");
    const [isUpdatePending, setIsUpdatePending] =
        useState(false);

    const proceedToConfirm =
        useCallback(() => {
            setStep("confirm");
        }, []);

    const backToInput = useCallback(() => {
        setStep("input");
    }, []);

    const requestClose = useCallback(() => {
        if (!isUpdatePending) {
            onClose();
        }
    }, [isUpdatePending, onClose]);

    return (
        <Dialog
            open
            onOpenChange={(open) => {
                if (!open) {
                    requestClose();
                }
            }}
        >
            <DialogContent
                showCloseButton={false}
                className="max-h-[calc(100vh-2rem)] w-[calc(100vw-2rem)] min-w-0 max-w-3xl scroll-pb-6 overflow-x-hidden overflow-y-auto bg-transparent p-0 pb-6 ring-0"
                onEscapeKeyDown={(event) => {
                    if (isUpdatePending) {
                        event.preventDefault();
                    }
                }}
                onPointerDownOutside={(event) => {
                    if (isUpdatePending) {
                        event.preventDefault();
                    }
                }}
            >
                <DialogTitle className="sr-only">
                    {step === "input"
                        ? "商品変更（入力）"
                        : "商品変更（確認）"}
                </DialogTitle>
                <DialogDescription className="sr-only">
                    商品情報を変更し、内容を確認して更新します。
                </DialogDescription>

                {step === "input" ? (
                    <UpdateProduct
                        productUuid={
                            product.productUuid
                        }
                        variant="modal"
                        options={{
                            initialProduct: product,
                            onProceedToConfirm:
                                proceedToConfirm,
                            onCancel: onClose,
                        }}
                    />
                ) : (
                    <UpdateProductConfirm
                        variant="modal"
                        options={{
                            onBackToInput:
                                backToInput,
                            onCancel: onClose,
                            onUpdateSuccess:
                                onUpdated,
                            onUpdatePendingChange:
                                setIsUpdatePending,
                        }}
                    />
                )}
            </DialogContent>
        </Dialog>
    );
};

/**
 * 商品修正フロー専用の状態を提供するモーダル
 */
export const UpdateProductModal = (
    props: UpdateProductModalProps
) => {
    return (
        <UpdateProductProvider>
            <UpdateProductModalContent
                {...props}
            />
        </UpdateProductProvider>
    );
};
