import { ProductSearch } from "@/components/product/ProductSearch";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "新商品登録（入力）",
};
/**
 * 新商品登録（入力）ページ
 */
export default function ProductPage() {
  return <ProductSearch />;
}
