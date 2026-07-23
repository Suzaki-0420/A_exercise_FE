import { UpdateProductProvider } from "@/components/product/edit/UpdateProductContext";

/**
 * 商品修正の入力・確認・完了画面で入力内容を共有するレイアウト
 */
export default function UpdateProductLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <UpdateProductProvider>{children}</UpdateProductProvider>;
}
