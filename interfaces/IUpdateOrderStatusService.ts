import type { Orders } from
    "@/models/Orders";
import type {
    UpdateOrderStatusComplete,
    UpdateOrderStatusConfirm,
    UpdateOrderStatusInput,
} from "@/models/UpdateOrderStatusData";
/**
 * 注文ステータス更新Serviceインターフェイス
 */
export interface IUpdateOrderStatusService {

    /**
     * 指定された注文UUIDの注文情報を取得する
     */
    findById(
        orderUuid: string
    ): Promise<UpdateOrderStatusInput | null>;

    /**
     * 注文ステータスの更新内容を確認する
     */
    confirmStatusUpdate(
        orderId: string,
        newStatusId: number
    ): Promise<UpdateOrderStatusConfirm>;

    /**
     * 注文ステータスを更新する
     */
    updateStatus(
        orderId: string,
        newStatusId: number
    ): Promise<UpdateOrderStatusComplete>;
}