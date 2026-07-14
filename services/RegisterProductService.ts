import type { IProductRepository } from "@/interfaces/IProductRepository";
import type { IProductCategoryRepository } from "@/interfaces/IProductCategoryRepository";
import { IRegisterProductService } from "@/interfaces/IRegisterProductService";
import { Product } from "@/models/Product";
import { ProductCategory } from "@/models/ProductCategory";
import { ProductStock } from "@/models/ProductStock";
import { inject, injectable } from "inversify";
import { TYPES } from "@/di/types";

@injectable()
export class RegisterProductService
    implements IRegisterProductService {

    private readonly productRepository: IProductRepository;
    private readonly productCategoryRepository: IProductCategoryRepository;

    /**
     * コンストラクタ
     */
    public constructor(
        @inject(TYPES.IProductRepository)
        productRepository: IProductRepository,
        @inject(TYPES.IProductCategoryRepository)
        productCategoryRepository: IProductCategoryRepository
    ) {
        this.productRepository = productRepository;
        this.productCategoryRepository = productCategoryRepository;
    }

    /**
    * 商品名の重複確認をする
    */
    public async validateProductName(
        name: string
    ): Promise<void> {
        await this.productRepository
            .existsByName(name);
    }

    /**
     * 商品カテゴリ一覧を取得する
     */
    public async getCategories(): Promise<ProductCategory[]> {
        return await this.productCategoryRepository.findAll();
    }

    /**
     * 商品を登録する
     */
    public async registerProduct(
        product: Product
    ): Promise<Product> {
        return await this.productRepository.register(product);
    }
}