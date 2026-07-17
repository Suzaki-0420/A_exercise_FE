import { describe, it, expect, vi, beforeEach } from "vitest";
import { AdminAuthRepository } from "@/infrastructures/AdminAuthRepository";
import {
    AdminLoginError,
    AdminLogoutError
} from "@/models/AdminAuth";


describe("AdminAuthRepository", () => {

    let repository: AdminAuthRepository;

    const fetchMock = vi.fn();


    beforeEach(() => {

        repository =
            new AdminAuthRepository();

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
            .mockResolvedValue(body)
    } as unknown as Response);



    const createErrorResponse = (
        body: unknown,
        status = 400
    ) => ({
        ok: false,
        status,
        json: vi.fn()
            .mockResolvedValue(body)
    } as unknown as Response);



    const createJsonErrorResponse = (
        status = 500
    ) => ({
        ok: false,
        status,
        json: vi.fn()
            .mockRejectedValue(
                new Error()
            )
    } as unknown as Response);



    const credentials = {
        accountName: "admin",
        password: "password"
    };



    const loginUser = {
        accountUuid: "uuid",
        accountName: "admin",
        employeeName: "山田"
    };



    // ============================
    // login
    // ============================

    describe("login", () => {


        it("ログイン成功", async () => {

            fetchMock.mockResolvedValue(
                createResponse({
                    success: true,
                    data: loginUser
                })
            );


            await expect(
                repository.login(
                    credentials
                )
            )
                .resolves
                .toEqual(loginUser);

        });



        it("fetch失敗の場合throwする", async () => {

            fetchMock.mockRejectedValue(
                new Error()
            );


            await expect(
                repository.login(
                    credentials
                )
            )
                .rejects
                .toThrow(
                    "サーバーに接続できませんでした"
                );
        });



        it("errors配列messageを返す", async () => {

            fetchMock.mockResolvedValue(
                createErrorResponse({
                    errors: [
                        {
                            message: "認証失敗"
                        }
                    ]
                },
                    400)
            );


            await expect(
                repository.login(credentials)
            )
                .rejects
                .toThrow(
                    "認証失敗"
                );
        });

        it("errors配列にmessageがない場合は通常エラーになる", async () => {

            fetchMock.mockResolvedValue(
                createErrorResponse(
                    {
                        errors: [
                            {
                                code: "INVALID"
                            }
                        ]
                    },
                    500
                )
            );


            await expect(
                repository.logout()
            )
                .rejects
                .toThrow(
                    "ログアウトできませんでした。しばらく経ってから再度お試しください。"
                );
        });

        it("errors配列内を検索してmessageを取得する", async () => {

            fetchMock.mockResolvedValue(
                createErrorResponse({
                    errors: [
                        {
                            code: "ERROR"
                        },
                        {
                            message: "2件目のエラー"
                        }
                    ]
                })
            );


            await expect(
                repository.logout()
            )
                .rejects
                .toThrow(
                    "2件目のエラー"
                );
        });

        it("messageエラー", async () => {

            fetchMock.mockResolvedValue(
                createErrorResponse({
                    message: "エラー"
                })
            );


            await expect(
                repository.login(credentials)
            )
                .rejects
                .toThrow(
                    "エラー"
                );
        });



        it("400エラー", async () => {

            fetchMock.mockResolvedValue(
                createErrorResponse({}, 400)
            );


            await expect(
                repository.login(credentials)
            )
                .rejects
                .toThrow(
                    "入力内容を確認してください"
                );
        });



        it("401エラー", async () => {

            fetchMock.mockResolvedValue(
                createErrorResponse({}, 401)
            );


            await expect(
                repository.login(credentials)
            )
                .rejects
                .toThrow(
                    "アカウント名またはパスワードが正しくありません"
                );
        });



        it("403エラー", async () => {

            fetchMock.mockResolvedValue(
                createErrorResponse({}, 403)
            );


            await expect(
                repository.login(credentials)
            )
                .rejects
                .toThrow(
                    "アカウントがロック"
                );
        });



        it("500エラー", async () => {

            fetchMock.mockResolvedValue(
                createErrorResponse({}, 500)
            );


            await expect(
                repository.login(credentials)
            )
                .rejects
                .toThrow(
                    "システムエラー"
                );
        });

        it("errors配列にmessageがない場合はstatusエラーへ進む", async () => {

            fetchMock.mockResolvedValue(
                createErrorResponse(
                    {
                        errors: [
                            {
                                code: "INVALID"
                            }
                        ]
                    },
                    400
                )
            );


            await expect(
                repository.login(credentials)
            )
                .rejects
                .toThrow(
                    "入力内容を確認してください。"
                );
        });



        it("field errorsを取得する", async () => {

            fetchMock.mockResolvedValue(
                createErrorResponse({
                    errors: {
                        AccountName: [
                            "必須です"
                        ],
                        Password: [
                            "必須です"
                        ],
                        Other: [
                            "無視"
                        ]
                    }
                })
            );


            try {

                await repository.login(credentials);

            } catch (error) {

                expect(error)
                    .toBeInstanceOf(
                        AdminLoginError
                    );

                expect(
                    (error as AdminLoginError)
                        .fieldErrors
                )
                    .toEqual({
                        accountName: "必須です",
                        password: "必須です"
                    });
            }

        });



        it("レスポンスjson失敗", async () => {

            fetchMock.mockResolvedValue(
                createJsonErrorResponse()
            );


            await expect(
                repository.login(credentials)
            )
                .rejects
                .toThrow(
                    "システムエラー"
                );
        });



        it("成功だがdata形式不正", async () => {

            fetchMock.mockResolvedValue(
                createResponse({
                    success: true,
                    data: {
                        accountUuid: 1
                    }
                })
            );


            await expect(
                repository.login(credentials)
            )
                .rejects
                .toThrow(
                    "ログイン結果を確認できませんでした"
                );
        });

    });





    // ============================
    // logout
    // ============================

    describe("logout", () => {


        it("ログアウト成功", async () => {

            fetchMock.mockResolvedValue(
                createResponse({
                    success: true,
                    data: {
                        loggedOut: true
                    }
                })
            );


            await expect(
                repository.logout()
            )
                .resolves
                .toBeUndefined();

        });



        it("fetch失敗", async () => {

            fetchMock.mockRejectedValue(
                new Error()
            );


            await expect(
                repository.logout()
            )
                .rejects
                .toThrow(
                    "サーバーに接続できませんでした"
                );

        });



        it("errors message", async () => {

            fetchMock.mockResolvedValue(
                createErrorResponse({
                    errors: [
                        {
                            message: "logout失敗"
                        }
                    ]
                })
            );


            await expect(
                repository.logout()
            )
                .rejects
                .toThrow(
                    "logout失敗"
                );
        });



        it("messageエラー", async () => {

            fetchMock.mockResolvedValue(
                createErrorResponse({
                    message: "失敗"
                })
            );


            await expect(
                repository.logout()
            )
                .rejects
                .toThrow(
                    "失敗"
                );
        });



        it("401の場合", async () => {

            fetchMock.mockResolvedValue(
                createErrorResponse({}, 401)
            );


            await expect(
                repository.logout()
            )
                .rejects
                .toThrow(
                    "ログインの有効期限"
                );
        });



        it("通常エラー", async () => {

            fetchMock.mockResolvedValue(
                createErrorResponse({}, 500)
            );


            await expect(
                repository.logout()
            )
                .rejects
                .toThrow(
                    "ログアウトできませんでした"
                );
        });



        it("json解析失敗", async () => {

            fetchMock.mockResolvedValue(
                createJsonErrorResponse()
            );


            await expect(
                repository.logout()
            )
                .rejects
                .toThrow();

        });



        it("成功だがloggedOut=false", async () => {

            fetchMock.mockResolvedValue(
                createResponse({
                    success: true,
                    data: {
                        loggedOut: false
                    }
                })
            );


            await expect(
                repository.logout()
            )
                .rejects
                .toThrow(
                    "ログアウト結果を確認できませんでした"
                );

        });

    });

});