import type { IProductCategoryRepository } from "@/interfaces/IProductCategoryRepository";
import type { ProductCategory } from "@/models/ProductCategory";
import { injectable } from "inversify";

@injectable()
export class ProductCategoryRepository
    implements IProductCategoryRepository {

    /**
     * すべての商品カテゴリを取得する
     */
    public async findAll(): Promise<ProductCategory[]> {
        // TODO: 実際のControllerのURLに合わせて修正する
        const url = "/proxy-api/product/categories";

        const response = await fetch(url, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) {
            const errorData = await response
                .json()
                .catch(() => ({}));

            console.log("========== API ERROR ==========");
            console.log("findAll url:", url);
            console.log("findAll status:", response.status);
            console.log("findAll error body:", errorData);
            console.log("===============================");

            if (errorData.message) {
                throw new Error(errorData.message);
            }

            if (errorData.errors) {
                const messages = Object.values(
                    errorData.errors
                )
                    .flat()
                    .join("\n");

                throw new Error(messages);
            }

            throw new Error(
                `商品カテゴリ一覧の取得に失敗しました (Status: ${response.status})`
            );
        }

        return await response.json();
    }

    /**
     * 商品カテゴリUUIDを指定して商品カテゴリを取得する
     */
    public async findById(
        categoryUuid: string
    ): Promise<ProductCategory | null> {
        /*
         * 商品カテゴリ1件取得APIがないため、
         * 一覧取得後にUUIDで検索する。
         */
        const categories = await this.findAll();

        return categories.find(
            category =>
                category.categoryUuid === categoryUuid
        ) ?? null;
    }

    /**
     * 商品カテゴリ名がすでに登録されていないか確認する
     */
    public async existsByName(
        name: string
    ): Promise<void> {
        const params = new URLSearchParams({
            categoryName: name,
        });

        // TODO: 実際のControllerのURLに合わせて修正する
        const url =
            `/proxy-api/category/validate?${params.toString()}`;

        const response = await fetch(url, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) {
            const errorData = await response
                .json()
                .catch(() => ({}));

            console.log("========== API ERROR ==========");
            console.log("validate url:", url);
            console.log("validate status:", response.status);
            console.log("validate error body:", errorData);
            console.log("===============================");

            if (errorData.message) {
                throw new Error(errorData.message);
            }

            if (errorData.errors) {
                const messages = Object.values(
                    errorData.errors
                )
                    .flat()
                    .join("\n");

                throw new Error(messages);
            }

            throw new Error(
                `商品カテゴリ名の検証に失敗しました (Status: ${response.status})`
            );
        }
    }

    /**
     * 商品カテゴリを登録する
     */
    public async create(
        productCategory: ProductCategory
    ): Promise<ProductCategory> {
        // TODO: 実際のControllerのURLに合わせて修正する
        const url =
            "/proxy-api/category/register";

        const requestBody = {
            categoryName: productCategory.name,
        };

        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            const errorData = await response
                .json()
                .catch(() => ({}));

            console.log(
                "========== REGISTER PRODUCT CATEGORY =========="
            );
            console.log("register url:", url);
            console.log("request body:", requestBody);
            console.log("status:", response.status);
            console.log("error body:", errorData);
            console.log(
                "==============================================="
            );

            if (errorData.message) {
                throw new Error(errorData.message);
            }

            if (errorData.errors) {
                const fieldErrors: {
                    [key: string]: string;
                } = {};

                Object.entries(errorData.errors).forEach(
                    ([key, value]) => {
                        const normalizedKey =
                            key.charAt(0).toLowerCase() +
                            key.slice(1);

                        fieldErrors[normalizedKey] =
                            Array.isArray(value)
                                ? String(value[0])
                                : String(value);
                    }
                );

                throw new Error(
                    JSON.stringify({
                        type: "validation",
                        errors: fieldErrors,
                    })
                );
            }

            throw new Error(
                `商品カテゴリの登録に失敗しました (Status: ${response.status})`
            );
        }

        const responseData = await response.json() as {
            message: string;
            category: ProductCategory;
        };

        return responseData.category;
    }
}