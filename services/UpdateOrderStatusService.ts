import {
    inject,
    injectable,
} from "inversify";

import { TYPES } from "@/di/types";
import type { IOrdersRepository } from
    "@/interfaces/IOrdersRepository";
import type { IUpdateOrderStatusService } from
    "@/interfaces/IUpdateOrderStatusService";
import type { Orders } from
    "@/models/Orders";

/**
 * 注文ステータス更新Service
 */
@injectable()
export class UpdateOrderStatusService
    implements IUpdateOrderStatusService {

    /**
     * コンストラクタ
     */
    public constructor(
        @inject(TYPES.IOrdersRepository)
        private readonly ordersRepository:
            IOrdersRepository
    ) { }

    /**
     * 指定された注文UUIDの注文情報を取得する
     */
    public async findById(
        orderUuid: string
    ): Promise<Orders | null> {

        return await this.ordersRepository
            .findById(orderUuid);
    }

    /**
     * 注文ステータスの更新内容を確認する
     */
    public async confirmStatusUpdate(
        orders: Orders
    ): Promise<Orders> {

        return await this.ordersRepository
            .confirmStatusUpdate(orders);
    }

    /**
     * 注文ステータスを更新する
     */
    public async updateStatus(
        orders: Orders
    ): Promise<Orders> {

        return await this.ordersRepository
            .updateStatus(orders);
    }
}