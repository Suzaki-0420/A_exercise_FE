import { Customer } from "./Customer";
import { OrderStatus } from "./OrderStatus";
import { PaymentMethod } from "./PaymentMethod";
import { OrdersDetail } from "./OrdersDetail";

/**
 * 注文を表すモデル
 */
export interface Orders {
    /**
     * 注文識別ID（UUID）
     */
    orderUuid: string;

    /**
     * 注文日
     */
    orderDate: string;

    /**
     * 合計金額
     */
    amountTotal: number;

    /**
     * 顧客
     */
    customer: Customer;

    /**
     * 注文ステータス
     */
    orderStatus: OrderStatus;

    /**
     * 支払い方法
     */
    paymentMethod: PaymentMethod;

    /**
     * 注文明細リスト
     */
    ordersDetails: OrdersDetail[];
}