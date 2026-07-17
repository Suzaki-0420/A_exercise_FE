/**
 * 購入履歴検索結果1件分
 */
export type OrderSearchItem = {
    orderUuid: string;
    orderDate: string;
    customerAccountName: string;
    orderContent: string;
    orderStatus: string;
    statusUpdateUrl: string;
};

/**
 * 購入履歴検索APIレスポンス
 */
export type SearchOrdersResponse = {
    title?: string;
    orderList: OrderSearchItem[];
    message: string | null;
};