import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ProductRepository } from "@/infrastructures/ProductRepository";
import type { Product } from "@/models/Product";
import type { ProductCategory } from "@/models/ProductCategory";
import type { ProductStock } from "@/models/ProductStock";

describe("ProductRepository", () => {
    let repository: ProductRepository;

    const fetchMock = vi.fn();

    const category: ProductCategory = {
        categoryUuid: "category-uuid",
        name: "食品",
    };

    const stock: ProductStock = {
        stockUuid: "stock-uuid",
        quantity: 10,
    };

    const createProduct = (
        overrides: Partial<Product> = {}
    ): Product => ({
        productUuid: "product-uuid",
        name: "りんご",
        price: 100,
        imageUrl: "/images/apple.png",
        productCategory: category,
        productStock: stock,
        deleteFlg: 0,
        ...overrides,
    });

    const createResponse = (
        body: unknown,
        init: ResponseInit = {}
    ): Response =>
        new Response(JSON.stringify(body), {
            status: init.status ?? 200,
            headers: {
                "Content-Type": "application/json",
            },
        });

    const createErrorResponse = (
        body: unknown,
        status = 400
    ): Response =>
        createResponse(body, { status });

    beforeEach(() => {
        repository = new ProductRepository();

        fetchMock.mockReset();

        vi.stubGlobal("fetch", fetchMock);
    });

    afterEach(() => {
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
    });

    describe("findAll", () => {
        it("商品が存在する場合は商品配列を返す", async () => {
            const products = [createProduct()];

            fetchMock.mockResolvedValue(createResponse(products));

            const result = await repository.findAll();

            expect(result).toEqual(products);
            expect(fetchMock).toHaveBeenCalledTimes(1);
        });

        it("商品が存在しない場合は空配列を返す", async () => {
            fetchMock.mockResolvedValue(createResponse([]));

            const result = await repository.findAll();

            expect(result).toEqual([]);
        });

        it("fetchが失敗した場合は例外をそのまま投げる", async () => {
            const error = new Error("Network Error");

            fetchMock.mockRejectedValue(error);

            await expect(repository.findAll()).rejects.toThrow(error);
        });

        it("レスポンスのJSON解析に失敗した場合は例外を投げる", async () => {
            const json = vi.fn().mockRejectedValue(new Error("JSON Error"));

            fetchMock.mockResolvedValue({
                json,
            });

            await expect(repository.findAll()).rejects.toThrow("JSON Error");
        });

        it("正しいURL・HTTPメソッド・ヘッダー・credentialsで通信する", async () => {
            fetchMock.mockResolvedValue(createResponse([]));

            await repository.findAll();

            expect(fetchMock).toHaveBeenCalledWith(
                "/proxy-api/product/category",
                {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    credentials: "include",
                }
            );
        });
    });

    describe("findById", () => {
        it("商品が存在する場合は商品を返す", async () => {
            const product = createProduct();

            fetchMock.mockResolvedValue(
                createResponse(product, { status: 200 })
            );

            const result = await repository.findById(
                "product-uuid"
            );

            expect(result).toEqual(product);
        });

        it("商品が存在しない場合はnullを返す", async () => {
            const json = vi.fn();

            fetchMock.mockResolvedValue({
                status: 404,
                json,
            });

            const result = await repository.findById(
                "not-found"
            );

            expect(result).toBeNull();
            expect(json).not.toHaveBeenCalled();
        });

        it("fetchが失敗した場合は例外をそのまま投げる", async () => {
            const error = new Error("Network Error");

            fetchMock.mockRejectedValue(error);

            await expect(
                repository.findById("product-uuid")
            ).rejects.toThrow(error);
        });

        it("レスポンスのJSON解析に失敗した場合は例外を投げる", async () => {
            const json = vi.fn()
                .mockRejectedValue(
                    new Error("JSON Error")
                );

            fetchMock.mockResolvedValue({
                status: 200,
                json,
            });

            await expect(
                repository.findById("product-uuid")
            ).rejects.toThrow("JSON Error");
        });

        it("500レスポンスの場合もJSON結果を返す", async () => {
            const product = createProduct();

            fetchMock.mockResolvedValue(
                createResponse(product, {
                    status: 500,
                })
            );

            const result =
                await repository.findById(
                    "product-uuid"
                );

            expect(result).toEqual(product);
        });
    });

    describe("searchKeyword", () => {
        it("該当する商品が存在する場合は商品配列を返す", async () => {
            const products = [createProduct()];

            fetchMock.mockResolvedValue(
                createResponse(products)
            );

            const result =
                await repository.searchKeyword(
                    "りんご",
                    false
                );

            expect(result).toEqual(products);
        });

        it("該当する商品が存在しない場合は空配列を返す", async () => {
            fetchMock.mockResolvedValue(
                createResponse([])
            );

            const result =
                await repository.searchKeyword(
                    "存在しない商品",
                    false
                );

            expect(result).toEqual([]);
        });

        it("HTTPエラーの場合はステータスを含む例外を投げる", async () => {
            fetchMock.mockResolvedValue({
                ok: false,
                status: 500,
                clone: () => ({
                    text: vi.fn()
                        .mockResolvedValue("error"),
                }),
            });

            await expect(
                repository.searchKeyword(
                    "りんご",
                    false
                )
            ).rejects.toThrow(
                "商品の検索に失敗しました (Status: 500)"
            );
        });

        it("fetchが失敗した場合は例外をそのまま投げる", async () => {
            const error =
                new Error("Network Error");

            fetchMock.mockRejectedValue(error);

            await expect(
                repository.searchKeyword(
                    "りんご",
                    false
                )
            ).rejects.toThrow(error);
        });

        it("正常レスポンスのJSON解析に失敗した場合は例外を投げる", async () => {
            const json = vi.fn()
                .mockRejectedValue(
                    new Error("JSON Error")
                );

            fetchMock.mockResolvedValue({
                ok: true,
                json,
            });

            await expect(
                repository.searchKeyword(
                    "りんご",
                    false
                )
            ).rejects.toThrow(
                "JSON Error"
            );
        });

        it("キーワードとshowDeletedOnly=trueをURLに含める", async () => {
            fetchMock.mockResolvedValue(
                createResponse([])
            );

            await repository.searchKeyword(
                "削除済み",
                true
            );

            const expectedUrl =
                `/proxy-api/product/keyword?keyword=${encodeURIComponent(
                    "削除済み"
                )}&showDeletedOnly=true`;

            expect(fetchMock)
                .toHaveBeenCalledWith(
                    expectedUrl,
                    {
                        method: "GET",
                        headers: {
                            "Content-Type":
                                "application/json",
                        },
                    }
                );
        });
    });

    describe("selectByProductCategoryId", () => {
        it("カテゴリに属する商品が存在する場合は商品配列を返す", async () => {
            const products = [createProduct()];

            fetchMock.mockResolvedValue(
                createResponse(products)
            );

            const result =
                await repository.selectByProductCategoryId(
                    "category-uuid",
                    false
                );

            expect(result).toEqual(products);
        });

        it("カテゴリに属する商品が存在しない場合は空配列を返す", async () => {
            fetchMock.mockResolvedValue(
                createResponse([])
            );

            const result =
                await repository.selectByProductCategoryId(
                    "category-uuid",
                    false
                );

            expect(result).toEqual([]);
        });

        it("カテゴリUUIDが空文字の場合はproductCategoryUuidを送信しない", async () => {

            fetchMock.mockResolvedValue(
                createResponse([])
            );


            await repository.selectByProductCategoryId(
                "",
                false
            );


            expect(fetchMock)
                .toHaveBeenCalledWith(
                    "/proxy-api/product/category?showDeletedOnly=false",
                    expect.objectContaining({
                        method: "GET",
                        cache: "no-store",
                    })
                );
        });

        it("HTTPエラーの場合はステータスを含む例外を投げる", async () => {

            fetchMock.mockResolvedValue({
                ok: false,
                status: 500,
                statusText: "Internal Server Error",

                text: vi.fn()
                    .mockResolvedValue("error"),

            } as unknown as Response);


            await expect(
                repository.selectByProductCategoryId(
                    "category-uuid",
                    false
                )
            )
                .rejects
                .toThrow(
                    "商品カテゴリによる検索に失敗しました (Status: 500)"
                );
        });

        it("HTTPエラー時にstatusTextが未定義でも例外を投げる", async () => {

            fetchMock.mockResolvedValue({
                ok: false,
                status: 400,

                text: vi.fn()
                    .mockResolvedValue(
                        "Bad Request"
                    ),

            } as unknown as Response);


            await expect(
                repository.selectByProductCategoryId(
                    "category-uuid",
                    false
                )
            )
                .rejects
                .toThrow(
                    "商品カテゴリによる検索に失敗しました (Status: 400)"
                );
        });

        it("fetchが失敗した場合は例外をそのまま投げる", async () => {
            const error =
                new Error("Network Error");

            fetchMock.mockRejectedValue(error);

            await expect(
                repository.selectByProductCategoryId(
                    "category-uuid",
                    false
                )
            ).rejects.toThrow(error);
        });

        it("正常レスポンスのJSON解析に失敗した場合は例外を投げる", async () => {
            const json = vi.fn()
                .mockRejectedValue(
                    new Error("JSON Error")
                );

            fetchMock.mockResolvedValue({
                ok: true,
                json,
            });

            await expect(
                repository.selectByProductCategoryId(
                    "category-uuid",
                    false
                )
            ).rejects.toThrow(
                "JSON Error"
            );
        });

        it("カテゴリUUIDとshowDeletedOnly=falseをURLに含める", async () => {
            fetchMock.mockResolvedValue(
                createResponse([])
            );

            await repository.selectByProductCategoryId(
                "category+uuid",
                false
            );

            const expectedUrl =
                `/proxy-api/product/category?productCategoryUuid=${encodeURIComponent(
                    "category+uuid"
                )}&showDeletedOnly=false`;


            expect(fetchMock)
                .toHaveBeenCalledWith(
                    expectedUrl,
                    expect.objectContaining({
                        method: "GET",
                    })
                );
        });
        it("カテゴリUUIDとshowDeletedOnly=trueをURLに含める", async () => {
            fetchMock.mockResolvedValue(
                createResponse([])
            );

            await repository.selectByProductCategoryId(
                "category-uuid",
                true
            );

            const expectedUrl =
                `/proxy-api/product/category?productCategoryUuid=${encodeURIComponent(
                    "category-uuid"
                )}&showDeletedOnly=true`;


            expect(fetchMock)
                .toHaveBeenCalledWith(
                    expectedUrl,
                    expect.objectContaining({
                        method: "GET",
                    })
                );
        });

        it("カテゴリUUIDが空文字の場合はproductCategoryUuidを送信しない", async () => {
            fetchMock.mockResolvedValue(
                createResponse([])
            );


            await repository.selectByProductCategoryId(
                "",
                false
            );


            expect(fetchMock)
                .toHaveBeenCalledWith(
                    "/proxy-api/product/category?showDeletedOnly=false",
                    expect.objectContaining({
                        method: "GET",
                        cache: "no-store",
                    })
                );
        });


        it("HTTPエラー時にresponse.text()が失敗しても例外を投げる", async () => {

            fetchMock.mockResolvedValue({
                ok: false,
                status: 500,
                statusText: "Internal Server Error",

                text: vi.fn()
                    .mockRejectedValue(
                        new Error("Text Error")
                    ),

            } as unknown as Response);


            await expect(
                repository.selectByProductCategoryId(
                    "category-uuid",
                    false
                )
            )
                .rejects
                .toThrow(
                    "Text Error"
                );
        });

        it("カテゴリUUIDに特殊文字がある場合URLエンコードする", async () => {

            fetchMock.mockResolvedValue(
                createResponse([])
            );


            await repository.selectByProductCategoryId(
                "category uuid/test",
                false
            );


            expect(fetchMock)
                .toHaveBeenCalledWith(
                    "/proxy-api/product/category?productCategoryUuid=category+uuid%2Ftest&showDeletedOnly=false",
                    expect.objectContaining({
                        method: "GET",
                        cache: "no-store",
                    })
                );
        });

        it("queryStringが空の場合はクエリなしURLを使用する", async () => {

            const originalURLSearchParams =
                global.URLSearchParams;


            class EmptyURLSearchParams {

                append() {
                    // 何もしない
                }

                toString() {
                    return "";
                }
            }


            global.URLSearchParams =
                EmptyURLSearchParams as unknown as typeof URLSearchParams;

            fetchMock.mockResolvedValue(
                createResponse([])
            );


            await repository.selectByProductCategoryId(
                "",
                false
            );


            expect(fetchMock)
                .toHaveBeenCalledWith(
                    "/proxy-api/product/category",
                    expect.objectContaining({
                        method: "GET",
                        cache: "no-store",
                    })
                );


            global.URLSearchParams =
                originalURLSearchParams;

        });
    });

    describe("existsByName", () => {
        it("正常レスポンスの場合は例外を投げずに終了する", async () => {
            fetchMock.mockResolvedValue(
                createResponse({})
            );

            await expect(
                repository.existsByName("りんご")
            ).resolves.toBeUndefined();
        });

        it("messageを含むエラーの場合はmessageの内容で例外を投げる", async () => {
            fetchMock.mockResolvedValue(
                createErrorResponse(
                    {
                        message: "商品名は既に登録されています",
                    },
                    400
                )
            );

            await expect(
                repository.existsByName("りんご")
            ).rejects.toThrow(
                "商品名は既に登録されています"
            );
        });

        it("errorsを含むエラーの場合は各メッセージを結合して例外を投げる", async () => {
            fetchMock.mockResolvedValue(
                createErrorResponse(
                    {
                        errors: {
                            Name: [
                                "商品名は必須です",
                                "商品名が重複しています",
                            ],
                            Price: [
                                "価格が不正です",
                            ],
                        },
                    },
                    400
                )
            );

            await expect(
                repository.existsByName("りんご")
            ).rejects.toThrow(
                "商品名は必須です\n商品名が重複しています\n価格が不正です"
            );
        });

        it("messageもerrorsもない場合は既定の例外を投げる", async () => {
            fetchMock.mockResolvedValue(
                createErrorResponse(
                    {},
                    500
                )
            );

            await expect(
                repository.existsByName("りんご")
            ).rejects.toThrow(
                "商品名の検証に失敗しました (Status: 500)"
            );
        });

        it("エラーJSONの解析に失敗した場合は既定の例外を投げる", async () => {
            fetchMock.mockResolvedValue({
                ok: false,
                status: 500,
                json: vi.fn()
                    .mockRejectedValue(
                        new Error("JSON Error")
                    ),
            });

            await expect(
                repository.existsByName("りんご")
            ).rejects.toThrow(
                "商品名の検証に失敗しました (Status: 500)"
            );
        });
    });

    describe("register", () => {
        const createFile = () =>
            new File(
                ["image"],
                "test.png",
                {
                    type: "image/png",
                }
            );

        it("正常に商品を登録できる", async () => {
            const product = createProduct();
            const responseProduct = createProduct({
                productUuid: "registered-uuid",
            });

            fetchMock.mockResolvedValue(
                createResponse(responseProduct)
            );

            const result =
                await repository.register(
                    product,
                    createFile()
                );

            expect(result).toEqual(responseProduct);
        });

        it("正しいURLとPOSTメソッドでFormDataを送信する", async () => {
            const product = createProduct();

            fetchMock.mockResolvedValue(
                createResponse(product)
            );

            await repository.register(
                product,
                createFile()
            );

            expect(fetchMock).toHaveBeenCalled();

            const [url, options] =
                fetchMock.mock.calls[0];

            expect(url)
                .toBe("/proxy-api/product/register");

            expect(options.method)
                .toBe("POST");

            expect(options.body)
                .toBeInstanceOf(FormData);
        });

        it("商品情報をFormDataへ格納する", async () => {
            const product = createProduct();

            fetchMock.mockResolvedValue(
                createResponse(product)
            );

            await repository.register(
                product,
                createFile()
            );

            const [, options] =
                fetchMock.mock.calls[0];

            const formData =
                options.body as FormData;

            expect(formData.get("name"))
                .toBe("りんご");

            expect(formData.get("price"))
                .toBe("100");

            expect(formData.get("stock"))
                .toBe("10");

            expect(formData.get("categoryUuid"))
                .toBe("category-uuid");

            expect(formData.get("categoryName"))
                .toBe("食品");
        });

        it("在庫情報がない場合はstockに0を格納する", async () => {
            const product = createProduct({
                productStock: null,
            });

            fetchMock.mockResolvedValue(
                createResponse(product)
            );

            await repository.register(
                product,
                createFile()
            );

            const [, options] =
                fetchMock.mock.calls[0];

            const formData =
                options.body as FormData;

            expect(formData.get("stock"))
                .toBe("0");
        });

        it("カテゴリ情報がない場合は空文字を格納する", async () => {
            const product = createProduct({
                productCategory: null,
            });

            fetchMock.mockResolvedValue(
                createResponse(product)
            );

            await repository.register(
                product,
                createFile()
            );

            const [, options] =
                fetchMock.mock.calls[0];

            const formData =
                options.body as FormData;

            expect(formData.get("categoryUuid"))
                .toBe("");

            expect(formData.get("categoryName"))
                .toBe("");
        });

        it("画像がある場合はimageをFormDataへ格納する", async () => {
            const product = createProduct();
            const file = createFile();

            fetchMock.mockResolvedValue(
                createResponse(product)
            );

            await repository.register(
                product,
                file
            );

            const [, options] =
                fetchMock.mock.calls[0];

            const formData =
                options.body as FormData;

            expect(formData.get("image"))
                .toBe(file);
        });

        it("画像がない場合はimageをFormDataへ格納しない", async () => {
            const product = createProduct();

            fetchMock.mockResolvedValue(
                createResponse(product)
            );

            await repository.register(
                product,
                null as unknown as File
            );

            const [, options] =
                fetchMock.mock.calls[0];

            const formData =
                options.body as FormData;

            expect(formData.get("image"))
                .toBeNull();
        });

        it("errorsの値が配列の場合はvalidation例外を投げる", async () => {
            fetchMock.mockResolvedValue(
                createErrorResponse(
                    {
                        errors: {
                            Name: [
                                "商品名が必要です",
                            ],
                        },
                    },
                    400
                )
            );

            await expect(
                repository.register(
                    createProduct(),
                    createFile()
                )
            ).rejects.toThrow(
                JSON.stringify({
                    type: "validation",
                    errors: {
                        name: "商品名が必要です",
                    },
                })
            );
        });

        it("errorsの値が非配列の場合はvalidation例外を投げる", async () => {
            fetchMock.mockResolvedValue(
                createErrorResponse(
                    {
                        errors: {
                            Price: "価格が不正です",
                        },
                    },
                    400
                )
            );

            await expect(
                repository.register(
                    createProduct(),
                    createFile()
                )
            ).rejects.toThrow(
                JSON.stringify({
                    type: "validation",
                    errors: {
                        price: "価格が不正です",
                    },
                })
            );
        });

        it("errorsのフィールド名の先頭を小文字へ変換する", async () => {
            fetchMock.mockResolvedValue(
                createErrorResponse(
                    {
                        errors: {
                            Stock: [
                                "在庫数が不正です",
                            ],
                        },
                    },
                    400
                )
            );

            await expect(
                repository.register(
                    createProduct(),
                    createFile()
                )
            ).rejects.toThrow(
                '"stock":"在庫数が不正です"'
            );
        });

        it("messageを含むエラーの場合はmessage内容で例外を投げる", async () => {
            fetchMock.mockResolvedValue(
                createErrorResponse(
                    {
                        message:
                            "登録できません",
                    },
                    500
                )
            );

            await expect(
                repository.register(
                    createProduct(),
                    createFile()
                )
            ).rejects.toThrow(
                "登録できません"
            );
        });

        it("messageもerrorsもない場合は既定の例外を投げる", async () => {
            fetchMock.mockResolvedValue(
                createErrorResponse(
                    {},
                    500
                )
            );

            await expect(
                repository.register(
                    createProduct(),
                    createFile()
                )
            ).rejects.toThrow(
                "商品の登録に失敗しました (Status: 500)"
            );
        });

        it("エラーJSON解析失敗時は既定の例外を投げる", async () => {
            fetchMock.mockResolvedValue({
                ok: false,
                status: 500,
                json: vi.fn()
                    .mockRejectedValue(
                        new Error()
                    ),
            });

            await expect(
                repository.register(
                    createProduct(),
                    createFile()
                )
            ).rejects.toThrow(
                "商品の登録に失敗しました (Status: 500)"
            );
        });

        it("fetchが失敗した場合は例外をそのまま投げる", async () => {
            const error =
                new Error("Network Error");

            fetchMock.mockRejectedValue(error);

            await expect(
                repository.register(
                    createProduct(),
                    createFile()
                )
            ).rejects.toThrow(error);
        });

        it("正常レスポンスのJSON解析に失敗した場合は例外を投げる", async () => {
            fetchMock.mockResolvedValue({
                ok: true,
                json: vi.fn()
                    .mockRejectedValue(
                        new Error("JSON Error")
                    ),
            });

            await expect(
                repository.register(
                    createProduct(),
                    createFile()
                )
            ).rejects.toThrow(
                "JSON Error"
            );
        });
    });

    describe("updateById", () => {
        it("正常更新の場合はtrueを返す", async () => {
            fetchMock.mockResolvedValue(
                createResponse({})
            );

            const result =
                await repository.updateById(
                    createProduct()
                );

            expect(result).toBe(true);
        });

        it("更新対象が存在しない場合はfalseを返す", async () => {
            fetchMock.mockResolvedValue({
                ok: false,
                status: 404,
                clone: () => ({
                    text: async () => "",
                }),
            } as unknown as Response);

            const result =
                await repository.updateById(
                    createProduct()
                );

            expect(result).toBe(false);
        });

        it("PUTで正しいURLへリクエストする", async () => {

            const product =
                createProduct({
                    productUuid:
                        "product-uuid-123",
                });


            fetchMock.mockResolvedValue(
                createResponse({})
            );


            await repository.updateById(
                product
            );


            expect(fetchMock)
                .toHaveBeenCalledWith(
                    `/proxy-api/product/edit/${product.productUuid}`,
                    {
                        method: "PUT",
                        credentials: "include",
                        body: expect.any(FormData),
                    }
                );
        });

        it("FormDataに商品情報を含める", async () => {
            const product =
                createProduct();

            fetchMock.mockResolvedValue(
                createResponse({})
            );

            await repository.updateById(
                product
            );

            const [, options] =
                fetchMock.mock.calls[0];

            const body = options.body as FormData;

            expect(body.get("Name"))
                .toBe(product.name);
            expect(body.get("Price"))
                .toBe(String(product.price));
            expect(body.get("StockQuantity"))
                .toBe(String(product.productStock?.quantity));
            expect(body.get("CategoryUuid"))
                .toBe(product.productCategory?.categoryUuid);
            expect(body.has("Image"))
                .toBe(false);
        });

        it("選択した画像をImageとしてFormDataへ追加する", async () => {
            const imageFile = new File(
                ["image-data"],
                "product.png",
                { type: "image/png" }
            );

            fetchMock.mockResolvedValue(
                createResponse({})
            );

            await repository.updateById(
                createProduct(),
                imageFile
            );

            const [, options] =
                fetchMock.mock.calls[0];
            const body = options.body as FormData;

            expect(body.get("Image"))
                .toBe(imageFile);
        });

        it("validationエラーの場合はvalidation内容をthrowする", async () => {
            fetchMock.mockResolvedValue(
                createErrorResponse(
                    {
                        errors: {
                            Name: [
                                "商品名は必須です",
                            ],
                        },
                    },
                    400
                )
            );

            await expect(
                repository.updateById(
                    createProduct()
                )
            ).rejects.toThrow(
                "商品名は必須です"
            );
        });

        it("messageがある場合はmessage内容をthrowする", async () => {
            fetchMock.mockResolvedValue(
                createErrorResponse(
                    {
                        message:
                            "更新できません",
                    },
                    400
                )
            );

            await expect(
                repository.updateById(
                    createProduct()
                )
            ).rejects.toThrow(
                "更新できません"
            );
        });

        it("messageもerrorsもない場合は既定エラーをthrowする", async () => {
            fetchMock.mockResolvedValue(
                createErrorResponse(
                    {},
                    500
                )
            );

            await expect(
                repository.updateById(
                    createProduct()
                )
            ).rejects.toThrow(
                "商品の更新に失敗しました (Status: 500)"
            );
        });

        it("エラーJSON解析失敗時は既定エラーをthrowする", async () => {
            fetchMock.mockResolvedValue({
                ok: false,
                status: 500,

                clone: vi.fn().mockReturnValue({
                    text: vi.fn().mockResolvedValue("")
                }),

                json: vi.fn()
                    .mockRejectedValue(
                        new Error("JSON Error")
                    ),
            } as unknown as Response);

            await expect(
                repository.updateById(
                    createProduct()
                )
            ).rejects.toThrow(
                "商品の更新に失敗しました (Status: 500)"
            );
        });

        it("fetch失敗時は例外をそのままthrowする", async () => {
            const error =
                new Error("Network Error");

            fetchMock.mockRejectedValue(error);

            await expect(
                repository.updateById(
                    createProduct()
                )
            ).rejects.toThrow(error);
        });

        it("正常レスポンスの場合はtrueを返す", async () => {
            fetchMock.mockResolvedValue({
                ok: true,
                status: 200,
                clone: vi.fn().mockReturnValue({
                    text: vi.fn().mockResolvedValue("")
                }),
            } as unknown as Response);

            const result =
                await repository.updateById(
                    createProduct()
                );

            expect(result).toBe(true);
        });


        it("在庫情報がない場合はStockQuantityを0で送信する", async () => {
            const product = createProduct({
                productStock: undefined,
            });

            fetchMock.mockResolvedValue(
                createResponse({})
            );

            await repository.updateById(product);

            const [, options] =
                fetchMock.mock.calls[0];

            const body = options.body as FormData;

            expect(body.get("StockQuantity"))
                .toBe("0");
        });

        it("カテゴリ情報がない場合はCategoryUuidを空文字で送信する", async () => {
            const product = createProduct({
                productCategory: undefined,
            });

            fetchMock.mockResolvedValue(
                createResponse({})
            );

            await repository.updateById(product);

            const [, options] =
                fetchMock.mock.calls[0];

            const body = options.body as FormData;

            expect(body.get("CategoryUuid"))
                .toBe("");
        });

        it("validation errorsが文字列の場合もthrowする", async () => {
            fetchMock.mockResolvedValue(
                createErrorResponse(
                    {
                        errors: {
                            Price:
                                "価格が不正です",
                        },
                    },
                    400
                )
            );

            await expect(
                repository.updateById(
                    createProduct()
                )
            ).rejects.toThrow(
                "価格が不正です"
            );
        });

        it("複数validation errorsを整形してthrowする", async () => {
            fetchMock.mockResolvedValue(
                createErrorResponse(
                    {
                        errors: {
                            Name: [
                                "商品名エラー",
                            ],
                            Price: [
                                "価格エラー",
                            ],
                        },
                    },
                    400
                )
            );

            await expect(
                repository.updateById(
                    createProduct()
                )
            ).rejects.toThrow(
                "商品名エラー"
            );
        });

        it("response text取得失敗時は例外をthrowする", async () => {
            fetchMock.mockResolvedValue({
                ok: true,
                status: 200,
                clone: vi.fn().mockReturnValue({
                    text: vi.fn()
                        .mockRejectedValue(
                            new Error("Text Error")
                        ),
                }),
            } as unknown as Response);

            await expect(
                repository.updateById(
                    createProduct()
                )
            ).rejects.toThrow(
                "Text Error"
            );
        });
    });

    describe("deleteById", () => {
        it("正常削除の場合はtrueを返す", async () => {
            fetchMock.mockResolvedValue(
                createResponse({})
            );

            const result =
                await repository.deleteById(
                    "product-uuid"
                );

            expect(result).toBe(true);
        });

        it("削除対象が存在しない場合はfalseを返す", async () => {
            fetchMock.mockResolvedValue({
                ok: false,
                status: 404,
            });

            const result =
                await repository.deleteById(
                    "not-found"
                );

            expect(result).toBe(false);
        });

        it("DELETEメソッドで正しいURLへ通信する", async () => {
            fetchMock.mockResolvedValue(
                createResponse({})
            );

            await repository.deleteById(
                "product-uuid"
            );

            expect(fetchMock)
                .toHaveBeenCalledWith(
                    "/proxy-api/product/delete/product-uuid",
                    {
                        method: "DELETE",
                        headers: {
                            "Content-Type":
                                "application/json",
                        },
                        // credentials:
                        // "include",
                    }
                );
        });

        it("HTTPエラーの場合は例外をthrowする", async () => {
            fetchMock.mockResolvedValue({
                ok: false,
                status: 500,
                json: vi.fn()
                    .mockResolvedValue({
                        message:
                            "削除に失敗しました",
                    }),
            });

            await expect(
                repository.deleteById(
                    "product-uuid"
                )
            ).rejects.toThrow(
                "削除に失敗しました"
            );
        });

        it("messageがないエラーの場合はステータス付き例外をthrowする", async () => {
            fetchMock.mockResolvedValue({
                ok: false,
                status: 500,
                json: vi.fn()
                    .mockResolvedValue({}),
            });

            await expect(
                repository.deleteById(
                    "product-uuid"
                )
            ).rejects.toThrow(
                "商品の削除に失敗しました (Status: 500)"
            );
        });

        it("エラーJSON解析失敗時はステータス付き例外をthrowする", async () => {
            fetchMock.mockResolvedValue({
                ok: false,
                status: 500,
                json: vi.fn()
                    .mockRejectedValue(
                        new Error("JSON Error")
                    ),
            });

            await expect(
                repository.deleteById(
                    "product-uuid"
                )
            ).rejects.toThrow(
                "商品の削除に失敗しました (Status: 500)"
            );
        });

        it("fetch失敗時は例外をそのままthrowする", async () => {
            const error =
                new Error("Network Error");

            fetchMock.mockRejectedValue(error);

            await expect(
                repository.deleteById(
                    "product-uuid"
                )
            ).rejects.toThrow(error);
        });

        it("errorsがある場合はerrors内容を結合してthrowする", async () => {
            fetchMock.mockResolvedValue({
                ok: false,
                status: 400,
                json: vi.fn()
                    .mockResolvedValue({
                        errors: {
                            Name: [
                                "商品名が不正です",
                            ],
                            Price: [
                                "価格が不正です",
                            ],
                        },
                    }),
            });

            await expect(
                repository.deleteById(
                    "product-uuid"
                )
            ).rejects.toThrow(
                "商品名が不正です\n価格が不正です"
            );
        });

        it("errorsが複数メッセージの場合は改行結合してthrowする", async () => {
            fetchMock.mockResolvedValue({
                ok: false,
                status: 400,
                json: vi.fn()
                    .mockResolvedValue({
                        errors: {
                            Product: [
                                "商品が存在しません",
                                "削除できません",
                            ],
                        },
                    }),
            });

            await expect(
                repository.deleteById(
                    "product-uuid"
                )
            ).rejects.toThrow(
                "商品が存在しません\n削除できません"
            );
        });

        it("エラーstatusでもmessageとerrorsがない場合は既定エラーをthrowする", async () => {
            fetchMock.mockResolvedValue({
                ok: false,
                status: 400,
                json: vi.fn()
                    .mockResolvedValue({
                        data: "error",
                    }),
            });

            await expect(
                repository.deleteById(
                    "product-uuid"
                )
            ).rejects.toThrow(
                "商品の削除に失敗しました (Status: 400)"
            );
        });
    });
})
