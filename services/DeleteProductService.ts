import {
    inject,
    injectable,
} from "inversify";

import type { IProductRepository } from "@/interfaces/IProductRepository";
import type { IDeleteProductService } from "@/interfaces/IDeleteProductService";

import { TYPES } from "@/di/types";

/**
 * 商品削除Serviceの実装
 */
@injectable()
export class DeleteProductService
    implements IDeleteProductService {

    constructor(
        @inject(TYPES.IProductRepository)
        private readonly productRepository:
            IProductRepository
    ) { }

    /**
     * 商品を削除する
     */
    public async execute(
        productUuid: string
    ): Promise<boolean> {
        if (!productUuid) {
            throw new Error(
                "商品UUIDが指定されていません。"
            );
        }

        return await this.productRepository
            .deleteById(productUuid);
    }
}