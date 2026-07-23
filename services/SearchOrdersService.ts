import { inject, injectable } from "inversify";

import { TYPES } from "@/di/types";
import type { IOrdersRepository } from "@/interfaces/IOrdersRepository";
import type { ISearchOrdersService } from "@/interfaces/ISearchOrdersService";
import type { OrderSearchItem } from "@/models/OrderSearchItem";

/**
 * 購入履歴検索Service
 */
@injectable()
export class SearchOrdersService implements ISearchOrdersService {
  public constructor(
    @inject(TYPES.IOrdersRepository)
    private readonly ordersRepository: IOrdersRepository,
  ) {}

  /**
   * すべての購入履歴を取得する
   */
  public async findAll(): Promise<OrderSearchItem[]> {
    return await this.ordersRepository.findAll();
  }

  /**
   * 条件を指定して購入履歴を検索する
   */
  public async searchOrders(
    orderDate: string,
    customerAccountName: string,
  ): Promise<OrderSearchItem[]> {
    return await this.ordersRepository.search(orderDate, customerAccountName);
  }
}
