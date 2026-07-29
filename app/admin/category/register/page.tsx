import { RegisterCategory } from "@/components/category/register/RegisterCategory";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "商品カテゴリー登録",
};
/**
 * 商品カテゴリー登録ページ
 */
export default function RegisterCategoryPage() {
  return <RegisterCategory />;
}
