"use client";

import { UpdateProduct } from
    "@/components/product/edit/UpdateProduct";
import {
    UpdateProductModal,
    type UpdateModalStep,
} from "@/components/product/edit/UpdateProductModal";
import { useCallback, useState } from "react";

/**
 * 商品変更（入力）画面と、後続の確認・完了モーダルを管理する
 */
export const UpdateProductFlow = ({
    productUuid,
}: {
    productUuid: string;
}) => {
    const [modalStep, setModalStep] =
        useState<UpdateModalStep>("closed");

    const openConfirmModal = useCallback(() => {
        setModalStep("confirm");
    }, []);

    const closeConfirmModal = useCallback(() => {
        setModalStep("closed");
    }, []);

    const showCompleteModal = useCallback(() => {
        setModalStep("complete");
    }, []);

    return (
        <>
            <UpdateProduct
                productUuid={productUuid}
                options={{
                    onProceedToConfirm:
                        openConfirmModal,
                }}
            />

            <UpdateProductModal
                step={modalStep}
                onBackToInput={closeConfirmModal}
                onUpdateCompleted={showCompleteModal}
            />
        </>
    );
};
