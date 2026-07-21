// @vitest-environment jsdom

import {
    act,
    cleanup,
    renderHook,
    waitFor,
} from "@testing-library/react";
import {
    afterEach,
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from "vitest";

import { TYPES } from "@/di/types";
import type {
    IUpdateOrderStatusService,
} from
    "@/interfaces/IUpdateOrderStatusService";
import type {
    UpdateOrderStatusComplete,
    UpdateOrderStatusConfirm,
    UpdateOrderStatusInput,
} from "@/models/UpdateOrderStatusData";
import {
    useUpdateOrderStatus,
} from
    "@/components/hooks/useUpdateOrderStatus";

/*
 * vi.mockは巻き上げられるため、
 * vi.hoistedでモック関数を生成する。
 */
const {
    mockContainerGet,
    mockFindById,
    mockConfirmStatusUpdate,
    mockUpdateStatus,
    mockRouterReplace,
} = vi.hoisted(() => ({
    mockContainerGet: vi.fn(),
    mockFindById: vi.fn(),
    mockConfirmStatusUpdate:
        vi.fn(),
    mockUpdateStatus: vi.fn(),
    mockRouterReplace: vi.fn(),
}));

vi.mock("@/di/container", () => ({
    container: {
        get: mockContainerGet,
    },
}));

vi.mock("next/navigation", () => ({
    useRouter: () => ({
        replace: mockRouterReplace,
    }),
}));

type UpdateOrderStatusHook =
    ReturnType<
        typeof useUpdateOrderStatus
    >;

type HookResult = {
    current:
    UpdateOrderStatusHook;
};

/**
 * 注文ステータス更新入力情報を生成する
 */
const createInputData = (
    orderId:
        string =
        "50000000-0000-0000-0000-000000000001",
    currentStatusId:
        number = 4,
    currentStatusName:
        string = "発送済み",
): UpdateOrderStatusInput => ({
    orderId,
    orderDate:
        "2026/07/16 11:05:00",
    customerAccountName:
        "yamamoto_f",
    orderContent:
        "卓上電卓 12桁 × 2",
    currentStatusId,
    currentStatusName,
    orderStatuses: [],
} as unknown as
    UpdateOrderStatusInput);

/**
 * 注文ステータス更新確認情報を生成する
 */
const createConfirmData = (
    orderId:
        string =
        "50000000-0000-0000-0000-000000000001",
    newStatusId:
        number = 5,
    newStatusName:
        string = "配達完了",
): UpdateOrderStatusConfirm => ({
    orderId,
    orderDate:
        "2026/07/16 11:05:00",
    customerAccountName:
        "yamamoto_f",
    currentStatusName:
        "発送済み",
    newStatusId,
    newStatusName,
} as unknown as
    UpdateOrderStatusConfirm);

/**
 * 注文ステータス更新完了情報を生成する
 */
const createCompleteData = (
    orderId:
        string =
        "50000000-0000-0000-0000-000000000001",
    newStatusId:
        number = 5,
): UpdateOrderStatusComplete => ({
    orderId,
    newStatusId,
    newStatusName:
        "配達完了",
    message:
        "注文ステータスを更新しました。",
} as unknown as
    UpdateOrderStatusComplete);

/**
 * 初期ロード完了まで待機する
 */
const waitForInitialLoad = async (
    result: HookResult,
): Promise<void> => {
    await waitFor(() => {
        expect(
            mockFindById,
        ).toHaveBeenCalledTimes(1);

        expect(
            result.current.isLoading,
        ).toBe(false);
    });
};

/**
 * 正常なステータスを選択する
 */
const selectValidStatus = (
    result: HookResult,
    statusId = 5,
): void => {
    act(() => {
        result.current
            .handleStatusChange(
                statusId,
            );
    });
};

/**
 * 任意のタイミングで完了できるPromiseを生成する
 */
const createDeferred = <T,>() => {
    let resolve:
        (value: T) => void =
        () => { };

    let reject:
        (reason?: unknown) => void =
        () => { };

    const promise =
        new Promise<T>(
            (
                promiseResolve,
                promiseReject,
            ) => {
                resolve =
                    promiseResolve;

                reject =
                    promiseReject;
            },
        );

    return {
        promise,
        resolve,
        reject,
    };
};

/**
 * 確認モーダルを開く
 */
const openConfirmModal = async (
    result: HookResult,
    statusId = 5,
): Promise<void> => {
    selectValidStatus(
        result,
        statusId,
    );

    await act(async () => {
        await result.current
            .openConfirmModal();
    });
};

describe(
    "useUpdateOrderStatus",
    () => {
        const orderUuid =
            "50000000-0000-0000-0000-000000000001";

        beforeEach(() => {
            mockContainerGet.mockReset();
            mockFindById.mockReset();

            mockConfirmStatusUpdate
                .mockReset();

            mockUpdateStatus.mockReset();
            mockRouterReplace.mockReset();

            const mockService = {
                findById:
                    mockFindById,
                confirmStatusUpdate:
                    mockConfirmStatusUpdate,
                updateStatus:
                    mockUpdateStatus,
            } as
                IUpdateOrderStatusService;

            mockContainerGet
                .mockReturnValue(
                    mockService,
                );

            mockFindById
                .mockResolvedValue(
                    createInputData(
                        orderUuid,
                    ),
                );

            mockConfirmStatusUpdate
                .mockResolvedValue(
                    createConfirmData(
                        orderUuid,
                    ),
                );

            mockUpdateStatus
                .mockResolvedValue(
                    createCompleteData(
                        orderUuid,
                    ),
                );
        });

        afterEach(() => {
            cleanup();
            vi.useRealTimers();
            vi.restoreAllMocks();
        });

        it(
            "初期状態と注文情報が正しく設定される",
            async () => {
                const { result } =
                    renderHook(
                        () =>
                            useUpdateOrderStatus(
                                orderUuid,
                            ),
                    );

                expect(
                    mockContainerGet,
                ).toHaveBeenCalledWith(
                    TYPES
                        .IUpdateOrderStatusService,
                );

                await waitForInitialLoad(
                    result,
                );

                expect(
                    mockFindById,
                ).toHaveBeenCalledWith(
                    orderUuid,
                );

                expect(
                    result.current.order,
                ).toEqual({
                    orderId:
                        orderUuid,
                    orderDate:
                        "2026/07/16 11:05:00",
                    customerAccountName:
                        "yamamoto_f",
                    orderContent:
                        "卓上電卓 12桁 × 2",
                    currentStatusId:
                        4,
                    currentStatusName:
                        "発送済み",
                    orderStatuses:
                        result.current
                            .orderStatusOptions,
                });

                expect(
                    result.current
                        .confirmedOrder,
                ).toBeNull();

                expect(
                    result.current
                        .selectedStatusId,
                ).toBe(0);

                expect(
                    result.current
                        .selectedStatus,
                ).toBeNull();

                expect(
                    result.current.errors,
                ).toEqual({});

                expect(
                    result.current.isLoading,
                ).toBe(false);

                expect(
                    result.current
                        .isConfirmOpen,
                ).toBe(false);

                expect(
                    result.current
                        .isToastVisible,
                ).toBe(false);

                expect(
                    result.current
                        .hasValidationErrors,
                ).toBe(false);
            },
        );

        it(
            "注文ステータス一覧が正しく設定される",
            async () => {
                const { result } =
                    renderHook(
                        () =>
                            useUpdateOrderStatus(
                                orderUuid,
                            ),
                    );

                await waitForInitialLoad(
                    result,
                );

                expect(
                    result.current
                        .orderStatusOptions,
                ).toEqual([
                    {
                        id: 1,
                        name: "受付",
                    },
                    {
                        id: 2,
                        name: "支払待ち",
                    },
                    {
                        id: 3,
                        name:
                            "発送準備中",
                    },
                    {
                        id: 4,
                        name: "発送済み",
                    },
                    {
                        id: 5,
                        name: "配達完了",
                    },
                    {
                        id: 6,
                        name:
                            "キャンセル",
                    },
                ]);
            },
        );

        it(
            "注文IDが空の場合はsystemエラーを設定して注文情報を取得しない",
            async () => {
                const { result } =
                    renderHook(
                        () =>
                            useUpdateOrderStatus(
                                "   ",
                            ),
                    );

                await waitFor(() => {
                    expect(
                        result.current
                            .isLoading,
                    ).toBe(false);
                });

                expect(
                    mockFindById,
                ).not.toHaveBeenCalled();

                expect(
                    result.current.order,
                ).toBeNull();

                expect(
                    result.current.errors
                        .system,
                ).toBe(
                    "注文IDを取得できませんでした。",
                );

                expect(
                    result.current
                        .hasValidationErrors,
                ).toBe(true);
            },
        );

        it(
            "指定された注文が存在しない場合はsystemエラーを設定する",
            async () => {
                mockFindById
                    .mockResolvedValue(
                        null,
                    );

                const { result } =
                    renderHook(
                        () =>
                            useUpdateOrderStatus(
                                orderUuid,
                            ),
                    );

                await waitForInitialLoad(
                    result,
                );

                expect(
                    result.current.order,
                ).toBeNull();

                expect(
                    result.current.errors
                        .system,
                ).toBe(
                    "指定された注文は存在しません。",
                );

                expect(
                    result.current
                        .hasValidationErrors,
                ).toBe(true);
            },
        );

        it(
            "注文情報取得でErrorが発生するとそのメッセージを設定する",
            async () => {
                mockFindById
                    .mockRejectedValue(
                        new Error(
                            "注文情報を取得できませんでした。",
                        ),
                    );

                const { result } =
                    renderHook(
                        () =>
                            useUpdateOrderStatus(
                                orderUuid,
                            ),
                    );

                await waitForInitialLoad(
                    result,
                );

                expect(
                    result.current.errors
                        .system,
                ).toBe(
                    "注文情報を取得できませんでした。",
                );

                expect(
                    result.current.order,
                ).toBeNull();
            },
        );

        it(
            "注文情報取得でError以外が発生すると既定のメッセージを設定する",
            async () => {
                mockFindById
                    .mockRejectedValue(
                        "unknown error",
                    );

                const { result } =
                    renderHook(
                        () =>
                            useUpdateOrderStatus(
                                orderUuid,
                            ),
                    );

                await waitForInitialLoad(
                    result,
                );

                expect(
                    result.current.errors
                        .system,
                ).toBe(
                    "注文情報の取得に失敗しました。",
                );
            },
        );

        it(
            "代替プロパティを使用して注文情報を変換できる",
            async () => {
                mockFindById
                    .mockResolvedValue({
                        orderUuid:
                            "alternative-order-id",
                        orderDate:
                            "2026/07/17 12:00:00",
                        customer: {
                            username:
                                "suzuki_a",
                        },
                        ordersDetails: [
                            {
                                product: {
                                    productName:
                                        "A4ノート",
                                },
                                quantity:
                                    "2",
                            },
                            {
                                productName:
                                    "ボールペン",
                                count: 3,
                            },
                            null,
                        ],
                        currentOrderStatus: {
                            orderStatusId:
                                "3",
                            orderStatusName:
                                "発送準備中",
                        },
                    } as unknown as
                        UpdateOrderStatusInput);

                const { result } =
                    renderHook(
                        () =>
                            useUpdateOrderStatus(
                                orderUuid,
                            ),
                    );

                await waitForInitialLoad(
                    result,
                );

                expect(
                    result.current.order,
                ).toEqual(
                    expect.objectContaining({
                        orderId:
                            "alternative-order-id",
                        orderDate:
                            "2026/07/17 12:00:00",
                        customerAccountName:
                            "suzuki_a",
                        orderContent:
                            "A4ノート × 2、ボールペン × 3",
                        currentStatusId:
                            3,
                        currentStatusName:
                            "発送準備中",
                    }),
                );
            },
        );

        it(
            "ステータス名がない場合はステータスIDから名前を取得する",
            async () => {
                mockFindById
                    .mockResolvedValue({
                        orderId:
                            orderUuid,
                        orderDate:
                            "2026/07/16 11:05:00",
                        customerAccountName:
                            "yamamoto_f",
                        orderContent:
                            "卓上電卓 × 1",
                        currentStatusId:
                            5,
                    } as unknown as
                        UpdateOrderStatusInput);

                const { result } =
                    renderHook(
                        () =>
                            useUpdateOrderStatus(
                                orderUuid,
                            ),
                    );

                await waitForInitialLoad(
                    result,
                );

                expect(
                    result.current.order
                        ?.currentStatusId,
                ).toBe(5);

                expect(
                    result.current.order
                        ?.currentStatusName,
                ).toBe("配達完了");
            },
        );

        it(
            "APIレスポンスにステータス情報がない場合は引数の代替値を使用する",
            async () => {
                mockFindById
                    .mockResolvedValue({
                        orderId:
                            orderUuid,
                        orderDate:
                            "2026/07/16 11:05:00",
                        customerAccountName:
                            "yamamoto_f",
                        orderContent:
                            "卓上電卓 × 1",
                    } as unknown as
                        UpdateOrderStatusInput);

                const { result } =
                    renderHook(
                        () =>
                            useUpdateOrderStatus(
                                orderUuid,
                                4,
                                "発送済み",
                            ),
                    );

                await waitForInitialLoad(
                    result,
                );

                expect(
                    result.current.order
                        ?.currentStatusId,
                ).toBe(4);

                expect(
                    result.current.order
                        ?.currentStatusName,
                ).toBe("発送済み");
            },
        );

        it(
            "ステータスを変更すると選択状態が更新される",
            async () => {
                const { result } =
                    renderHook(
                        () =>
                            useUpdateOrderStatus(
                                orderUuid,
                            ),
                    );

                await waitForInitialLoad(
                    result,
                );

                selectValidStatus(
                    result,
                    5,
                );

                expect(
                    result.current
                        .selectedStatusId,
                ).toBe(5);

                expect(
                    result.current
                        .selectedStatus,
                ).toEqual({
                    id: 5,
                    name: "配達完了",
                });
            },
        );

        it(
            "存在しないステータスIDを指定すると選択ステータスはnullになる",
            async () => {
                const { result } =
                    renderHook(
                        () =>
                            useUpdateOrderStatus(
                                orderUuid,
                            ),
                    );

                await waitForInitialLoad(
                    result,
                );

                selectValidStatus(
                    result,
                    99,
                );

                expect(
                    result.current
                        .selectedStatusId,
                ).toBe(99);

                expect(
                    result.current
                        .selectedStatus,
                ).toBeNull();
            },
        );

        it(
            "ステータスが未選択の場合は必須エラーになる",
            async () => {
                const { result } =
                    renderHook(
                        () =>
                            useUpdateOrderStatus(
                                orderUuid,
                            ),
                    );

                await waitForInitialLoad(
                    result,
                );

                act(() => {
                    result.current
                        .handleStatusBlur();
                });

                expect(
                    result.current.errors
                        .orderStatus,
                ).toBe(
                    "注文ステータスを選択してください。",
                );

                expect(
                    result.current
                        .hasValidationErrors,
                ).toBe(true);
            },
        );

        it(
            "現在と同じステータスを選択するとエラーになる",
            async () => {
                const { result } =
                    renderHook(
                        () =>
                            useUpdateOrderStatus(
                                orderUuid,
                            ),
                    );

                await waitForInitialLoad(
                    result,
                );

                selectValidStatus(
                    result,
                    4,
                );

                act(() => {
                    result.current
                        .handleStatusBlur();
                });

                expect(
                    result.current.errors
                        .orderStatus,
                ).toBe(
                    "現在と異なる注文ステータスを選択してください。",
                );

                expect(
                    result.current
                        .hasValidationErrors,
                ).toBe(true);
            },
        );

        it(
            "有効なステータスへ変更すると入力エラーを削除する",
            async () => {
                const { result } =
                    renderHook(
                        () =>
                            useUpdateOrderStatus(
                                orderUuid,
                            ),
                    );

                await waitForInitialLoad(
                    result,
                );

                act(() => {
                    result.current
                        .handleStatusBlur();
                });

                expect(
                    result.current.errors
                        .orderStatus,
                ).toBeDefined();

                selectValidStatus(
                    result,
                    5,
                );

                expect(
                    result.current.errors
                        .orderStatus,
                ).toBeUndefined();

                act(() => {
                    result.current
                        .handleStatusBlur();
                });

                expect(
                    result.current.errors
                        .orderStatus,
                ).toBeUndefined();

                expect(
                    result.current
                        .hasValidationErrors,
                ).toBe(false);
            },
        );

        it(
            "有効なステータスを選択すると更新内容を確認してモーダルを開く",
            async () => {
                const { result } =
                    renderHook(
                        () =>
                            useUpdateOrderStatus(
                                orderUuid,
                            ),
                    );

                await waitForInitialLoad(
                    result,
                );

                await openConfirmModal(
                    result,
                    5,
                );

                expect(
                    mockConfirmStatusUpdate,
                ).toHaveBeenCalledTimes(1);

                expect(
                    mockConfirmStatusUpdate,
                ).toHaveBeenCalledWith(
                    orderUuid,
                    5,
                );

                expect(
                    result.current
                        .confirmedOrder,
                ).toEqual({
                    orderId:
                        orderUuid,
                    orderDate:
                        "2026/07/16 11:05:00",
                    customerAccountName:
                        "yamamoto_f",
                    currentStatusName:
                        "発送済み",
                    newStatusId:
                        5,
                    newStatusName:
                        "配達完了",
                });

                expect(
                    result.current
                        .isConfirmOpen,
                ).toBe(true);

                expect(
                    result.current.isLoading,
                ).toBe(false);
            },
        );

        it(
            "確認APIの不足項目は入力情報と選択ステータスで補完する",
            async () => {
                mockConfirmStatusUpdate
                    .mockResolvedValue(
                        {} as
                        UpdateOrderStatusConfirm,
                    );

                const { result } =
                    renderHook(
                        () =>
                            useUpdateOrderStatus(
                                orderUuid,
                            ),
                    );

                await waitForInitialLoad(
                    result,
                );

                await openConfirmModal(
                    result,
                    5,
                );

                expect(
                    result.current
                        .confirmedOrder,
                ).toEqual({
                    orderId:
                        orderUuid,
                    orderDate:
                        "2026/07/16 11:05:00",
                    customerAccountName:
                        "yamamoto_f",
                    currentStatusName:
                        "発送済み",
                    newStatusId:
                        5,
                    newStatusName:
                        "配達完了",
                });
            },
        );

        it(
            "確認APIの代替プロパティを画面表示用データへ変換する",
            async () => {
                mockConfirmStatusUpdate
                    .mockResolvedValue({
                        orderUuid:
                            "confirmed-order-id",
                        orderDate:
                            "2026/07/18 13:00:00",
                        accountName:
                            "sato_b",
                        currentStatus: {
                            orderStatusName:
                                "発送準備中",
                        },
                        orderStatus: {
                            orderStatusId:
                                "4",
                            orderStatusName:
                                "発送済み",
                        },
                    } as unknown as
                        UpdateOrderStatusConfirm);

                const { result } =
                    renderHook(
                        () =>
                            useUpdateOrderStatus(
                                orderUuid,
                            ),
                    );

                await waitForInitialLoad(
                    result,
                );

                await openConfirmModal(
                    result,
                    5,
                );

                expect(
                    result.current
                        .confirmedOrder,
                ).toEqual({
                    orderId:
                        "confirmed-order-id",
                    orderDate:
                        "2026/07/18 13:00:00",
                    customerAccountName:
                        "sato_b",
                    currentStatusName:
                        "発送準備中",
                    newStatusId:
                        4,
                    newStatusName:
                        "発送済み",
                });
            },
        );

        it(
            "更新内容確認でErrorが発生するとsubmitエラーを設定する",
            async () => {
                mockConfirmStatusUpdate
                    .mockRejectedValue(
                        new Error(
                            "更新内容を確認できませんでした。",
                        ),
                    );

                const { result } =
                    renderHook(
                        () =>
                            useUpdateOrderStatus(
                                orderUuid,
                            ),
                    );

                await waitForInitialLoad(
                    result,
                );

                await openConfirmModal(
                    result,
                    5,
                );

                expect(
                    result.current.errors
                        .submit,
                ).toBe(
                    "更新内容を確認できませんでした。",
                );

                expect(
                    result.current
                        .isConfirmOpen,
                ).toBe(false);

                expect(
                    result.current.isLoading,
                ).toBe(false);
            },
        );

        it(
            "更新内容確認でError以外が発生すると既定のメッセージを設定する",
            async () => {
                mockConfirmStatusUpdate
                    .mockRejectedValue(
                        "unknown error",
                    );

                const { result } =
                    renderHook(
                        () =>
                            useUpdateOrderStatus(
                                orderUuid,
                            ),
                    );

                await waitForInitialLoad(
                    result,
                );

                await openConfirmModal(
                    result,
                    5,
                );

                expect(
                    result.current.errors
                        .submit,
                ).toBe(
                    "注文ステータス更新内容の確認に失敗しました。",
                );
            },
        );

        it(
            "確認モーダルを閉じると確認情報とsubmitエラーを削除する",
            async () => {
                const { result } =
                    renderHook(
                        () =>
                            useUpdateOrderStatus(
                                orderUuid,
                            ),
                    );

                await waitForInitialLoad(
                    result,
                );

                await openConfirmModal(
                    result,
                    5,
                );

                mockUpdateStatus
                    .mockRejectedValue(
                        new Error(
                            "更新に失敗しました。",
                        ),
                    );

                await act(async () => {
                    await result.current
                        .confirmUpdateStatus();
                });

                expect(
                    result.current.errors
                        .submit,
                ).toBeDefined();

                act(() => {
                    result.current
                        .closeConfirmModal();
                });

                expect(
                    result.current
                        .isConfirmOpen,
                ).toBe(false);

                expect(
                    result.current
                        .confirmedOrder,
                ).toBeNull();

                expect(
                    result.current.errors
                        .submit,
                ).toBeUndefined();
            },
        );

        it(
            "更新中は確認モーダルを閉じない",
            async () => {
                const { result } =
                    renderHook(
                        () =>
                            useUpdateOrderStatus(
                                orderUuid,
                            ),
                    );

                await waitForInitialLoad(
                    result,
                );

                await openConfirmModal(
                    result,
                    5,
                );

                let resolveUpdate:
                    (
                        value:
                            UpdateOrderStatusComplete,
                    ) => void = () => { };

                mockUpdateStatus
                    .mockImplementation(
                        () =>
                            new Promise<
                                UpdateOrderStatusComplete
                            >(
                                resolve => {
                                    resolveUpdate =
                                        resolve;
                                },
                            ),
                    );

                let updatePromise:
                    Promise<void> =
                    Promise.resolve();

                act(() => {
                    updatePromise =
                        result.current
                            .confirmUpdateStatus();
                });

                expect(
                    result.current.isLoading,
                ).toBe(true);

                act(() => {
                    result.current
                        .closeConfirmModal();
                });

                expect(
                    result.current
                        .isConfirmOpen,
                ).toBe(true);

                await act(async () => {
                    resolveUpdate(
                        createCompleteData(
                            orderUuid,
                        ),
                    );

                    await updatePromise;
                });

                expect(
                    result.current.isLoading,
                ).toBe(false);

                expect(
                    result.current
                        .isConfirmOpen,
                ).toBe(false);
            },
        );

        it(
            "注文情報またはステータスがない場合は更新を実行しない",
            async () => {
                const { result } =
                    renderHook(
                        () =>
                            useUpdateOrderStatus(
                                orderUuid,
                            ),
                    );

                await waitForInitialLoad(
                    result,
                );

                await act(async () => {
                    await result.current
                        .confirmUpdateStatus();
                });

                expect(
                    result.current.errors
                        .submit,
                ).toBe(
                    "更新する注文情報を取得できませんでした。",
                );

                expect(
                    mockUpdateStatus,
                ).not.toHaveBeenCalled();

                expect(
                    mockRouterReplace,
                ).not.toHaveBeenCalled();
            },
        );

        it(
            "注文ステータス更新に成功すると購入履歴検索画面へ遷移する",
            async () => {
                const { result } =
                    renderHook(
                        () =>
                            useUpdateOrderStatus(
                                orderUuid,
                            ),
                    );

                await waitForInitialLoad(
                    result,
                );

                await openConfirmModal(
                    result,
                    5,
                );

                await act(async () => {
                    await result.current
                        .confirmUpdateStatus();
                });

                expect(
                    mockUpdateStatus,
                ).toHaveBeenCalledTimes(1);

                expect(
                    mockUpdateStatus,
                ).toHaveBeenCalledWith(
                    orderUuid,
                    5,
                );

                expect(
                    result.current.errors,
                ).toEqual({});

                expect(
                    result.current
                        .confirmedOrder,
                ).toBeNull();

                expect(
                    result.current
                        .isConfirmOpen,
                ).toBe(false);

                expect(
                    result.current.isLoading,
                ).toBe(false);

                expect(
                    mockRouterReplace,
                ).toHaveBeenCalledTimes(1);

                expect(
                    mockRouterReplace,
                ).toHaveBeenCalledWith(
                    "/admin/order/search",
                );
            },
        );

        it(
            "注文ステータス更新でErrorが発生するとsubmitエラーを設定する",
            async () => {
                mockUpdateStatus
                    .mockRejectedValue(
                        new Error(
                            "ステータスを更新できませんでした。",
                        ),
                    );

                const { result } =
                    renderHook(
                        () =>
                            useUpdateOrderStatus(
                                orderUuid,
                            ),
                    );

                await waitForInitialLoad(
                    result,
                );

                await openConfirmModal(
                    result,
                    5,
                );

                await act(async () => {
                    await result.current
                        .confirmUpdateStatus();
                });

                expect(
                    result.current.errors
                        .submit,
                ).toBe(
                    "ステータスを更新できませんでした。",
                );

                expect(
                    result.current
                        .isConfirmOpen,
                ).toBe(true);

                expect(
                    result.current.isLoading,
                ).toBe(false);

                expect(
                    mockRouterReplace,
                ).not.toHaveBeenCalled();
            },
        );

        it(
            "注文ステータス更新でError以外が発生すると既定のメッセージを設定する",
            async () => {
                mockUpdateStatus
                    .mockRejectedValue(
                        "unknown error",
                    );

                const { result } =
                    renderHook(
                        () =>
                            useUpdateOrderStatus(
                                orderUuid,
                            ),
                    );

                await waitForInitialLoad(
                    result,
                );

                await openConfirmModal(
                    result,
                    5,
                );

                await act(async () => {
                    await result.current
                        .confirmUpdateStatus();
                });

                expect(
                    result.current.errors
                        .submit,
                ).toBe(
                    "注文ステータスの更新に失敗しました。",
                );

                expect(
                    mockRouterReplace,
                ).not.toHaveBeenCalled();
            },
        );

        it(
            "ステータスを初期化できる",
            async () => {
                const { result } =
                    renderHook(
                        () =>
                            useUpdateOrderStatus(
                                orderUuid,
                            ),
                    );

                await waitForInitialLoad(
                    result,
                );

                await openConfirmModal(
                    result,
                    5,
                );

                mockUpdateStatus
                    .mockRejectedValue(
                        new Error(
                            "更新に失敗しました。",
                        ),
                    );

                await act(async () => {
                    await result.current
                        .confirmUpdateStatus();
                });

                act(() => {
                    result.current
                        .resetStatus();
                });

                expect(
                    result.current
                        .selectedStatusId,
                ).toBe(0);

                expect(
                    result.current
                        .selectedStatus,
                ).toBeNull();

                expect(
                    result.current
                        .confirmedOrder,
                ).toBeNull();

                expect(
                    result.current
                        .isConfirmOpen,
                ).toBe(false);

                expect(
                    result.current.errors
                        .orderStatus,
                ).toBeUndefined();

                expect(
                    result.current.errors
                        .submit,
                ).toBeUndefined();
            },
        );

        it(
            "ステータスを初期化してもsystemエラーは保持する",
            async () => {
                mockFindById
                    .mockResolvedValue(
                        null,
                    );

                const { result } =
                    renderHook(
                        () =>
                            useUpdateOrderStatus(
                                orderUuid,
                            ),
                    );

                await waitForInitialLoad(
                    result,
                );

                act(() => {
                    result.current
                        .resetStatus();
                });

                expect(
                    result.current.errors
                        .system,
                ).toBe(
                    "指定された注文は存在しません。",
                );

                expect(
                    result.current
                        .hasValidationErrors,
                ).toBe(true);
            },
        );

        it(
            "非表示のトーストを閉じても非表示のままである",
            async () => {
                const { result } =
                    renderHook(
                        () =>
                            useUpdateOrderStatus(
                                orderUuid,
                            ),
                    );

                await waitForInitialLoad(
                    result,
                );

                expect(
                    result.current
                        .isToastVisible,
                ).toBe(false);

                act(() => {
                    result.current
                        .closeToast();
                });

                expect(
                    result.current
                        .isToastVisible,
                ).toBe(false);
            },
        );
        it(
            "数値プロパティを文字列へ変換し商品名のない明細を除外できる",
            async () => {
                mockFindById
                    .mockResolvedValue({
                        orderUuid:
                            12345,
                        orderDate:
                            20260716,
                        accountName:
                            789,
                        orderContent: [
                            {
                                product: {
                                    name:
                                        "A4ノート",
                                },
                                count:
                                    "2",
                            },
                            {
                                count: 1,
                            },
                        ],
                        currentStatus: {
                            id: "3",
                            name:
                                "発送準備中",
                        },
                    } as unknown as
                        UpdateOrderStatusInput);

                const { result } =
                    renderHook(
                        () =>
                            useUpdateOrderStatus(
                                orderUuid,
                            ),
                    );

                await waitForInitialLoad(
                    result,
                );

                expect(
                    result.current.order,
                ).toEqual(
                    expect.objectContaining({
                        orderId:
                            "12345",
                        orderDate:
                            "20260716",
                        customerAccountName:
                            "789",
                        orderContent:
                            "A4ノート × 2",
                        currentStatusId:
                            3,
                        currentStatusName:
                            "発送準備中",
                    }),
                );
            },
        );

        it(
            "orderDetailsとorderStatusオブジェクトを使用して注文情報を変換できる",
            async () => {
                mockFindById
                    .mockResolvedValue({
                        orderId:
                            orderUuid,
                        customer: {
                            name:
                                "tanaka_c",
                        },
                        orderDetails: [
                            {
                                productName:
                                    "消しゴム",
                                quantity: 4,
                            },
                        ],
                        orderStatus: {
                            statusId: 2,
                            statusName:
                                "支払待ち",
                        },
                    } as unknown as
                        UpdateOrderStatusInput);

                const { result } =
                    renderHook(
                        () =>
                            useUpdateOrderStatus(
                                orderUuid,
                            ),
                    );

                await waitForInitialLoad(
                    result,
                );

                expect(
                    result.current.order,
                ).toEqual(
                    expect.objectContaining({
                        orderId:
                            orderUuid,
                        customerAccountName:
                            "tanaka_c",
                        orderContent:
                            "消しゴム × 4",
                        currentStatusId:
                            2,
                        currentStatusName:
                            "支払待ち",
                    }),
                );
            },
        );

        it.each([
            [
                "currentStatus",
                "発送済み",
            ],
            [
                "currentOrderStatus",
                "発送準備中",
            ],
            [
                "orderStatus",
                "支払待ち",
            ],
            [
                "status",
                "配達完了",
            ],
        ] as const)(
            "%sが文字列の場合は現在のステータス名として使用する",
            async (
                propertyName,
                statusName,
            ) => {
                mockFindById
                    .mockResolvedValue({
                        orderId:
                            orderUuid,
                        orderDate:
                            "2026/07/16 11:05:00",
                        customerAccountName:
                            "yamamoto_f",
                        orderContent:
                            "卓上電卓 × 1",
                        currentStatusId: 4,
                        [propertyName]:
                            statusName,
                    } as unknown as
                        UpdateOrderStatusInput);

                const { result } =
                    renderHook(
                        () =>
                            useUpdateOrderStatus(
                                orderUuid,
                            ),
                    );

                await waitForInitialLoad(
                    result,
                );

                expect(
                    result.current.order
                        ?.currentStatusName,
                ).toBe(statusName);
            },
        );

        it.each([
            Infinity,
            "",
            "not-number",
        ])(
            "不正なステータスIDの場合は代替ステータスIDを使用する: %s",
            async (
                currentStatusId,
            ) => {
                mockFindById
                    .mockResolvedValue({
                        orderId:
                            orderUuid,
                        orderDate:
                            "2026/07/16 11:05:00",
                        customerAccountName:
                            "yamamoto_f",
                        orderContent:
                            "卓上電卓 × 1",
                        currentStatusId,
                    } as unknown as
                        UpdateOrderStatusInput);

                const { result } =
                    renderHook(
                        () =>
                            useUpdateOrderStatus(
                                orderUuid,
                                2,
                                "支払待ち",
                            ),
                    );

                await waitForInitialLoad(
                    result,
                );

                expect(
                    result.current.order
                        ?.currentStatusId,
                ).toBe(2);

                expect(
                    result.current.order
                        ?.currentStatusName,
                ).toBe("支払待ち");
            },
        );

        it.each([
            "invalid response",
            [],
        ])(
            "入力APIがオブジェクト以外を返した場合は代替値を使用する",
            async (
                response,
            ) => {
                mockFindById
                    .mockResolvedValue(
                        response as unknown as
                        UpdateOrderStatusInput,
                    );

                const { result } =
                    renderHook(
                        () =>
                            useUpdateOrderStatus(
                                orderUuid,
                                4,
                                "発送済み",
                            ),
                    );

                await waitForInitialLoad(
                    result,
                );

                expect(
                    result.current.order,
                ).toEqual(
                    expect.objectContaining({
                        orderId:
                            orderUuid,
                        orderDate: "",
                        customerAccountName:
                            "",
                        orderContent: "",
                        currentStatusId:
                            4,
                        currentStatusName:
                            "発送済み",
                    }),
                );
            },
        );

        it(
            "注文情報取得完了前にアンマウントされた場合は取得結果を反映しない",
            async () => {
                const deferred =
                    createDeferred<
                        UpdateOrderStatusInput |
                        null
                    >();

                mockFindById
                    .mockReturnValue(
                        deferred.promise,
                    );

                const {
                    unmount,
                } = renderHook(
                    () =>
                        useUpdateOrderStatus(
                            orderUuid,
                        ),
                );

                await waitFor(() => {
                    expect(
                        mockFindById,
                    ).toHaveBeenCalledTimes(
                        1,
                    );
                });

                unmount();

                await act(async () => {
                    deferred.resolve(
                        createInputData(
                            orderUuid,
                        ),
                    );

                    await Promise.resolve();
                });
            },
        );

        it(
            "注文情報取得エラー発生前にアンマウントされた場合はエラーを反映しない",
            async () => {
                const deferred =
                    createDeferred<
                        UpdateOrderStatusInput |
                        null
                    >();

                mockFindById
                    .mockReturnValue(
                        deferred.promise,
                    );

                const {
                    unmount,
                } = renderHook(
                    () =>
                        useUpdateOrderStatus(
                            orderUuid,
                        ),
                );

                await waitFor(() => {
                    expect(
                        mockFindById,
                    ).toHaveBeenCalledTimes(
                        1,
                    );
                });

                unmount();

                await act(async () => {
                    deferred.reject(
                        new Error(
                            "取得エラー",
                        ),
                    );

                    await Promise.resolve();
                    await Promise.resolve();
                });
            },
        );

        it(
            "注文情報がない状態で確認モーダルを開こうとするとsubmitエラーになる",
            async () => {
                mockFindById
                    .mockResolvedValue(
                        null,
                    );

                const { result } =
                    renderHook(
                        () =>
                            useUpdateOrderStatus(
                                orderUuid,
                            ),
                    );

                await waitForInitialLoad(
                    result,
                );

                act(() => {
                    result.current
                        .handleStatusChange(5);
                });

                await act(async () => {
                    await result.current
                        .openConfirmModal();
                });

                expect(
                    result.current.errors
                        .submit,
                ).toBe(
                    "注文情報を取得できませんでした。",
                );

                expect(
                    mockConfirmStatusUpdate,
                ).not.toHaveBeenCalled();

                expect(
                    result.current
                        .isConfirmOpen,
                ).toBe(false);
            },
        );

        it(
            "ステータス未選択で確認モーダルを開こうとすると確認APIを呼ばない",
            async () => {
                const { result } =
                    renderHook(
                        () =>
                            useUpdateOrderStatus(
                                orderUuid,
                            ),
                    );

                await waitForInitialLoad(
                    result,
                );

                await act(async () => {
                    await result.current
                        .openConfirmModal();
                });

                expect(
                    result.current.errors
                        .orderStatus,
                ).toBe(
                    "注文ステータスを選択してください。",
                );

                expect(
                    mockConfirmStatusUpdate,
                ).not.toHaveBeenCalled();

                expect(
                    result.current
                        .isConfirmOpen,
                ).toBe(false);
            },
        );

        it(
            "確認APIの文字列ステータスと数値プロパティを変換できる",
            async () => {
                mockConfirmStatusUpdate
                    .mockResolvedValue({
                        orderId: 12345,
                        orderDate:
                            20260718,
                        accountName:
                            67890,
                        currentStatus:
                            "発送済み",
                        newStatusId:
                            "5",
                        newStatus:
                            "配達完了",
                    } as unknown as
                        UpdateOrderStatusConfirm);

                const { result } =
                    renderHook(
                        () =>
                            useUpdateOrderStatus(
                                orderUuid,
                            ),
                    );

                await waitForInitialLoad(
                    result,
                );

                await openConfirmModal(
                    result,
                    5,
                );

                expect(
                    result.current
                        .confirmedOrder,
                ).toEqual({
                    orderId:
                        "12345",
                    orderDate:
                        "20260718",
                    customerAccountName:
                        "67890",
                    currentStatusName:
                        "発送済み",
                    newStatusId: 5,
                    newStatusName:
                        "配達完了",
                });
            },
        );

        it(
            "確認APIのcurrentOrderStatusとorderStatus文字列を変換できる",
            async () => {
                mockConfirmStatusUpdate
                    .mockResolvedValue({
                        currentOrderStatus:
                            "発送準備中",
                        orderStatus:
                            "キャンセル",
                    } as unknown as
                        UpdateOrderStatusConfirm);

                const { result } =
                    renderHook(
                        () =>
                            useUpdateOrderStatus(
                                orderUuid,
                            ),
                    );

                await waitForInitialLoad(
                    result,
                );

                await openConfirmModal(
                    result,
                    6,
                );

                expect(
                    result.current
                        .confirmedOrder,
                ).toEqual(
                    expect.objectContaining({
                        currentStatusName:
                            "発送準備中",
                        newStatusId: 6,
                        newStatusName:
                            "キャンセル",
                    }),
                );
            },
        );

        it(
            "確認APIのnewStatusオブジェクトを変換できる",
            async () => {
                mockConfirmStatusUpdate
                    .mockResolvedValue({
                        currentStatus: {
                            name:
                                "発送済み",
                        },
                        newStatus: {
                            orderStatusId:
                                "6",
                            orderStatusName:
                                "キャンセル",
                        },
                    } as unknown as
                        UpdateOrderStatusConfirm);

                const { result } =
                    renderHook(
                        () =>
                            useUpdateOrderStatus(
                                orderUuid,
                            ),
                    );

                await waitForInitialLoad(
                    result,
                );

                await openConfirmModal(
                    result,
                    6,
                );

                expect(
                    result.current
                        .confirmedOrder,
                ).toEqual(
                    expect.objectContaining({
                        currentStatusName:
                            "発送済み",
                        newStatusId: 6,
                        newStatusName:
                            "キャンセル",
                    }),
                );
            },
        );

        it(
            "確認APIがオブジェクト以外を返した場合は入力情報と選択値で補完する",
            async () => {
                mockConfirmStatusUpdate
                    .mockResolvedValue(
                        [] as unknown as
                        UpdateOrderStatusConfirm,
                    );

                const { result } =
                    renderHook(
                        () =>
                            useUpdateOrderStatus(
                                orderUuid,
                            ),
                    );

                await waitForInitialLoad(
                    result,
                );

                await openConfirmModal(
                    result,
                    5,
                );

                expect(
                    result.current
                        .confirmedOrder,
                ).toEqual({
                    orderId:
                        orderUuid,
                    orderDate:
                        "2026/07/16 11:05:00",
                    customerAccountName:
                        "yamamoto_f",
                    currentStatusName:
                        "発送済み",
                    newStatusId: 5,
                    newStatusName:
                        "配達完了",
                });
            },
        );

        it(
            "更新成功後にトーストを表示し3秒後に閉じる",
            async () => {
                const { result } =
                    renderHook(
                        () =>
                            useUpdateOrderStatus(
                                orderUuid,
                            ),
                    );

                await waitForInitialLoad(
                    result,
                );

                vi.useFakeTimers();

                await openConfirmModal(
                    result,
                    5,
                );

                await act(async () => {
                    await result.current
                        .confirmUpdateStatus();
                });

                expect(
                    result.current
                        .isToastVisible,
                ).toBe(true);

                act(() => {
                    vi.advanceTimersByTime(
                        2999,
                    );
                });

                expect(
                    result.current
                        .isToastVisible,
                ).toBe(true);

                act(() => {
                    vi.advanceTimersByTime(
                        1,
                    );
                });

                expect(
                    result.current
                        .isToastVisible,
                ).toBe(false);
            },
        );

        it(
            "更新成功後のトーストを手動で閉じることができる",
            async () => {
                const { result } =
                    renderHook(
                        () =>
                            useUpdateOrderStatus(
                                orderUuid,
                            ),
                    );

                await waitForInitialLoad(
                    result,
                );

                await openConfirmModal(
                    result,
                    5,
                );

                await act(async () => {
                    await result.current
                        .confirmUpdateStatus();
                });

                expect(
                    result.current
                        .isToastVisible,
                ).toBe(true);

                act(() => {
                    result.current
                        .closeToast();
                });

                expect(
                    result.current
                        .isToastVisible,
                ).toBe(false);
            },
        );
        it(
            "ステータスIDに対応する名前がない場合は代替ステータス名を使用する",
            async () => {
                // データを用意する
                mockFindById
                    .mockResolvedValue({
                        orderId:
                            orderUuid,
                        orderDate:
                            "2026/07/16 11:05:00",
                        customerAccountName:
                            "yamamoto_f",
                        orderContent:
                            "卓上電卓 × 1",
                    } as unknown as
                        UpdateOrderStatusInput);

                // Hookを実行する
                const { result } =
                    renderHook(
                        () =>
                            useUpdateOrderStatus(
                                orderUuid,
                                99,
                                "独自ステータス",
                            ),
                    );

                await waitForInitialLoad(
                    result,
                );

                // 代替値を検証する
                expect(
                    result.current.order
                        ?.currentStatusId,
                ).toBe(99);

                expect(
                    result.current.order
                        ?.currentStatusName,
                ).toBe(
                    "独自ステータス",
                );
            },
        );
        it(
            "ステータス名を取得できず代替値もない場合は空文字になる",
            async () => {
                // データを用意する
                mockFindById
                    .mockResolvedValue({
                        orderId:
                            orderUuid,
                        orderDate:
                            "2026/07/16 11:05:00",
                        customerAccountName:
                            "yamamoto_f",
                        orderContent:
                            "卓上電卓 × 1",
                    } as unknown as
                        UpdateOrderStatusInput);

                // Hookを実行する
                const { result } =
                    renderHook(
                        () =>
                            useUpdateOrderStatus(
                                orderUuid,
                            ),
                    );

                await waitForInitialLoad(
                    result,
                );

                // ステータス情報を検証する
                expect(
                    result.current.order
                        ?.currentStatusId,
                ).toBe(0);

                expect(
                    result.current.order
                        ?.currentStatusName,
                ).toBe("");
            },
        );
    },
);