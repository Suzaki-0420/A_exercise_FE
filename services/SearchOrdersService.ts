import {
    inject,
    injectable,
} from "inversify";

import { TYPES } from "@/di/types";
import type { IOrdersRepository } from
    "@/interfaces/IOrdersRepository";
import type { ISearchOrdersService } from
    "@/interfaces/ISearchOrdersService";
import type { Orders } from
    "@/models/Orders";

/**
 * 購入履歴検索Service
 */
@injectable()
export class SearchOrdersService
    implements ISearchOrdersService {

    /**
     * コンストラクタ
     */
    public constructor(
        @inject(TYPES.IOrdersRepository)
        private readonly ordersRepository:
            IOrdersRepository
    ) { }

    /**
     * すべての購入履歴を取得する
     */
    public async findAll():
        Promise<Orders[]> {

        return await this.ordersRepository
            .findAll();
    }

    /**
     * 条件を指定して購入履歴を検索する
     */
    public async searchOrders(
        orderDate: string,
        customerAccountName: string
    ): Promise<Orders[]> {

        return await this.ordersRepository
            .search(
                orderDate,
                customerAccountName
            );
    }
}