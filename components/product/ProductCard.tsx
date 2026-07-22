"use client";

import Image from "next/image";
import { Product } from "@/models/Product";

type ProductCardProps = {
    product: Product;
    /**
     * 更新ボタン押下
     */
    onUpdate: (
        product: Product
    ) => void;

    /**
     * 削除ボタンが押されたとき、
     * 対象商品を親へ通知する。
     */
    onDelete: (
        product: Product
    ) => void;
};

export const ProductCard = ({
    product,
    onUpdate,
    onDelete,
}: ProductCardProps) => {
    return (
        <div data-testid="product-card"
            data-deleted={
                product.deleteFlg === 1
                    ? "true"
                    : "false"
            }
            className="overflow-hidden rounded-lg border bg-white shadow-sm">
            <div className="relative aspect-square w-full bg-muted">
                {product.imageUrl ? (
                    <Image
                        src={product.imageUrl}
                        alt={product.name}
                        fill
                        className="object-cover"
                    />
                ) : (
                    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                        画像なし
                    </div>
                )}
            </div>

            <div className="space-y-3 p-4">
                <div>
                    <p className="text-sm text-muted-foreground">
                        {product.productCategory?.name ??
                            "カテゴリなし"}
                    </p>

                    <h3 className="text-lg font-semibold">
                        {product.name}
                    </h3>
                </div>

                <div className="flex items-end justify-between">
                    <p className="text-xl font-bold">
                        ￥
                        {product.price.toLocaleString()}
                    </p>

                    <p className="text-sm text-muted-foreground">
                        在庫：
                        {product.productStock?.quantity ??
                            0}
                        個
                    </p>
                </div>
                {product.deleteFlg === 0 && (
                    <div className="flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={() => {
                                onUpdate(product);
                            }}
                            className="rounded border border-blue-600 px-4 py-2 font-semibold text-blue-600 hover:bg-blue-50"
                        >
                            更新
                        </button>

                        <button
                            type="button"
                            onClick={() => {
                                onDelete(product);
                            }}
                            className="rounded border border-red-600 px-4 py-2 font-semibold text-red-600 hover:bg-red-50"
                        >
                            削除
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};