/**
 * 注文ステータス選択肢
 */
export type OrderStatusOption = {
  id: number;
  name: string;
};

/**
 * 注文ステータス更新入力情報
 */
export type UpdateOrderStatusInput = {
  orderId: string;
  orderDate: string;
  customerAccountName: string;
  orderContent: string;
  currentStatusId: number;
  currentStatus: string;
  orderStatuses: OrderStatusOption[];
};

/**
 * 注文ステータス更新確認情報
 */
export type UpdateOrderStatusConfirm = {
  orderId: string;
  orderDate: string;
  customerAccountName: string;
  currentStatus: string;
  newStatus: string;
};

/**
 * 注文ステータス更新完了情報
 */
export type UpdateOrderStatusComplete = {
  orderId: string;
  orderDate: string;
  customerAccountName: string;
  currentStatus: string;
  newStatus: string;
  completeMsg: string;
};
