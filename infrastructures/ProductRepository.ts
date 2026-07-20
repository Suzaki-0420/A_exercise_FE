import { IProductRepository } from "@/interfaces/IProductRepository";
import { Product } from "@/models/Product";
import { ProductCategory } from "@/models/ProductCategory";
import { injectable } from "inversify";

@injectable()
export class ProductRepository implements IProductRepository {
    /**
     * すべての商品を取得する
     */
    public async findAll(): Promise<Product[]> {
        const url = "/proxy-api/product/category";

        const response = await fetch(url, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
            credentials: "include",
        });

        return await response.json();
    }

    /**
     * 商品UUIDを指定して商品を取得する
     */
    public async findById(
        productUuid: string
    ): Promise<Product | null> {
        const url =
            `/proxy-api/product/edit/${encodeURIComponent(productUuid)}`;

        const response = await fetch(url, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
            credentials: "include",
        });

        if (response.status === 404) {
            return null;
        }

        return await response.json();
    }
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
        const url = `/proxy-api/product/keyword?${params.toString()}`;

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
 *
 * categoryUuidが空文字の場合は、
 * productCategoryUuidをクエリへ追加せず、
 * 全商品を取得する。
 */
    public async selectByProductCategoryId(
        categoryUuid: string,
        showDeletedOnly: boolean
    ): Promise<Product[]> {
        const params = new URLSearchParams();

        /*
         * カテゴリUUIDが指定されている場合のみ追加する。
         *
         * 空文字を
         * productCategoryUuid=
         * として送ると、バックエンド側で
         * Guidへの変換に失敗する。
         */
        if (categoryUuid) {
            params.append(
                "productCategoryUuid",
                categoryUuid
            );
        }

        params.append(
            "showDeletedOnly",
            String(showDeletedOnly)
        );

        const queryString =
            params.toString();

        const url =
            queryString
                ? `/proxy-api/product/category?${queryString}`
                : "/proxy-api/product/category";

        console.log(
            "カテゴリ検索URL:",
            url
        );

        const response = await fetch(url, {
            method: "GET",
            cache: "no-store",
        });

        if (!response.ok) {
            const errorText =
                await response.text();

            console.error(
                "========== API ERROR =========="
            );
            console.error(
                "search url:",
                url
            );
            console.error(
                "search status:",
                response.status
            );
            console.error(
                "search statusText:",
                response.statusText
            );
            console.error(
                "search error body:",
                errorText
            );
            console.error(
                "==============================="
            );

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
            `/proxy-api/product/validate?${params.toString()}`;

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
 * 商品を登録する
 */
    public async register(
        product: Product,
        imageFile: File
    ): Promise<Product> {
        const url = "/proxy-api/product/register";

        /*
         * 画像ファイルを送信するため、
         * JSONではなくFormDataを使用する。
         */
        const requestFormData = new FormData();

        /*
         * バックエンドのRegisterViewModelのプロパティ名に合わせる。
         */
        requestFormData.append(
            "name",
            product.name
        );

        requestFormData.append(
            "price",
            String(product.price)
        );

        requestFormData.append(
            "stock",
            String(
                product.productStock?.quantity ?? 0
            )
        );

        requestFormData.append(
            "categoryUuid",
            product.productCategory
                ?.categoryUuid ?? ""
        );

        requestFormData.append(
            "categoryName",
            product.productCategory?.name ?? ""
        );

        /*
         * 画像が選択されている場合だけ追加する。
         *
         * バックエンド側のIFormFileプロパティ名が
         * Imageなら、ここも"image"にする。
         */
        if (imageFile) {
            requestFormData.append(
                "image",
                imageFile
            );
        }

        const response = await fetch(url, {
            method: "POST",

            /*
             * Content-Typeは自分で指定しない。
             *
             * FormDataをbodyに渡すと、
             * ブラウザがboundary付きの
             * multipart/form-dataを自動設定する。
             */
            body: requestFormData,
        });

        if (!response.ok) {
            const errorData = await response
                .json()
                .catch(() => ({}));

            console.log(
                "========== REGISTER PRODUCT =========="
            );
            console.log("register url:", url);

            /*
             * FormDataはそのままでは中身を確認しにくいため、
             * Entriesを配列にしてログへ出す。
             */
            console.log(
                "request form data:",
                Array.from(requestFormData.entries())
            );

            console.log("status:", response.status);
            console.log("error body:", errorData);
            console.log(
                "======================================"
            );

            /*
             * ASP.NET Core標準の
             * ValidationProblemDetails形式に対応する。
             *
             * { errors: { Name: ["..."] } }
             */
            if (errorData.errors) {
                const fieldErrors: {
                    [key: string]: string;
                } = {};

                Object.entries(
                    errorData.errors
                ).forEach(([key, value]) => {
                    const normalizedKey =
                        key.charAt(0).toLowerCase() +
                        key.slice(1);

                    fieldErrors[normalizedKey] =
                        Array.isArray(value)
                            ? String(value[0])
                            : String(value);
                });

                throw new Error(
                    JSON.stringify({
                        type: "validation",
                        errors: fieldErrors,
                    })
                );
            }

            /*
             * 今回のControllerが返す
             * { code, message } 形式に対応する。
             */
            if (errorData.message) {
                throw new Error(
                    errorData.message
                );
            }

            throw new Error(
                `商品の登録に失敗しました ` +
                `(Status: ${response.status})`
            );
        }

        return await response.json();
    }

    /**
     * 商品を更新する
     */
    public async updateById(
        product: Product,
        imageFile: File | null = null
    ): Promise<boolean> {
        const url =
            `/proxy-api/product/edit/${encodeURIComponent(product.productUuid)}`;

        const requestBody = new FormData();
        requestBody.append("Name", product.name);
        requestBody.append(
            "Price",
            String(product.price)
        );
        requestBody.append(
            "StockQuantity",
            String(product.productStock?.quantity ?? 0)
        );
        requestBody.append(
            "CategoryUuid",
            product.productCategory?.categoryUuid ?? ""
        );

        if (imageFile) {
            requestBody.append("Image", imageFile);
        }

        const response = await fetch(url, {
            method: "PUT",
            credentials: "include",
            body: requestBody,
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
            `/proxy-api/product/delete/${productUuid}`;

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
