import { inject, injectable } from "inversify";

import { TYPES } from "@/di/types";
import type { IProductCategoryRepository } from
    "@/interfaces/IProductCategoryRepository";
import type { IRegisterCategoryService } from
    "@/interfaces/IRegisterCategoryService";
import type { ProductCategory } from
    "@/models/ProductCategory";

@injectable()
export class RegisterCategoryService
    implements IRegisterCategoryService {
    private readonly productCategoryRepository:
        IProductCategoryRepository;

    /**
     * コンストラクタ
     */
    public constructor(
        @inject(TYPES.IProductCategoryRepository)
        productCategoryRepository:
            IProductCategoryRepository,
    ) {
        this.productCategoryRepository =
            productCategoryRepository;
    }

    /**
     * カテゴリー名の重複確認をする
     */
    public async validateCategoryName(
        name: string,
    ): Promise<void> {
        await this.productCategoryRepository
            .existsByName(name);
    }

    /**
     * カテゴリーを登録する
     */
    public async registerCategory(
        productCategory: ProductCategory,
    ): Promise<ProductCategory> {
        return this.productCategoryRepository.create(
            productCategory,
        );
    }
}