import type { Orders } from
    "@/models/Orders";

/**
 * 注文ステータス更新Serviceインターフェイス
 */
export interface IUpdateOrderStatusService {

    /**
     * 指定された注文UUIDの注文情報を取得する
     */
    findById(
        orderUuid: string
    ): Promise<Orders | null>;

    /**
     * 注文ステータスの更新内容を確認する
     */
    confirmStatusUpdate(
        orders: Orders
    ): Promise<Orders>;

    /**
     * 注文ステータスを更新する
     */
    updateStatus(
        orders: Orders
    ): Promise<Orders>;
}