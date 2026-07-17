import { TYPES } from "@/di/types";
import type { IProductCategoryRepository } from "@/interfaces/IProductCategoryRepository";
import type { IProductRepository } from "@/interfaces/IProductRepository";
import type { IUpdateProductService } from "@/interfaces/IUpdateProductService";
import type { Product } from "@/models/Product";
import type { ProductCategory } from "@/models/ProductCategory";
import {
    ProductUpdateError,
    type ProductUpdateResult,
} from "@/models/ProductUpdate";
import { inject, injectable } from "inversify";

/**
 * 商品修正Service
 */
@injectable()
export class UpdateProductService
    implements IUpdateProductService
{
    public constructor(
        @inject(TYPES.IProductRepository)
        private readonly productRepository: IProductRepository,
        @inject(TYPES.IProductCategoryRepository)
        private readonly productCategoryRepository: IProductCategoryRepository
    ) {}

    /**
     * 商品カテゴリ一覧を取得する
     */
    public async getCategories(): Promise<ProductCategory[]> {
        return await this.productCategoryRepository.findAll();
    }

    /**
     * 商品を修正する
     */
    public async updateProduct(
        product: Product
    ): Promise<ProductUpdateResult> {
        const updated =
            await this.productRepository.updateById(product);

        if (!updated) {
            throw new ProductUpdateError(
                "指定された商品は存在しません。",
                404
            );
        }

        return {
            productUuid: product.productUuid,
            name: product.name,
            price: product.price,
            stockQuantity:
                product.productStock?.quantity ?? 0,
            categoryUuid:
                product.productCategory?.categoryUuid ?? "",
            imageUrl: product.imageUrl,
            updated: true,
        };
    }
}
