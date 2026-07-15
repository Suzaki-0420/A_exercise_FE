import type { Orders } from "@/models/Orders";

/**
 * 注文Repositoryインターフェイス
 */
export interface IOrdersRepository {

    /**
     * すべての購入履歴を取得する
     */
    findAll(): Promise<Orders[]>;

    /**
     * 条件を指定して購入履歴を検索する
     */
    search(
        orderDate: string,
        customerAccountName: string
    ): Promise<Orders[]>;

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