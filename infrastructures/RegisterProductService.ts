import type { IProductRepository } from "@/interfaces/IProductRepository";
import { IRegisterProductService } from "@/interfaces/IRegisterProductService";
import { Product } from "@/models/Product";
import { ProductCategory } from "@/models/ProductCategory";
import { ProductStock } from "@/models/ProductStock";
import { inject, injectable } from "inversify";

@injectable()
export class RegisterProductService
    implements IRegisterProductService {

    private readonly productRepository: IProductRepository;

    /**
     * コンストラクタ
     */
    public constructor(
        @inject("IProductRepository")
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
        name: string,
        price: number,
        stock: number,
        productCategory: ProductCategory,
        imageUrl: string | null = null
    ): Promise<Product> {
        /*
         * 商品名がすでに登録されていないか確認する。
         * 重複している場合はRepository側で例外が発生する。
         */
        await this.productRepository.existsByName(name);

        /*
         * フロント側のProductモデルを組み立てる。
         *
         * 商品UUIDと在庫UUIDはバックエンド側で発行されるため、
         * 登録リクエストへ変換する際には利用されない。
         */
        const productStock: ProductStock = {
            stockUuid: crypto.randomUUID(),
            quantity: stock,
        };

        const product: Product = {
            productUuid: crypto.randomUUID(),
            name,
            price,
            imageUrl,
            productCategory,
            productStock,
            deleteFlg: 0,
        };

        return await this.productRepository.register(product);
    }
}