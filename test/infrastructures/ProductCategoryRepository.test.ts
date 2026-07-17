import { describe, it, expect, beforeEach, vi } from "vitest";
import { ProductCategoryRepository } from "@/infrastructures/ProductCategoryRepository";
import type { ProductCategory } from "@/models/ProductCategory";


describe("ProductCategoryRepository", () => {

    let repository: ProductCategoryRepository;

    let fetchMock: ReturnType<typeof vi.fn>;


    const createCategory = (
        override?: Partial<ProductCategory>
    ): ProductCategory => ({
        categoryUuid: "category-uuid-001",
        name: "食品",
        ...override,
    });


    const createResponse = (
        body: unknown,
        status = 200
    ) =>
    ({
        ok: status >= 200 && status < 300,
        status,
        json: vi.fn()
            .mockResolvedValue(body),
    } as unknown as Response);


    const createErrorResponse = (
        body: unknown,
        status = 400
    ) =>
    ({
        ok: false,
        status,
        json: vi.fn()
            .mockResolvedValue(body),
    } as unknown as Response);



    beforeEach(() => {
        repository =
            new ProductCategoryRepository();

        fetchMock = vi.fn();

        global.fetch =
            fetchMock as unknown as typeof fetch;
    });



    describe("findAll", () => {

        it("商品カテゴリ一覧を取得して返す", async () => {

            const categories = [
                createCategory()
            ];

            fetchMock.mockResolvedValue(
                createResponse(categories)
            );


            const result =
                await repository.findAll();


            expect(result)
                .toEqual(categories);


            expect(fetchMock)
                .toHaveBeenCalledWith(
                    "/proxy-api/product/categories",
                    expect.objectContaining({
                        method: "GET",
                    })
                );
        });



        it("messageがある場合はmessageをthrowする", async () => {

            fetchMock.mockResolvedValue(
                createErrorResponse({
                    message:
                        "取得できません"
                })
            );


            await expect(
                repository.findAll()
            )
                .rejects
                .toThrow(
                    "取得できません"
                );
        });



        it("errorsがある場合はerrors内容をthrowする", async () => {

            fetchMock.mockResolvedValue(
                createErrorResponse({
                    errors: {
                        Name: [
                            "カテゴリ名エラー"
                        ]
                    }
                })
            );


            await expect(
                repository.findAll()
            )
                .rejects
                .toThrow(
                    "カテゴリ名エラー"
                );
        });



        it("messageもerrorsもない場合はステータスエラーをthrowする", async () => {

            fetchMock.mockResolvedValue(
                createErrorResponse(
                    {},
                    500
                )
            );


            await expect(
                repository.findAll()
            )
                .rejects
                .toThrow(
                    "商品カテゴリ一覧の取得に失敗しました (Status: 500)"
                );
        });



        it("JSON解析失敗時はステータスエラーをthrowする", async () => {

            fetchMock.mockResolvedValue({
                ok: false,
                status: 500,
                json: vi.fn()
                    .mockRejectedValue(
                        new Error("JSON Error")
                    ),
            } as unknown as Response);


            await expect(
                repository.findAll()
            )
                .rejects
                .toThrow(
                    "商品カテゴリ一覧の取得に失敗しました (Status: 500)"
                );
        });
    });




    describe("findById", () => {

        it("存在するカテゴリの場合はカテゴリを返す", async () => {

            fetchMock.mockResolvedValue(
                createResponse([
                    createCategory({
                        categoryUuid:
                            "target-id"
                    })
                ])
            );


            const result =
                await repository.findById(
                    "target-id"
                );


            expect(result)
                .not
                .toBeNull();


            expect(result?.categoryUuid)
                .toBe(
                    "target-id"
                );
        });



        it("存在しないカテゴリの場合はnullを返す", async () => {

            fetchMock.mockResolvedValue(
                createResponse([
                    createCategory()
                ])
            );


            const result =
                await repository.findById(
                    "not-found"
                );


            expect(result)
                .toBeNull();
        });
    });




    describe("existsByName", () => {

        it("カテゴリ名が存在しない場合は正常終了する", async () => {

            fetchMock.mockResolvedValue(
                createResponse({})
            );


            await expect(
                repository.existsByName(
                    "食品"
                )
            )
                .resolves
                .toBeUndefined();
        });



        it("messageエラーの場合はthrowする", async () => {

            fetchMock.mockResolvedValue(
                createErrorResponse({
                    message:
                        "すでに登録されています"
                })
            );


            await expect(
                repository.existsByName(
                    "食品"
                )
            )
                .rejects
                .toThrow(
                    "すでに登録されています"
                );
        });



        it("errorsエラーの場合はthrowする", async () => {

            fetchMock.mockResolvedValue(
                createErrorResponse({
                    errors: {
                        CategoryName:[
                            "カテゴリ名重複"
                        ]
                    }
                })
            );


            await expect(
                repository.existsByName(
                    "食品"
                )
            )
                .rejects
                .toThrow(
                    "カテゴリ名重複"
                );
        });



        it("既定エラーの場合はthrowする", async () => {

            fetchMock.mockResolvedValue(
                createErrorResponse(
                    {},
                    500
                )
            );


            await expect(
                repository.existsByName(
                    "食品"
                )
            )
                .rejects
                .toThrow(
                    "商品カテゴリ名の検証に失敗しました (Status: 500)"
                );
        });
    });





    describe("create", () => {

        it("カテゴリ登録成功時は登録カテゴリを返す", async () => {

            const category =
                createCategory();


            fetchMock.mockResolvedValue(
                createResponse({
                    message:
                        "登録成功",
                    category,
                })
            );


            const result =
                await repository.create(
                    category
                );


            expect(result)
                .toEqual(category);



            expect(fetchMock)
                .toHaveBeenCalledWith(
                    "/proxy-api/category/register",
                    expect.objectContaining({
                        method:"POST"
                    })
                );
        });



        it("messageエラーの場合はthrowする", async () => {

            fetchMock.mockResolvedValue(
                createErrorResponse({
                    message:
                        "登録失敗"
                })
            );


            await expect(
                repository.create(
                    createCategory()
                )
            )
                .rejects
                .toThrow(
                    "登録失敗"
                );
        });



        it("validation errorsの場合はvalidation形式でthrowする", async () => {

            fetchMock.mockResolvedValue(
                createErrorResponse({
                    errors:{
                        CategoryName:[
                            "カテゴリ名は必須です"
                        ]
                    }
                })
            );


            await expect(
                repository.create(
                    createCategory()
                )
            )
                .rejects
                .toThrow(
                    "カテゴリ名は必須です"
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
                repository.create(
                    createCategory()
                )
            )
                .rejects
                .toThrow(
                    "商品カテゴリの登録に失敗しました (Status: 500)"
                );
        });



        it("validation errorsが文字列の場合も処理する", async () => {

            fetchMock.mockResolvedValue(
                createErrorResponse({
                    errors:{
                        CategoryName:
                            "カテゴリ名エラー"
                    }
                })
            );


            await expect(
                repository.create(
                    createCategory()
                )
            )
                .rejects
                .toThrow(
                    "カテゴリ名エラー"
                );
        });
    });
});