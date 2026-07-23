import { UpdateProductConfirm } from "@/components/product/edit/UpdateProductConfirm";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "商品変更（確認） | フルネス文具 管理画面",
};

/**
 * BP010 商品修正（確認）画面
 */
export default function UpdateProductConfirmPage() {
  return <UpdateProductConfirm />;
}
