import type { IProductCategoryRepository } from "@/interfaces/IProductCategoryRepository";
import type { IProductRepository } from "@/interfaces/IProductRepository";
import type { Product } from "@/models/Product";
import type { ProductCategory } from "@/models/ProductCategory";
import { ProductUpdateError } from "@/models/ProductUpdate";
import { UpdateProductService } from "@/services/UpdateProductService";
import { describe, expect, it, vi } from "vitest";

const category: ProductCategory = {
    categoryUuid: "e50d978b-b73d-4afb-8e85-ace9cf1e12a7",
    name: "文房具",
};

const product: Product = {
    productUuid: "10000000-0000-0000-0000-000000000001",
    name: "水性ボールペン黒",
    price: 120,
    imageUrl: null,
    productCategory: category,
    productStock: {
        stockUuid: "20000000-0000-0000-0000-000000000001",
        quantity: 80,
    },
    deleteFlg: 0,
};

const createProductRepository = (
    updateResult = true
): IProductRepository => ({
    findAll: async () => [product],
    findById: async (productUuid) =>
        productUuid === product.productUuid ? product : null,
    searchKeyword: async () => [product],
    selectByProductCategoryId: async () => [product],
    existsByName: async () => undefined,
    register: async (newProduct) => newProduct,
    updateById: async () => updateResult,
    deleteById: async () => true,
});

const createCategoryRepository =
    (): IProductCategoryRepository => ({
        findAll: async () => [category],
        findById: async (categoryUuid) =>
            categoryUuid === category.categoryUuid
                ? category
                : null,
        existsByName: async () => undefined,
        create: async (newCategory) => newCategory,
    });

describe("UpdateProductService", () => {
    it("商品名の重複確認をRepositoryへ委譲する", async () => {
        const repository = createProductRepository();
        const existsByName = vi.spyOn(
            repository,
            "existsByName"
        );
        const service = new UpdateProductService(
            repository,
            createCategoryRepository()
        );

        await service.validateProductName("油性ペン");

        expect(existsByName).toHaveBeenCalledWith(
            "油性ペン"
        );
    });

    it("商品カテゴリ一覧を取得できる", async () => {
        const service = new UpdateProductService(
            createProductRepository(),
            createCategoryRepository()
        );

        await expect(service.getCategories()).resolves.toEqual([
            category,
        ]);
    });

    it("商品を修正して完了画面用の結果を返す", async () => {
        const service = new UpdateProductService(
            createProductRepository(),
            createCategoryRepository()
        );

        await expect(
            service.updateProduct(product)
        ).resolves.toEqual({
            productUuid: product.productUuid,
            name: product.name,
            price: product.price,
            stockQuantity: product.productStock?.quantity,
            categoryUuid: category.categoryUuid,
            imageUrl: product.imageUrl,
            updated: true,
        });
    });

    it("選択した画像をRepositoryへ渡す", async () => {
        const repository = createProductRepository();
        const updateById = vi.spyOn(
            repository,
            "updateById"
        );
        const service = new UpdateProductService(
            repository,
            createCategoryRepository()
        );
        const imageFile = {
            name: "product.png",
            type: "image/png",
        } as File;

        await service.updateProduct(product, imageFile);

        expect(updateById).toHaveBeenCalledWith(
            product,
            imageFile
        );
    });

    it("在庫とカテゴリが未設定の場合は完了結果へ初期値を設定する", async () => {
        const productWithoutRelations: Product = {
            ...product,
            productStock: null,
            productCategory: null,
        };
        const service = new UpdateProductService(
            createProductRepository(),
            createCategoryRepository()
        );

        await expect(
            service.updateProduct(productWithoutRelations)
        ).resolves.toMatchObject({
            stockQuantity: 0,
            categoryUuid: "",
        });
    });

    it("更新対象が存在しない場合は404エラーを返す", async () => {
        const service = new UpdateProductService(
            createProductRepository(false),
            createCategoryRepository()
        );

        const error = await service
            .updateProduct(product)
            .catch((reason: unknown) => reason);

        expect(error).toBeInstanceOf(ProductUpdateError);
        expect(error).toMatchObject({
            message: "指定された商品は存在しません。",
            status: 404,
        });
    });
});
