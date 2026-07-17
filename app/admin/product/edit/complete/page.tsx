import { UpdateProductComplete } from "@/components/product/edit/UpdateProductComplete";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "商品変更（完了） | フルネス文具 管理画面",
};

/**
 * BP011 商品修正（完了）画面
 */
export default function UpdateProductCompletePage() {
    return <UpdateProductComplete />;
}
