import { beforeEach, describe, expect, it, vi } from "vitest";

import { RegisterProductService } from "@/services/RegisterProductService";

import type { IProductRepository } from "@/interfaces/IProductRepository";
import type { IProductCategoryRepository } from "@/interfaces/IProductCategoryRepository";

import { Product } from "@/models/Product";
import { ProductCategory } from "@/models/ProductCategory";

/**
 * RegisterProductServiceの単体テスト
 */
describe("RegisterProductService", () => {
  let productRepository: IProductRepository;

  let productCategoryRepository: IProductCategoryRepository;

  let service: RegisterProductService;

  beforeEach(() => {
    /**
     * IProductRepositoryのモックを作成
     */
    productRepository = {
      existsByName: vi.fn(),
      register: vi.fn(),
    } as unknown as IProductRepository;

    /**
     * IProductCategoryRepositoryのモックを作成
     */
    productCategoryRepository = {
      findAll: vi.fn(),
    } as unknown as IProductCategoryRepository;

    /**
     * モックRepositoryを注入して
     * テスト対象のServiceを生成
     */
    service = new RegisterProductService(
      productRepository,
      productCategoryRepository,
    );
  });

  /**
   * validateProductName
   *
   * 商品名を指定した場合、
   * RepositoryのexistsByNameが
   * 正しい商品名で呼ばれることを確認する
   */
  it("商品名の重複確認を行う", async () => {
    const productName = "テスト商品";

    vi.mocked(productRepository.existsByName).mockResolvedValue();

    await service.validateProductName(productName);

    expect(productRepository.existsByName).toHaveBeenCalledWith(productName);

    expect(productRepository.existsByName).toHaveBeenCalledTimes(1);
  });

  /**
   * validateProductName
   *
   * RepositoryのexistsByNameで
   * 例外が発生した場合、
   * その例外が呼び出し元に伝播することを確認する
   */
  it("商品名の重複確認でRepositoryが例外を投げた場合例外が伝播する", async () => {
    const productName = "テスト商品";

    vi.mocked(productRepository.existsByName).mockRejectedValue(
      new Error("重複確認エラー"),
    );

    await expect(service.validateProductName(productName)).rejects.toThrow(
      "重複確認エラー",
    );

    expect(productRepository.existsByName).toHaveBeenCalledWith(productName);

    expect(productRepository.existsByName).toHaveBeenCalledTimes(1);
  });

  /**
   * getCategories
   *
   * Repositoryから取得した
   * 商品カテゴリ一覧が返されることを確認する
   */
  it("商品カテゴリ一覧を取得できる", async () => {
    const categories = [{} as ProductCategory, {} as ProductCategory];

    vi.mocked(productCategoryRepository.findAll).mockResolvedValue(categories);

    const result = await service.getCategories();

    expect(result).toEqual(categories);

    expect(productCategoryRepository.findAll).toHaveBeenCalledTimes(1);
  });

  /**
   * registerProduct
   *
   * 商品と画像ファイルを指定した場合、
   * Repositoryのregisterが呼ばれ、
   * 登録された商品が返ることを確認する
   */
  it("商品を正常に登録できる", async () => {
    const product = {} as Product;

    const imageFile = new File(["test"], "test.png", {
      type: "image/png",
    });

    const registeredProduct = {} as Product;

    vi.mocked(productRepository.register).mockResolvedValue(registeredProduct);

    const result = await service.registerProduct(product, imageFile);

    expect(result).toBe(registeredProduct);

    expect(productRepository.register).toHaveBeenCalledWith(product, imageFile);

    expect(productRepository.register).toHaveBeenCalledTimes(1);
  });

  /**
   * registerProduct
   *
   * Repositoryのregisterで
   * 例外が発生した場合、
   * その例外が呼び出し元に伝播することを確認する
   */
  it("商品登録でRepositoryが例外を投げた場合例外が伝播する", async () => {
    const product = {} as Product;

    const imageFile = new File(["test"], "test.png", {
      type: "image/png",
    });

    vi.mocked(productRepository.register).mockRejectedValue(
      new Error("商品登録エラー"),
    );

    await expect(service.registerProduct(product, imageFile)).rejects.toThrow(
      "商品登録エラー",
    );

    expect(productRepository.register).toHaveBeenCalledWith(product, imageFile);

    expect(productRepository.register).toHaveBeenCalledTimes(1);
  });
});
