// @vitest-environment jsdom

import {
    act,
    cleanup,
    renderHook,
    waitFor,
} from "@testing-library/react";
import type {
    ChangeEvent,
} from "react";
import {
    afterEach,
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from "vitest";

import { TYPES } from "@/di/types";
import type { ISearchOrdersService } from
    "@/interfaces/ISearchOrdersService";
import type { OrderSearchItem } from
    "@/models/OrderSearchItem";
import { useSearchOrders } from
    "@/components/hooks/useSearchOrders";

/*
 * vi.mockは巻き上げられるため、
 * vi.hoistedでモック関数を生成する。
 */
const {
    mockContainerGet,
    mockFindAll,
    mockSearchOrders,
} = vi.hoisted(() => ({
    mockContainerGet: vi.fn(),
    mockFindAll: vi.fn(),
    mockSearchOrders: vi.fn(),
}));

vi.mock("@/di/container", () => ({
    container: {
        get: mockContainerGet,
    },
}));

type SearchOrdersHook =
    ReturnType<typeof useSearchOrders>;

type HookResult = {
    current: SearchOrdersHook;
};

type SearchConditionName =
    | "orderDate"
    | "customerAccountName";

/**
 * 購入履歴データを生成する
 */
const createOrder = (
    orderUuid:
        string =
        "50000000-0000-0000-0000-000000000004",
): OrderSearchItem => ({
    orderUuid,
    orderDate:
        "2026/07/16 11:05:00",
    customerAccountName:
        "yamamoto_f",
    orderContent:
        "卓上電卓 12桁 × 2",
    orderStatus:
        "配達完了",
    statusUpdateUrl:
        `/admin/order/status/update/${orderUuid}`,
} as OrderSearchItem);

/**
 * 検索条件を入力する
 */
const changeSearchCondition = (
    result: HookResult,
    name: SearchConditionName,
    value: string,
): void => {
    act(() => {
        result.current.handleChange({
            target: {
                name,
                value,
            },
        } as ChangeEvent<HTMLInputElement>);
    });
};

/**
 * 初期表示の購入履歴取得が終わるまで待つ
 */
const renderSearchOrdersHook =
    async () => {
        const hook = renderHook(
            () => useSearchOrders(),
        );

        await waitFor(() => {
            expect(
                hook.result.current.isLoading,
            ).toBe(false);
        });

        return hook;
    };

describe("useSearchOrders", () => {
    beforeEach(() => {
        mockContainerGet.mockReset();
        mockFindAll.mockReset();
        mockSearchOrders.mockReset();

        const mockService = {
            findAll: mockFindAll,
            searchOrders:
                mockSearchOrders,
        } as ISearchOrdersService;

        mockContainerGet.mockReturnValue(
            mockService,
        );

        mockFindAll.mockResolvedValue([]);
        mockSearchOrders
            .mockResolvedValue([]);
    });

    afterEach(() => {
        cleanup();
    });

    it(
        "初期状態が正しく設定される",
        async () => {
            const { result } =
                await renderSearchOrdersHook();

            expect(
                mockContainerGet,
            ).toHaveBeenCalledWith(
                TYPES.ISearchOrdersService,
            );

            expect(
                mockContainerGet,
            ).toHaveBeenCalledTimes(1);

            expect(
                result.current.formData,
            ).toEqual({
                orderDate: "",
                customerAccountName: "",
            });

            expect(
                result.current.orders,
            ).toEqual([]);

            expect(
                result.current.errors,
            ).toEqual({});

            expect(
                result.current.isLoading,
            ).toBe(false);

            expect(
                result.current.today,
            ).toMatch(
                /^\d{4}-\d{2}-\d{2}$/,
            );

            expect(
                result.current.resultMessage,
            ).toBe(
                "注文が登録されていません。",
            );

            expect(
                result.current
                    .hasValidationErrors,
            ).toBe(false);
        },
    );

    it(
        "初期表示時にすべての購入履歴を取得する",
        async () => {
            // データを用意する
            const orders = [
                createOrder(),
            ];

            mockFindAll.mockResolvedValue(
                orders,
            );

            // フックを実行する
            const { result } =
                await renderSearchOrdersHook();

            // 全件取得結果を検証する
            expect(
                mockFindAll,
            ).toHaveBeenCalledTimes(1);

            expect(
                result.current.orders,
            ).toBe(orders);

            expect(
                result.current.errors,
            ).toEqual({});

            expect(
                result.current.resultMessage,
            ).toBe(
                "1件の購入履歴があります。",
            );
        },
    );

    it(
        "初期表示の全件取得でErrorが発生するとsystemエラーを設定する",
        async () => {
            // データを用意する
            mockFindAll.mockRejectedValue(
                new Error(
                    "購入履歴の取得に失敗しました。",
                ),
            );

            // フックを実行する
            const { result } =
                await renderSearchOrdersHook();

            // エラー内容を検証する
            expect(
                result.current.orders,
            ).toEqual([]);

            expect(
                result.current.errors.system,
            ).toBe(
                "購入履歴の取得に失敗しました。",
            );

            expect(
                result.current.resultMessage,
            ).toBe("");

            expect(
                result.current.isLoading,
            ).toBe(false);
        },
    );

    it(
        "初期表示の全件取得でError以外が発生すると既定のメッセージを設定する",
        async () => {
            // データを用意する
            mockFindAll.mockRejectedValue(
                "unknown error",
            );

            // フックを実行する
            const { result } =
                await renderSearchOrdersHook();

            // エラー内容を検証する
            expect(
                result.current.errors.system,
            ).toBe(
                "購入履歴一覧の取得に失敗しました。",
            );

            expect(
                result.current.orders,
            ).toEqual([]);

            expect(
                result.current.resultMessage,
            ).toBe("");
        },
    );

    it(
        "購入日を変更するとフォームデータが更新される",
        async () => {
            const { result } =
                await renderSearchOrdersHook();

            changeSearchCondition(
                result,
                "orderDate",
                "2026-07-16",
            );

            expect(
                result.current
                    .formData.orderDate,
            ).toBe("2026-07-16");
        },
    );

    it(
        "顧客アカウント名を変更するとフォームデータが更新される",
        async () => {
            const { result } =
                await renderSearchOrdersHook();

            changeSearchCondition(
                result,
                "customerAccountName",
                "yamamoto_f",
            );

            expect(
                result.current.formData
                    .customerAccountName,
            ).toBe("yamamoto_f");
        },
    );

    it(
        "購入日に未来日を指定するとエラーになり検索を実行しない",
        async () => {
            const { result } =
                await renderSearchOrdersHook();

            mockFindAll.mockClear();
            mockSearchOrders.mockClear();

            changeSearchCondition(
                result,
                "orderDate",
                "9999-12-31",
            );

            await act(async () => {
                await result.current
                    .handleSearch();
            });

            expect(
                result.current
                    .errors.orderDate,
            ).toBe(
                "購入日に未来日は指定できません。",
            );

            expect(
                result.current
                    .hasValidationErrors,
            ).toBe(true);

            expect(
                mockFindAll,
            ).not.toHaveBeenCalled();

            expect(
                mockSearchOrders,
            ).not.toHaveBeenCalled();
        },
    );

    it(
        "顧客アカウント名が20文字を超えるとエラーになり検索を実行しない",
        async () => {
            const { result } =
                await renderSearchOrdersHook();

            mockFindAll.mockClear();
            mockSearchOrders.mockClear();

            changeSearchCondition(
                result,
                "customerAccountName",
                "a".repeat(21),
            );

            await act(async () => {
                await result.current
                    .handleSearch();
            });

            expect(
                result.current.errors
                    .customerAccountName,
            ).toBe(
                "顧客アカウント名は20文字以内で入力してください。",
            );

            expect(
                result.current
                    .hasValidationErrors,
            ).toBe(true);

            expect(
                mockFindAll,
            ).not.toHaveBeenCalled();

            expect(
                mockSearchOrders,
            ).not.toHaveBeenCalled();
        },
    );

    it(
        "顧客アカウント名が20文字の場合は検索できる",
        async () => {
            const { result } =
                await renderSearchOrdersHook();

            const customerAccountName =
                "a".repeat(20);

            mockSearchOrders
                .mockResolvedValue([]);

            changeSearchCondition(
                result,
                "customerAccountName",
                customerAccountName,
            );

            await act(async () => {
                await result.current
                    .handleSearch();
            });

            expect(
                mockSearchOrders,
            ).toHaveBeenCalledWith(
                "",
                customerAccountName,
            );

            expect(
                result.current.errors,
            ).toEqual({});

            expect(
                result.current
                    .hasValidationErrors,
            ).toBe(false);
        },
    );

    it(
        "購入日だけを指定すると条件検索を実行する",
        async () => {
            const { result } =
                await renderSearchOrdersHook();

            const orders = [
                createOrder(),
            ];

            mockSearchOrders
                .mockResolvedValue(orders);

            changeSearchCondition(
                result,
                "orderDate",
                "2026-07-16",
            );

            await act(async () => {
                await result.current
                    .handleSearch();
            });

            expect(
                mockSearchOrders,
            ).toHaveBeenCalledTimes(1);

            expect(
                mockSearchOrders,
            ).toHaveBeenCalledWith(
                "2026-07-16",
                "",
            );

            expect(
                result.current.orders,
            ).toBe(orders);

            expect(
                result.current.resultMessage,
            ).toBe(
                "1件の購入履歴があります。",
            );
        },
    );

    it(
        "顧客アカウント名だけを指定すると前後の空白を除去して条件検索を実行する",
        async () => {
            const { result } =
                await renderSearchOrdersHook();

            const orders = [
                createOrder(),
            ];

            mockSearchOrders
                .mockResolvedValue(orders);

            changeSearchCondition(
                result,
                "customerAccountName",
                "  yamamoto_f  ",
            );

            await act(async () => {
                await result.current
                    .handleSearch();
            });

            expect(
                mockSearchOrders,
            ).toHaveBeenCalledTimes(1);

            expect(
                mockSearchOrders,
            ).toHaveBeenCalledWith(
                "",
                "yamamoto_f",
            );

            expect(
                result.current.orders,
            ).toBe(orders);
        },
    );

    it(
        "購入日と顧客アカウント名を指定すると両方の条件で検索する",
        async () => {
            const { result } =
                await renderSearchOrdersHook();

            const orders = [
                createOrder(),
            ];

            mockSearchOrders
                .mockResolvedValue(orders);

            changeSearchCondition(
                result,
                "orderDate",
                "2026-07-16",
            );

            changeSearchCondition(
                result,
                "customerAccountName",
                "yamamoto_f",
            );

            await act(async () => {
                await result.current
                    .handleSearch();
            });

            expect(
                mockSearchOrders,
            ).toHaveBeenCalledWith(
                "2026-07-16",
                "yamamoto_f",
            );

            expect(
                result.current.orders,
            ).toBe(orders);

            expect(
                result.current.errors,
            ).toEqual({});
        },
    );

    it(
        "検索条件が両方空の場合は全件取得を実行する",
        async () => {
            const { result } =
                await renderSearchOrdersHook();

            const orders = [
                createOrder(),
            ];

            mockFindAll.mockClear();
            mockFindAll.mockResolvedValue(
                orders,
            );

            await act(async () => {
                await result.current
                    .handleSearch();
            });

            expect(
                mockFindAll,
            ).toHaveBeenCalledTimes(1);

            expect(
                mockSearchOrders,
            ).not.toHaveBeenCalled();

            expect(
                result.current.orders,
            ).toBe(orders);

            expect(
                result.current.resultMessage,
            ).toBe(
                "1件の購入履歴があります。",
            );
        },
    );

    it(
        "条件検索結果が0件の場合は該当する購入履歴がないメッセージを表示する",
        async () => {
            const { result } =
                await renderSearchOrdersHook();

            mockSearchOrders
                .mockResolvedValue([]);

            changeSearchCondition(
                result,
                "customerAccountName",
                "not_found_user",
            );

            await act(async () => {
                await result.current
                    .handleSearch();
            });

            expect(
                result.current.orders,
            ).toEqual([]);

            expect(
                result.current.resultMessage,
            ).toBe(
                "検索条件に一致する購入履歴はありません。",
            );
        },
    );

    it(
        "全件取得結果が0件の場合は注文が登録されていないメッセージを表示する",
        async () => {
            const { result } =
                await renderSearchOrdersHook();

            mockFindAll.mockClear();
            mockFindAll.mockResolvedValue(
                [],
            );

            await act(async () => {
                await result.current
                    .handleSearch();
            });

            expect(
                result.current.orders,
            ).toEqual([]);

            expect(
                result.current.resultMessage,
            ).toBe(
                "注文が登録されていません。",
            );
        },
    );

    it(
        "検索結果が複数件の場合は件数を含むメッセージを表示する",
        async () => {
            const { result } =
                await renderSearchOrdersHook();

            const orders = [
                createOrder(
                    "50000000-0000-0000-0000-000000000001",
                ),
                createOrder(
                    "50000000-0000-0000-0000-000000000002",
                ),
            ];

            mockSearchOrders
                .mockResolvedValue(orders);

            changeSearchCondition(
                result,
                "orderDate",
                "2026-07-16",
            );

            await act(async () => {
                await result.current
                    .handleSearch();
            });

            expect(
                result.current.resultMessage,
            ).toBe(
                "2件の購入履歴があります。",
            );
        },
    );

    it(
        "検索中は取得中メッセージを表示する",
        async () => {
            const { result } =
                await renderSearchOrdersHook();

            const orders = [
                createOrder(),
            ];

            let resolveSearch:
                (
                    value:
                        OrderSearchItem[],
                ) => void = () => { };

            mockSearchOrders
                .mockImplementation(
                    () =>
                        new Promise<
                            OrderSearchItem[]
                        >((resolve) => {
                            resolveSearch =
                                resolve;
                        }),
                );

            changeSearchCondition(
                result,
                "orderDate",
                "2026-07-16",
            );

            let searchPromise:
                Promise<void> =
                Promise.resolve();

            act(() => {
                searchPromise =
                    result.current
                        .handleSearch();
            });

            expect(
                result.current.isLoading,
            ).toBe(true);

            expect(
                result.current.resultMessage,
            ).toBe(
                "購入履歴を取得しています。",
            );

            await act(async () => {
                resolveSearch(orders);

                await searchPromise;
            });

            expect(
                result.current.isLoading,
            ).toBe(false);

            expect(
                result.current.orders,
            ).toBe(orders);
        },
    );

    it(
        "検索でErrorが発生するとsubmitエラーを設定する",
        async () => {
            const { result } =
                await renderSearchOrdersHook();

            mockSearchOrders
                .mockRejectedValue(
                    new Error(
                        "購入履歴の検索に失敗しました。",
                    ),
                );

            changeSearchCondition(
                result,
                "orderDate",
                "2026-07-16",
            );

            await act(async () => {
                await result.current
                    .handleSearch();
            });

            expect(
                result.current.errors.submit,
            ).toBe(
                "購入履歴の検索に失敗しました。",
            );

            expect(
                result.current.isLoading,
            ).toBe(false);

            expect(
                result.current
                    .hasValidationErrors,
            ).toBe(false);
        },
    );

    it(
        "検索でError以外が発生すると既定のメッセージを設定する",
        async () => {
            const { result } =
                await renderSearchOrdersHook();

            mockSearchOrders
                .mockRejectedValue(
                    "unknown error",
                );

            changeSearchCondition(
                result,
                "orderDate",
                "2026-07-16",
            );

            await act(async () => {
                await result.current
                    .handleSearch();
            });

            expect(
                result.current.errors.submit,
            ).toBe(
                "購入履歴の検索に失敗しました。",
            );

            expect(
                result.current.isLoading,
            ).toBe(false);
        },
    );

    it(
        "検索条件を変更すると該当する入力エラーを削除する",
        async () => {
            const { result } =
                await renderSearchOrdersHook();

            changeSearchCondition(
                result,
                "orderDate",
                "9999-12-31",
            );

            await act(async () => {
                await result.current
                    .handleSearch();
            });

            expect(
                result.current
                    .errors.orderDate,
            ).toBeDefined();

            changeSearchCondition(
                result,
                "orderDate",
                "2026-07-16",
            );

            expect(
                result.current
                    .errors.orderDate,
            ).toBeUndefined();

            expect(
                result.current
                    .hasValidationErrors,
            ).toBe(false);
        },
    );

    it(
        "検索条件を変更するとsubmitエラーを削除する",
        async () => {
            const { result } =
                await renderSearchOrdersHook();

            mockSearchOrders
                .mockRejectedValue(
                    new Error(
                        "購入履歴の検索に失敗しました。",
                    ),
                );

            changeSearchCondition(
                result,
                "orderDate",
                "2026-07-16",
            );

            await act(async () => {
                await result.current
                    .handleSearch();
            });

            expect(
                result.current.errors.submit,
            ).toBeDefined();

            changeSearchCondition(
                result,
                "customerAccountName",
                "yamamoto_f",
            );

            expect(
                result.current.errors.submit,
            ).toBeUndefined();
        },
    );

    it(
        "検索条件を初期化すると全件取得を実行する",
        async () => {
            const { result } =
                await renderSearchOrdersHook();

            const searchedOrders = [
                createOrder(),
            ];

            mockSearchOrders
                .mockResolvedValue(
                    searchedOrders,
                );

            changeSearchCondition(
                result,
                "orderDate",
                "2026-07-16",
            );

            changeSearchCondition(
                result,
                "customerAccountName",
                "yamamoto_f",
            );

            await act(async () => {
                await result.current
                    .handleSearch();
            });

            const allOrders = [
                createOrder(
                    "50000000-0000-0000-0000-000000000001",
                ),
                createOrder(
                    "50000000-0000-0000-0000-000000000002",
                ),
            ];

            mockFindAll.mockClear();
            mockFindAll.mockResolvedValue(
                allOrders,
            );

            await act(async () => {
                await result.current
                    .resetSearch();
            });

            expect(
                result.current.formData,
            ).toEqual({
                orderDate: "",
                customerAccountName: "",
            });

            expect(
                result.current.errors,
            ).toEqual({});

            expect(
                mockFindAll,
            ).toHaveBeenCalledTimes(1);

            expect(
                result.current.orders,
            ).toBe(allOrders);

            expect(
                result.current.resultMessage,
            ).toBe(
                "2件の購入履歴があります。",
            );
        },
    );

    it(
        "検索条件を初期化して全件取得結果が0件の場合は未登録メッセージを表示する",
        async () => {
            const { result } =
                await renderSearchOrdersHook();

            mockSearchOrders
                .mockResolvedValue([]);

            changeSearchCondition(
                result,
                "customerAccountName",
                "not_found_user",
            );

            await act(async () => {
                await result.current
                    .handleSearch();
            });

            expect(
                result.current.resultMessage,
            ).toBe(
                "検索条件に一致する購入履歴はありません。",
            );

            mockFindAll.mockResolvedValue(
                [],
            );

            await act(async () => {
                await result.current
                    .resetSearch();
            });

            expect(
                result.current.resultMessage,
            ).toBe(
                "注文が登録されていません。",
            );
        },
    );
});