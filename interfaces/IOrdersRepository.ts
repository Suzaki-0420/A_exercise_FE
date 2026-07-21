import type { OrderSearchItem } from
    "@/models/OrderSearchItem";
import type {
    UpdateOrderStatusInput,
    UpdateOrderStatusConfirm,
    UpdateOrderStatusComplete
} from "@/models/UpdateOrderStatusData";
/**
 * 注文Repositoryインターフェイス
 */
export interface IOrdersRepository {

    /**
     * すべての購入履歴を取得する
     */
    findAll(): Promise<OrderSearchItem[]>;

    /**
     * 条件を指定して購入履歴を検索する
     */
    search(
        orderDate: string,
        customerAccountName: string
    ): Promise<OrderSearchItem[]>;

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