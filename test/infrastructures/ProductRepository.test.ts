import { describe, it, expect } from "vitest";
import { ProductRepository } from "@/infrastructures/ProductRepository";

describe("ProductRepository", () => {
    it("インスタンスを生成できる", () => {
        const repository = new ProductRepository();

        expect(repository).toBeInstanceOf(ProductRepository);
    });
});