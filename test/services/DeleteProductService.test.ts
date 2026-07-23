import { beforeEach, describe, expect, it, vi } from "vitest";

import { DeleteProductService } from "@/services/DeleteProductService";

import type { IProductRepository } from "@/interfaces/IProductRepository";

/**
 * DeleteProductServiceの単体テスト
 */
describe("DeleteProductService", () => {
  let productRepository: IProductRepository;

  let service: DeleteProductService;

  beforeEach(() => {
    /**
     * IProductRepositoryのモックを作成
     *
     * DeleteProductServiceで使用する
     * deleteByIdのみモック化する
     */
    productRepository = {
      deleteById: vi.fn(),
    } as unknown as IProductRepository;

    /**
     * モックRepositoryを注入して
     * テスト対象のServiceを生成
     */
    service = new DeleteProductService(productRepository);
  });

  /**
   * 正常系
   *
   * Repositoryで商品の削除に成功した場合、
   * trueが返ることを確認する
   */
  it("商品UUIDを指定して削除に成功した場合trueを返す", async () => {
    const productUuid = "test-product-uuid";

    vi.mocked(productRepository.deleteById).mockResolvedValue(true);

    const result = await service.execute(productUuid);

    expect(result).toBe(true);

    expect(productRepository.deleteById).toHaveBeenCalledWith(productUuid);

    expect(productRepository.deleteById).toHaveBeenCalledTimes(1);
  });

  /**
   * 異常系
   *
   * Repositoryで商品の削除に失敗した場合、
   * falseが返ることを確認する
   */
  it("商品の削除に失敗した場合falseを返す", async () => {
    const productUuid = "test-product-uuid";

    vi.mocked(productRepository.deleteById).mockResolvedValue(false);

    const result = await service.execute(productUuid);

    expect(result).toBe(false);

    expect(productRepository.deleteById).toHaveBeenCalledWith(productUuid);

    expect(productRepository.deleteById).toHaveBeenCalledTimes(1);
  });

  /**
   * 異常系
   *
   * 商品UUIDが空文字の場合、
   * Errorが発生することを確認する
   */
  it("商品UUIDが未指定の場合例外を投げる", async () => {
    await expect(service.execute("")).rejects.toThrow(
      "商品UUIDが指定されていません。",
    );

    expect(productRepository.deleteById).not.toHaveBeenCalled();
  });
});
