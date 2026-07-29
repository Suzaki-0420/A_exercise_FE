import { UpdateOrderStatus } from "@/components/order/status/UpdateOrderStatus";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "注文履歴更新",
};
/**
 * 注文履歴更新ページのProps
 */
type PageProps = {
  params: Promise<{
    orderUuid: string;
  }>;

  searchParams: Promise<{
    currentStatusId?: string;
    currentStatusName?: string;
  }>;
};

/**
 * 注文履歴更新ページ
 */
export default async function Page({ params, searchParams }: PageProps) {
  const { orderUuid } = await params;

  const { currentStatusId, currentStatusName } = await searchParams;

  const parsedCurrentStatusId = Number(currentStatusId);

  return (
    <UpdateOrderStatus
      orderUuid={orderUuid}
      currentStatusId={
        Number.isInteger(parsedCurrentStatusId) ? parsedCurrentStatusId : 0
      }
      currentStatusName={currentStatusName ?? ""}
    />
  );
}
