import type { IProductRepository } from "@/interfaces/IProductRepository";
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

    /**
     * コンストラクタ
     */
    public constructor(
        @inject(TYPES.IProductRepository)
        productRepository: IProductRepository
    ) {
        this.productRepository = productRepository;
    }

    /**
     * 商品カテゴリ一覧を取得する
     */
    public async getCategories(): Promise<ProductCategory[]> {
        return await this.productRepository.getCategories();
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