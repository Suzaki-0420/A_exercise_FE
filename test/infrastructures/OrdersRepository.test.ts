import { describe, it, expect, vi, beforeEach } from "vitest";
import { OrdersRepository } from "@/infrastructures/OrdersRepository";
import type { Orders } from "@/models/Orders";


describe("OrdersRepository", () => {

    let repository: OrdersRepository;

    const fetchMock = vi.fn();


    beforeEach(() => {
        repository = new OrdersRepository();

        global.fetch = fetchMock;

        fetchMock.mockReset();
    });


    const createResponse = (
        body: unknown,
        status = 200
    ) => ({
        ok: true,
        status,
        json: vi.fn()
            .mockResolvedValue(body),
    } as unknown as Response);



    const createErrorResponse = (
        body: unknown,
        status = 400
    ) => ({
        ok: false,
        status,
        json: vi.fn()
            .mockResolvedValue(body),
    } as unknown as Response);



    const createJsonErrorResponse = (
        status = 500
    ) => ({
        ok: false,
        status,
        json: vi.fn()
            .mockRejectedValue(
                new Error()
            ),
    } as unknown as Response);



    const createOrder = (): Orders => ({
        orderUuid: "test-uuid",
        orderStatus: {
            id: 1,
            name: "発送済み"
        }
    } as Orders);



    // ============================
    // findAll
    // ============================

    describe("findAll", () => {

        it("購入履歴一覧を取得できる", async () => {

            const orders = [
                createOrder()
            ];

            fetchMock.mockResolvedValue(
                createResponse({
                    orderList: orders
                })
            );


            await expect(
                repository.findAll()
            )
                .resolves
                .toEqual(orders);
        });



        it("messageエラーの場合throwする", async () => {

            fetchMock.mockResolvedValue(
                createErrorResponse({
                    message: "取得失敗"
                })
            );


            await expect(
                repository.findAll()
            )
                .rejects
                .toThrow("取得失敗");
        });



        it("json解析失敗の場合throwする", async () => {

            fetchMock.mockResolvedValue(
                createJsonErrorResponse()
            );


            await expect(
                repository.findAll()
            )
                .rejects
                .toThrow(
                    "購入履歴一覧の取得に失敗しました (Status: 500)"
                );
        });



        it("通常エラーの場合throwする", async () => {

            fetchMock.mockResolvedValue(
                createErrorResponse({}, 500)
            );


            await expect(
                repository.findAll()
            )
                .rejects
                .toThrow(
                    "購入履歴一覧の取得に失敗しました"
                );
        });

    });



    // ============================
    // search
    // ============================

    describe("search", () => {


        it("条件指定検索できる", async () => {

            fetchMock.mockResolvedValue(
                createResponse({
                    orderList: []
                })
            );


            await expect(
                repository.search(
                    "2026-07-01",
                    "田中"
                )
            )
                .resolves
                .toEqual([]);
        });



        it("条件なしでも検索できる", async () => {

            fetchMock.mockResolvedValue(
                createResponse([])
            );


            await repository.search(
                "",
                ""
            );


            expect(fetchMock)
                .toHaveBeenCalled();
        });



        it("messageエラーの場合throwする", async () => {

            fetchMock.mockResolvedValue(
                createErrorResponse({
                    message: "検索失敗"
                })
            );


            await expect(
                repository.search("", "")
            )
                .rejects
                .toThrow("検索失敗");
        });



        it("errorsエラーの場合throwする", async () => {

            fetchMock.mockResolvedValue(
                createErrorResponse({
                    errors: {
                        Name: [
                            "不正"
                        ]
                    }
                })
            );


            await expect(
                repository.search("", "")
            )
                .rejects
                .toThrow("不正");
        });



        it("既定エラーの場合throwする", async () => {

            fetchMock.mockResolvedValue(
                createErrorResponse({}, 500)
            );


            await expect(
                repository.search("", "")
            )
                .rejects
                .toThrow(
                    "購入履歴の検索に失敗しました"
                );
        });



        it("json解析失敗の場合throwする", async () => {

            fetchMock.mockResolvedValue(
                createJsonErrorResponse()
            );


            await expect(
                repository.search("", "")
            )
                .rejects
                .toThrow();
        });

    });



    // ============================
    // findById
    // ============================

    describe("findById", () => {


        it("注文取得成功", async () => {

            const order = createOrder();

            fetchMock.mockResolvedValue(
                createResponse(order)
            );


            await expect(
                repository.findById("uuid")
            )
                .resolves
                .toEqual(order);
        });



        it("404ならnull", async () => {

            fetchMock.mockResolvedValue(
                createErrorResponse({}, 404)
            );


            await expect(
                repository.findById("uuid")
            )
                .resolves
                .toBeNull();
        });



        it("messageエラー", async () => {

            fetchMock.mockResolvedValue(
                createErrorResponse({
                    message: "取得失敗"
                })
            );


            await expect(
                repository.findById("uuid")
            )
                .rejects
                .toThrow("取得失敗");
        });



        it("既定エラー", async () => {

            fetchMock.mockResolvedValue(
                createErrorResponse({}, 500)
            );


            await expect(
                repository.findById("uuid")
            )
                .rejects
                .toThrow(
                    "注文情報の取得に失敗しました"
                );
        });

        it("エラーレスポンスのjson解析に失敗した場合は既定エラーをthrowする", async () => {

            fetchMock.mockResolvedValue({
                ok: false,
                status: 500,
                json: vi.fn()
                    .mockRejectedValue(
                        new Error("JSON parse error")
                    ),
            } as unknown as Response);


            await expect(
                repository.findById("uuid")
            )
                .rejects
                .toThrow(
                    "注文情報の取得に失敗しました (Status: 500)"
                );
        });

    });

    // ============================
    // confirmStatusUpdate
    // ============================

    describe("confirmStatusUpdate", () => {


        it("注文ステータス確認成功時は注文を返す", async () => {

            const order = createOrder();


            fetchMock.mockResolvedValue(
                createResponse(order)
            );


            await expect(
                repository.confirmStatusUpdate(order)
            )
                .resolves
                .toEqual(order);



            expect(fetchMock)
                .toHaveBeenCalledWith(
                    "/proxy-api/order/status/update/confirm",
                    expect.objectContaining({
                        method: "POST"
                    })
                );
        });



        it("messagesエラーの場合throwする", async () => {

            fetchMock.mockResolvedValue(
                createErrorResponse({
                    messages: [
                        "更新確認失敗"
                    ]
                })
            );


            await expect(
                repository.confirmStatusUpdate(
                    createOrder()
                )
            )
                .rejects
                .toThrow(
                    "更新確認失敗"
                );
        });



        it("errorsエラーの場合validation形式でthrowする", async () => {

            fetchMock.mockResolvedValue(
                createErrorResponse({
                    errors: {
                        OrderStatusId: [
                            "ステータスが不正です"
                        ]
                    }
                })
            );


            await expect(
                repository.confirmStatusUpdate(
                    createOrder()
                )
            )
                .rejects
                .toThrow(
                    "ステータスが不正です"
                );
        });



        it("messageエラーの場合throwする", async () => {

            fetchMock.mockResolvedValue(
                createErrorResponse({
                    message:
                        "更新できません"
                })
            );


            await expect(
                repository.confirmStatusUpdate(
                    createOrder()
                )
            )
                .rejects
                .toThrow(
                    "更新できません"
                );
        });



        it("既定エラーの場合throwする", async () => {

            fetchMock.mockResolvedValue(
                createErrorResponse(
                    {},
                    500
                )
            );


            await expect(
                repository.confirmStatusUpdate(
                    createOrder()
                )
            )
                .rejects
                .toThrow(
                    "注文ステータス更新内容の確認に失敗しました"
                );
        });



        it("json解析失敗の場合throwする", async () => {

            fetchMock.mockResolvedValue(
                createJsonErrorResponse()
            );


            await expect(
                repository.confirmStatusUpdate(
                    createOrder()
                )
            )
                .rejects
                .toThrow();
        });

    });



    // ============================
    // updateStatus
    // ============================

    describe("updateStatus", () => {


        it("注文ステータス更新成功時は注文を返す", async () => {

            const order = createOrder();


            fetchMock.mockResolvedValue(
                createResponse(order)
            );


            await expect(
                repository.updateStatus(order)
            )
                .resolves
                .toEqual(order);



            expect(fetchMock)
                .toHaveBeenCalledWith(
                    "/proxy-api/order/status/update/complete",
                    expect.objectContaining({
                        method: "PUT"
                    })
                );
        });



        it("messagesエラーの場合throwする", async () => {

            fetchMock.mockResolvedValue(
                createErrorResponse({
                    messages: [
                        "更新失敗"
                    ]
                })
            );


            await expect(
                repository.updateStatus(
                    createOrder()
                )
            )
                .rejects
                .toThrow(
                    "更新失敗"
                );
        });



        it("errorsエラーの場合validation形式でthrowする", async () => {

            fetchMock.mockResolvedValue(
                createErrorResponse({
                    errors: {
                        OrderStatus: [
                            "ステータスエラー"
                        ]
                    }
                })
            );


            await expect(
                repository.updateStatus(
                    createOrder()
                )
            )
                .rejects
                .toThrow(
                    "ステータスエラー"
                );
        });



        it("messageエラーの場合throwする", async () => {

            fetchMock.mockResolvedValue(
                createErrorResponse({
                    message:
                        "更新不可"
                })
            );


            await expect(
                repository.updateStatus(
                    createOrder()
                )
            )
                .rejects
                .toThrow(
                    "更新不可"
                );
        });

        it("messagesが空配列の場合は既定エラーをthrowする", async () => {

            fetchMock.mockResolvedValue(
                createErrorResponse({
                    messages: []
                }, 500)
            );


            await expect(
                repository.updateStatus(
                    createOrder()
                )
            )
                .rejects
                .toThrow(
                    "注文ステータスの更新に失敗しました (Status: 500)"
                );
        });

        it("errorsの値が文字列の場合もvalidationエラーとして処理する", async () => {

            fetchMock.mockResolvedValue(
                createErrorResponse({
                    errors: {
                        OrderStatus:
                            "ステータスが不正です"
                    }
                })
            );


            await expect(
                repository.updateStatus(
                    createOrder()
                )
            )
                .rejects
                .toThrow(
                    "ステータスが不正です"
                );
        });

        it("errorsが空オブジェクトの場合validation形式でthrowする", async () => {

            fetchMock.mockResolvedValue(
                createErrorResponse({
                    errors: {}
                })
            );


            await expect(
                repository.updateStatus(
                    createOrder()
                )
            )
                .rejects
                .toThrow(
                    "validation"
                );
        });

        it("messagesが複数の場合は改行結合する", async () => {

            fetchMock.mockResolvedValue(
                createErrorResponse({
                    messages: [
                        "エラー1",
                        "エラー2"
                    ]
                })
            );


            await expect(
                repository.updateStatus(
                    createOrder()
                )
            )
                .rejects
                .toThrow(
                    "エラー1\nエラー2"
                );
        });



        it("既定エラーの場合throwする", async () => {

            fetchMock.mockResolvedValue(
                createErrorResponse(
                    {},
                    500
                )
            );


            await expect(
                repository.updateStatus(
                    createOrder()
                )
            )
                .rejects
                .toThrow(
                    "注文ステータスの更新に失敗しました"
                );
        });



        it("json解析失敗の場合throwする", async () => {

            fetchMock.mockResolvedValue(
                createJsonErrorResponse()
            );


            await expect(
                repository.updateStatus(
                    createOrder()
                )
            )
                .rejects
                .toThrow();
        });

    });


});