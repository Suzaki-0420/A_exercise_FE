import { SearchOrders } from "@/components/order/search/SearchOrders";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "注文履歴検索",
};
/**
 * 注文履歴検索ページ
 */
export default function Page() {
  return <SearchOrders />;
}
