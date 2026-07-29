import { RegisterProduct } from "@/components/product/add/RegisterProduct";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "新商品登録",
};
/**
 * 新商品登録（入力）ページ
 */
export default function RegisterProductPage() {
  return <RegisterProduct />;
}
