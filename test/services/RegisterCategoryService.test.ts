import { beforeEach, describe, expect, it, vi } from "vitest";

import type { IProductCategoryRepository } from "@/interfaces/IProductCategoryRepository";
import type { ProductCategory } from "@/models/ProductCategory";
import { RegisterCategoryService } from "@/services/RegisterCategoryService";

describe("RegisterCategoryService", () => {
  let repository: IProductCategoryRepository;

  let service: RegisterCategoryService;

  beforeEach(() => {
    repository = {
      existsByName: vi.fn(),
      create: vi.fn(),
    } as unknown as IProductCategoryRepository;

    service = new RegisterCategoryService(repository);
  });

  it("インスタンスを生成できる", () => {
    expect(service).toBeInstanceOf(RegisterCategoryService);
  });

  it("カテゴリー名の重複確認をするとRepositoryのexistsByNameが呼ばれる", async () => {
    // データを用意する
    const categoryName = "文房具";

    vi.mocked(repository.existsByName).mockResolvedValue(undefined);

    // カテゴリー名の重複確認を実行する
    await service.validateCategoryName(categoryName);

    // Repositoryが呼ばれたことを検証する
    expect(repository.existsByName).toHaveBeenCalledTimes(1);

    expect(repository.existsByName).toHaveBeenCalledWith(categoryName);
  });

  it("カテゴリー名の重複確認でRepositoryが例外を発生させるとその例外が伝播する", async () => {
    // データを用意する
    const categoryName = "文房具";
    const error = new Error("カテゴリー名が重複しています。");

    vi.mocked(repository.existsByName).mockRejectedValue(error);

    // 例外を検証する
    await expect(service.validateCategoryName(categoryName)).rejects.toThrow(
      "カテゴリー名が重複しています。",
    );

    expect(repository.existsByName).toHaveBeenCalledWith(categoryName);
  });

  it("カテゴリーを登録するとRepositoryのcreateが呼ばれ登録結果が返される", async () => {
    // データを用意する
    const productCategory = {} as ProductCategory;

    vi.mocked(repository.create).mockResolvedValue(productCategory);

    // カテゴリーを登録する
    const result = await service.registerCategory(productCategory);

    // Repositoryが呼ばれたことを検証する
    expect(repository.create).toHaveBeenCalledTimes(1);

    expect(repository.create).toHaveBeenCalledWith(productCategory);

    // 登録結果を検証する
    expect(result).toBe(productCategory);
  });

  it("カテゴリー登録でRepositoryが例外を発生させるとその例外が伝播する", async () => {
    // データを用意する
    const productCategory = {} as ProductCategory;

    const error = new Error("カテゴリー登録に失敗しました。");

    vi.mocked(repository.create).mockRejectedValue(error);

    // 例外を検証する
    await expect(service.registerCategory(productCategory)).rejects.toThrow(
      "カテゴリー登録に失敗しました。",
    );

    expect(repository.create).toHaveBeenCalledWith(productCategory);
  });
});
