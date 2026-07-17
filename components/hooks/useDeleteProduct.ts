"use client";

import {
    useCallback,
    useMemo,
    useState,
} from "react";

import { container } from "@/di/container";
import { TYPES } from "@/di/types";

import type { Product } from "@/models/Product";
import type { IDeleteProductService } from "@/interfaces/IDeleteProductService";

/**
 * 商品削除Hook
 */
export const useDeleteProduct = () => {
    /**
     * 削除確認対象の商品
     */
    const [
        deleteTarget,
        setDeleteTarget,
    ] = useState<Product | null>(null);

    /**
     * 削除中フラグ
     */
    const [
        isDeleting,
        setIsDeleting,
    ] = useState<boolean>(false);

    /**
     * 削除エラー
     */
    const [
        deleteError,
        setDeleteError,
    ] = useState<string | null>(null);

    /**
     * 削除完了通知
     */
    const [
        isDeleteToastVisible,
        setIsDeleteToastVisible,
    ] = useState<boolean>(false);

    const service =
        useMemo<IDeleteProductService>(
            () =>
                container.get<IDeleteProductService>(
                    TYPES.IDeleteProductService
                ),
            []
        );

    /**
     * 削除確認モーダルを開く
     */
    const openDeleteModal =
        useCallback(
            (
                product: Product
            ) => {
                setDeleteError(null);
                setDeleteTarget(product);
            },
            []
        );

    /**
     * 削除確認モーダルを閉じる
     */
    const closeDeleteModal =
        useCallback(() => {
            if (isDeleting) {
                return;
            }

            setDeleteTarget(null);
            setDeleteError(null);
        }, [isDeleting]);

    /**
     * 商品削除を確定する
     */
    const confirmDelete =
        useCallback(
            async (): Promise<boolean> => {
                if (!deleteTarget) {
                    return false;
                }

                setIsDeleting(true);
                setDeleteError(null);

                try {
                    const result =
                        await service.execute(
                            deleteTarget.productUuid
                        );

                    if (!result) {
                        throw new Error(
                            "商品を削除できませんでした。"
                        );
                    }

                    setDeleteTarget(null);
                    setIsDeleteToastVisible(true);

                    return true;
                } catch (e: unknown) {
                    const message =
                        e instanceof Error
                            ? e.message
                            : "商品の削除に失敗しました。";

                    setDeleteError(message);

                    return false;
                } finally {
                    setIsDeleting(false);
                }
            },
            [
                deleteTarget,
                service,
            ]
        );

    /**
     * 削除完了通知を閉じる
     */
    const closeDeleteToast =
        useCallback(() => {
            setIsDeleteToastVisible(false);
        }, []);

    return {
        deleteTarget,
        isDeleteModalOpen:
            deleteTarget !== null,
        isDeleting,
        deleteError,
        isDeleteToastVisible,

        openDeleteModal,
        closeDeleteModal,
        confirmDelete,
        closeDeleteToast,
    };
};