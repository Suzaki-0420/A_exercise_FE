import { UpdateProductFlow } from "@/components/product/edit/UpdateProductFlow";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "商品変更（入力） | フルネス文具 管理画面",
};

/**
 * BP009 商品修正（入力）画面
 */
export default async function UpdateProductPage({
    params,
}: {
    params: Promise<{ productId: string }>;
}) {
    const { productId } = await params;

    return <UpdateProductFlow productUuid={productId} />;
}
