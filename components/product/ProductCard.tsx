"use client";

import Image from "next/image";
import { Product } from "@/models/Product";

type ProductCardProps = {
    product: Product;
};

export const ProductCard = ({
    product,
}: ProductCardProps) => {
    return (
        <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
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
            </div>
        </div>
    );
};