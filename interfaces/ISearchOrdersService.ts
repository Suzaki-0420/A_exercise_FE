import type { OrderSearchItem } from
    "@/models/OrderSearchItem";

/**
 * 購入履歴検索Serviceインターフェイス
 */
export interface ISearchOrdersService {

    /**
     * すべての購入履歴を取得する
     */
    findAll(): Promise<OrderSearchItem[]>;

    /**
     * 条件を指定して購入履歴を検索する
     */
    searchOrders(
        orderDate: string,
        customerAccountName: string
    ): Promise<OrderSearchItem[]>;
}