import { IProductRepository } from "@/interfaces/IProductRepository";
import { Product } from "@/models/Product";
import { ProductCategory } from "@/models/ProductCategory";
import { injectable } from "inversify";

@injectable()
export class ProductRepository implements IProductRepository {
    /**
     * 指定されたキーワードを商品名に含む商品を取得する
     */
    public async searchKeyword(
        keyword: string,
        showDeletedOnly: boolean
    ): Promise<Product[]> {
        const params = new URLSearchParams({
            keyword,
            showDeletedOnly: String(showDeletedOnly),
        });

        // TODO: 実際のControllerのURLに合わせて修正する
        const url = `/proxy-api/admin/product/search?${params.toString()}`;

        const response = await fetch(url, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) {
            const errorText = await response.clone().text();

            console.log("========== API ERROR ==========");
            console.log("search url:", url);
            console.log("search status:", response.status);
            console.log("search statusText:", response.statusText);
            console.log("search error body:", errorText);
            console.log("===============================");

            throw new Error(
                `商品の検索に失敗しました (Status: ${response.status})`
            );
        }

        return await response.json();
    }

    /**
     * 指定された商品カテゴリに属する商品を取得する
     */
    public async selectByProductCategoryId(
        categoryUuid: string,
        showDeletedOnly: boolean
    ): Promise<Product[]> {
        const params = new URLSearchParams({
            categoryUuid,
            showDeletedOnly: String(showDeletedOnly),
        });

        // TODO: 実際のControllerのURLに合わせて修正する
        const url =
            `/proxy-api/admin/product/category?${params.toString()}`;

        const response = await fetch(url, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) {
            const errorText = await response.clone().text();

            console.log("========== API ERROR ==========");
            console.log("search url:", url);
            console.log("search status:", response.status);
            console.log("search statusText:", response.statusText);
            console.log("search error body:", errorText);
            console.log("===============================");

            throw new Error(
                `商品カテゴリによる検索に失敗しました (Status: ${response.status})`
            );
        }

        return await response.json();
    }

    /**
     * 商品名がすでに登録されていないか確認する
     */
    public async existsByName(name: string): Promise<void> {
        const params = new URLSearchParams({
            productName: name,
        });

        const url =
            `/proxy-api/admin/product/validate?${params.toString()}`;

        console.log("商品名：", name);

        const response = await fetch(url, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));

            console.log("========== API ERROR ==========");
            console.log("validate url:", url);
            console.log("validate status:", response.status);
            console.log("validate error body:", errorData);
            console.log("===============================");

            if (errorData.message) {
                throw new Error(errorData.message);
            }

            if (errorData.errors) {
                const messages = Object.values(errorData.errors)
                    .flat()
                    .join("\n");

                throw new Error(messages);
            }

            throw new Error(
                `商品名の検証に失敗しました (Status: ${response.status})`
            );
        }
    }

    /**
     * 商品カテゴリをすべて取得する
     */
    public async getCategories(): Promise<ProductCategory[]> {
        const url = "/proxy-api/admin/product/categories";

        const response = await fetch(url, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));

            console.log("========== API ERROR ==========");
            console.log("categories url:", url);
            console.log("categories status:", response.status);
            console.log("categories error body:", errorData);
            console.log("===============================");

            if (errorData.message) {
                throw new Error(errorData.message);
            }

            if (errorData.errors) {
                const messages = Object.values(errorData.errors)
                    .flat()
                    .join("\n");

                throw new Error(messages);
            }

            throw new Error(
                `商品カテゴリの取得に失敗しました (Status: ${response.status})`
            );
        }

        return await response.json();
    }

    /**
     * 商品を登録する
     */
    public async register(product: Product): Promise<Product> {
        const url = "/proxy-api/admin/product/register";

        /*
         * バックエンドのRegisterViewModelに合わせて、
         * Productから登録用JSONへ変換する。
         */
        const requestBody = {
            name: product.name,
            price: product.price,
            stock: product.productStock?.quantity ?? 0,
            categoryUuid:
                product.productCategory?.categoryUuid ?? null,
            categoryName:
                product.productCategory?.name ?? "",
        };

        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));

            console.log("========== REGISTER PRODUCT ==========");
            console.log("register url:", url);
            console.log("request body:", requestBody);
            console.log("status:", response.status);
            console.log("error body:", errorData);
            console.log("======================================");

            /*
             * 今回のControllerは基本的に、
             * { code, message } の形式でエラーを返す。
             */
            if (errorData.message) {
                throw new Error(errorData.message);
            }

            /*
             * ASP.NET Core標準のValidationProblemDetailsが
             * 返された場合にも対応する。
             */
            if (errorData.errors) {
                const fieldErrors: { [key: string]: string } = {};

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
                `商品の登録に失敗しました (Status: ${response.status})`
            );
        }

        return await response.json();
    }

    /**
     * 商品を更新する
     */
    public async updateById(
        product: Product
    ): Promise<boolean> {
        // TODO: 実際のControllerのURLに合わせて修正する
        const url =
            `/proxy-api/admin/product/${product.productUuid}`;

        const requestBody = {
            name: product.name,
            price: product.price,
            imageUrl: product.imageUrl,
            stockQuantity:
                product.productStock?.quantity ?? 0,
            productCategoryUuid:
                product.productCategory?.categoryUuid ?? null,
        };

        const response = await fetch(url, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(requestBody),
        });

        const responseText = await response.clone().text();

        console.log("========== UPDATE PRODUCT ==========");
        console.log("update url:", url);
        console.log("request body:", requestBody);
        console.log("status:", response.status);
        console.log("ok:", response.ok);
        console.log("response body:", responseText);
        console.log("====================================");

        if (response.status === 404) {
            return false;
        }

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));

            if (errorData.message) {
                throw new Error(errorData.message);
            }

            if (errorData.errors) {
                const fieldErrors: { [key: string]: string } = {};

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
                `商品の更新に失敗しました (Status: ${response.status})`
            );
        }

        return true;
    }

    /**
     * 商品を削除する
     */
    public async deleteById(
        productUuid: string
    ): Promise<boolean> {
        // TODO: 実際のControllerのURLに合わせて修正する
        const url =
            `/proxy-api/admin/product/${productUuid}`;

        const response = await fetch(url, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
            },
        });

        if (response.status === 404) {
            return false;
        }

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));

            console.log("========== DELETE PRODUCT ==========");
            console.log("delete url:", url);
            console.log("status:", response.status);
            console.log("error body:", errorData);
            console.log("====================================");

            if (errorData.message) {
                throw new Error(errorData.message);
            }

            if (errorData.errors) {
                const messages = Object.values(errorData.errors)
                    .flat()
                    .join("\n");

                throw new Error(messages);
            }

            throw new Error(
                `商品の削除に失敗しました (Status: ${response.status})`
            );
        }

        return true;
    }
}