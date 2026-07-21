"use client";

import { container } from "@/di/container";
import { TYPES } from "@/di/types";
import type {
    IUpdateOrderStatusService,
} from "@/interfaces/IUpdateOrderStatusService";
import {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";
import { useRouter } from "next/navigation";
/**
 * 注文ステータス選択肢
 */
type OrderStatusOption = {
    id: number;
    name: string;
};

/**
 * 注文ステータス一覧
 */
const ORDER_STATUS_OPTIONS:
    OrderStatusOption[] = [
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
            name: "発送準備中",
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
            name: "キャンセル",
        },
    ];

/**
 * 注文ステータス更新入力情報
 */
type UpdateOrderStatusInputData = {
    orderId: string;
    orderDate: string;
    customerAccountName: string;
    orderContent: string;
    currentStatusId: number;
    currentStatusName: string;
    orderStatuses: OrderStatusOption[];
};

/**
 * 注文ステータス更新確認情報
 */
type UpdateOrderStatusConfirmData = {
    orderId: string;
    orderDate: string;
    customerAccountName: string;
    currentStatusName: string;
    newStatusId: number;
    newStatusName: string;
};

/**
 * 注文ステータス更新フォームのエラー
 */
type UpdateOrderStatusErrors = {
    orderStatus?: string;
    submit?: string;
    system?: string;
};

/**
 * 型がオブジェクトか判定する
 */
const isRecord = (
    value: unknown
): value is Record<string, unknown> => {
    return (
        typeof value === "object" &&
        value !== null &&
        !Array.isArray(value)
    );
};

/**
 * オブジェクトから文字列を取得する
 */
const getStringValue = (
    record: Record<string, unknown>,
    keys: string[]
): string => {
    for (const key of keys) {
        const value = record[key];

        if (typeof value === "string") {
            return value;
        }

        if (typeof value === "number") {
            return String(value);
        }
    }

    return "";
};

/**
 * オブジェクトから数値を取得する
 */
const getNumberValue = (
    record: Record<string, unknown>,
    keys: string[]
): number => {
    for (const key of keys) {
        const value = record[key];

        if (
            typeof value === "number" &&
            Number.isFinite(value)
        ) {
            return value;
        }

        if (
            typeof value === "string" &&
            value.trim() !== ""
        ) {
            const convertedValue =
                Number(value);

            if (
                Number.isFinite(
                    convertedValue
                )
            ) {
                return convertedValue;
            }
        }
    }

    return 0;
};

/**
 * 注文明細から注文内容を生成する
 */
const createOrderContent = (
    value: unknown
): string => {
    if (!Array.isArray(value)) {
        return "";
    }

    return value
        .map((item) => {
            if (!isRecord(item)) {
                return "";
            }

            const product =
                isRecord(item.product)
                    ? item.product
                    : {};

            const productName =
                getStringValue(
                    product,
                    [
                        "name",
                        "productName",
                    ]
                ) ||
                getStringValue(
                    item,
                    ["productName"]
                );

            const count =
                getNumberValue(
                    item,
                    [
                        "count",
                        "quantity",
                    ]
                );

            if (!productName) {
                return "";
            }

            return `${productName} × ${count}`;
        })
        .filter(
            (item): item is string =>
                item !== ""
        )
        .join("、");
};

/**
 * 入力画面APIのレスポンスを
 * 画面表示用データへ変換する
 */
const normalizeInputData = (
    value: unknown,
    fallbackOrderId: string,
    fallbackCurrentStatusId: number,
    fallbackCurrentStatusName: string
): UpdateOrderStatusInputData => {
    const data =
        isRecord(value)
            ? value
            : {};

    const customer =
        isRecord(data.customer)
            ? data.customer
            : {};

    const currentStatusObject =
        isRecord(data.currentStatus)
            ? data.currentStatus
            : isRecord(
                data.currentOrderStatus
            )
                ? data.currentOrderStatus
                : isRecord(
                    data.orderStatus
                )
                    ? data.orderStatus
                    : {};

    /**
     * 現在のステータスID
     */
    const currentStatusId =
        getNumberValue(
            data,
            [
                "currentStatusId",
                "currentOrderStatusId",
                "orderStatusId",
                "orderStatus",
                "statusId",
            ]
        ) ||
        getNumberValue(
            currentStatusObject,
            [
                "id",
                "orderStatusId",
                "statusId",
            ]
        ) ||
        fallbackCurrentStatusId;

    /**
     * 現在のステータスが文字列として
     * 返された場合の値
     */
    const directStatusName =
        typeof data.currentStatus ===
            "string"
            ? data.currentStatus
            : typeof data
                .currentOrderStatus ===
                "string"
                ? data.currentOrderStatus
                : typeof data.orderStatus ===
                    "string"
                    ? data.orderStatus
                    : typeof data.status ===
                        "string"
                        ? data.status
                        : "";

    /**
     * APIレスポンスから
     * 現在のステータス名を取得する
     */
    const responseStatusName =
        getStringValue(
            data,
            [
                "currentStatusName",
                "currentOrderStatusName",
                "orderStatusName",
                "statusName",
            ]
        ) ||
        directStatusName ||
        getStringValue(
            currentStatusObject,
            [
                "name",
                "currentStatusName",
                "orderStatusName",
                "statusName",
            ]
        );

    /**
     * APIにステータス名がない場合は、
     * ステータスIDから名前を取得する
     */
    const currentStatusName =
        responseStatusName ||
        ORDER_STATUS_OPTIONS.find(
            (status) =>
                status.id ===
                currentStatusId
        )?.name ||
        fallbackCurrentStatusName ||
        "";

    const orderContent =
        getStringValue(
            data,
            ["orderContent"]
        ) ||
        createOrderContent(
            data.orderContent
        ) ||
        createOrderContent(
            data.ordersDetails
        ) ||
        createOrderContent(
            data.orderDetails
        );

    return {
        orderId:
            getStringValue(
                data,
                [
                    "orderId",
                    "orderUuid",
                ]
            ) ||
            fallbackOrderId,

        orderDate:
            getStringValue(
                data,
                ["orderDate"]
            ),

        customerAccountName:
            getStringValue(
                data,
                [
                    "customerAccountName",
                    "accountName",
                    "customerName",
                ]
            ) ||
            getStringValue(
                customer,
                [
                    "username",
                    "accountName",
                    "name",
                ]
            ),

        orderContent,

        currentStatusId,
        currentStatusName,

        /*
         * ステータス一覧は固定値を使用する。
         */
        orderStatuses:
            ORDER_STATUS_OPTIONS,
    };
};

/**
 * 確認画面APIのレスポンスを
 * 画面表示用データへ変換する
 */
const normalizeConfirmData = (
    value: unknown,
    inputData: UpdateOrderStatusInputData,
    selectedStatus: OrderStatusOption
): UpdateOrderStatusConfirmData => {
    const data =
        isRecord(value)
            ? value
            : {};

    const currentStatus =
        isRecord(data.currentStatus)
            ? data.currentStatus
            : {};

    const newStatus =
        isRecord(data.newStatus)
            ? data.newStatus
            : isRecord(data.orderStatus)
                ? data.orderStatus
                : {};

    const directCurrentStatusName =
        typeof data.currentStatus ===
            "string"
            ? data.currentStatus
            : typeof data
                .currentOrderStatus ===
                "string"
                ? data.currentOrderStatus
                : "";

    const directNewStatusName =
        typeof data.newStatus ===
            "string"
            ? data.newStatus
            : typeof data.orderStatus ===
                "string"
                ? data.orderStatus
                : "";

    return {
        orderId:
            getStringValue(
                data,
                [
                    "orderId",
                    "orderUuid",
                ]
            ) ||
            inputData.orderId,

        orderDate:
            getStringValue(
                data,
                ["orderDate"]
            ) ||
            inputData.orderDate,

        customerAccountName:
            getStringValue(
                data,
                [
                    "customerAccountName",
                    "accountName",
                ]
            ) ||
            inputData.customerAccountName,

        currentStatusName:
            getStringValue(
                data,
                [
                    "currentStatusName",
                    "currentOrderStatusName",
                ]
            ) ||
            directCurrentStatusName ||
            getStringValue(
                currentStatus,
                [
                    "name",
                    "orderStatusName",
                ]
            ) ||
            inputData.currentStatusName,

        newStatusId:
            getNumberValue(
                data,
                ["newStatusId"]
            ) ||
            getNumberValue(
                newStatus,
                [
                    "id",
                    "orderStatusId",
                ]
            ) ||
            selectedStatus.id,

        newStatusName:
            getStringValue(
                data,
                ["newStatusName"]
            ) ||
            directNewStatusName ||
            getStringValue(
                newStatus,
                [
                    "name",
                    "orderStatusName",
                ]
            ) ||
            selectedStatus.name,
    };
};

/**
 * エラーメッセージを取得する
 */
const getErrorMessage = (
    error: unknown,
    defaultMessage: string
): string => {
    if (error instanceof Error) {
        return error.message;
    }

    return defaultMessage;
};

/**
 * 注文ステータス更新画面用カスタムフック
 */
export const useUpdateOrderStatus = (
    orderUuid: string,
    fallbackCurrentStatusId = 0,
    fallbackCurrentStatusName = ""
) => {
    /**
     * 注文ステータス更新Service
     */
    const service = useMemo(
        () =>
            container.get<
                IUpdateOrderStatusService
            >(
                TYPES.IUpdateOrderStatusService
            ),
        []
    );

    const router = useRouter();

    /**
     * 入力画面の注文情報
     */
    const [
        order,
        setOrder,
    ] = useState<
        UpdateOrderStatusInputData | null
    >(null);

    /**
     * 確認画面の注文情報
     */
    const [
        confirmedOrder,
        setConfirmedOrder,
    ] = useState<
        UpdateOrderStatusConfirmData | null
    >(null);

    /**
     * 選択された注文ステータスID
     */
    const [
        selectedStatusId,
        setSelectedStatusId,
    ] = useState(0);

    /**
     * フォームエラー
     */
    const [
        errors,
        setErrors,
    ] = useState<
        UpdateOrderStatusErrors
    >({});

    /**
     * 通信状態
     */
    const [
        isLoading,
        setIsLoading,
    ] = useState(true);

    /**
     * 確認モーダルの表示状態
     */
    const [
        isConfirmOpen,
        setIsConfirmOpen,
    ] = useState(false);

    /**
     * 更新完了トーストの表示状態
     */
    const [
        isToastVisible,
        setIsToastVisible,
    ] = useState(false);

    /**
     * 選択された注文ステータス
     */
    const selectedStatus =
        useMemo(
            () =>
                ORDER_STATUS_OPTIONS.find(
                    (status) =>
                        status.id ===
                        selectedStatusId
                ) ?? null,
            [selectedStatusId]
        );

    /**
 * 注文情報を取得する
 */
    useEffect(() => {
        let isActive = true;

        const initializeOrder =
            async (): Promise<void> => {
                setIsLoading(true);
                setOrder(null);
                setConfirmedOrder(null);
                setSelectedStatusId(0);
                setIsConfirmOpen(false);
                setErrors({});

                if (!orderUuid.trim()) {
                    setErrors({
                        system:
                            "注文IDを取得できませんでした。",
                    });

                    setIsLoading(false);

                    return;
                }

                try {
                    const result =
                        await service.findById(
                            orderUuid
                        );

                    if (!isActive) {
                        return;
                    }

                    if (!result) {
                        setErrors({
                            system:
                                "指定された注文は存在しません。",
                        });

                        return;
                    }

                    const normalizedData =
                        normalizeInputData(
                            result,
                            orderUuid,
                            fallbackCurrentStatusId,
                            fallbackCurrentStatusName
                        );

                    setOrder(
                        normalizedData
                    );

                    /*
                     * 初期表示では
                     * 「選択してください」にする。
                     */
                    setSelectedStatusId(0);
                } catch (error: unknown) {
                    if (!isActive) {
                        return;
                    }

                    setErrors({
                        system:
                            getErrorMessage(
                                error,
                                "注文情報の取得に失敗しました。"
                            ),
                    });
                } finally {
                    if (isActive) {
                        setIsLoading(false);
                    }
                }
            };

        void initializeOrder();

        return () => {
            isActive = false;
        };
    }, [
        orderUuid,
        fallbackCurrentStatusId,
        fallbackCurrentStatusName,
        service,
    ]);

    /**
     * トーストを3秒後に閉じる
     */
    useEffect(() => {
        if (!isToastVisible) {
            return;
        }

        const timerId =
            window.setTimeout(() => {
                setIsToastVisible(false);
            }, 3000);

        return () => {
            window.clearTimeout(
                timerId
            );
        };
    }, [isToastVisible]);

    /**
     * 注文ステータスを検証する
     */
    const validateOrderStatus =
        useCallback(():
            OrderStatusOption | null => {
            if (!order) {
                setErrors((prev) => ({
                    ...prev,
                    submit:
                        "注文情報を取得できませんでした。",
                }));

                return null;
            }

            if (!selectedStatus) {
                setErrors((prev) => ({
                    ...prev,
                    orderStatus:
                        "注文ステータスを選択してください。",
                }));

                return null;
            }

            if (
                selectedStatus.id ===
                order.currentStatusId
            ) {
                setErrors((prev) => ({
                    ...prev,
                    orderStatus:
                        "現在と異なる注文ステータスを選択してください。",
                }));

                return null;
            }

            setErrors((prev) => {
                const newErrors = {
                    ...prev,
                };

                delete newErrors.orderStatus;
                delete newErrors.submit;

                return newErrors;
            });

            return selectedStatus;
        }, [
            order,
            selectedStatus,
        ]);

    /**
     * 注文ステータス変更処理
     */
    const handleStatusChange =
        useCallback(
            (statusId: number) => {
                setSelectedStatusId(
                    statusId
                );

                setConfirmedOrder(null);

                setErrors((prev) => {
                    const newErrors = {
                        ...prev,
                    };

                    delete newErrors.orderStatus;
                    delete newErrors.submit;

                    return newErrors;
                });
            },
            []
        );

    /**
     * 注文ステータスから
     * フォーカスが外れた場合
     */
    const handleStatusBlur =
        useCallback(() => {
            validateOrderStatus();
        }, [validateOrderStatus]);

    /**
     * 更新内容を確認し、
     * 確認モーダルを開く
     */
    const openConfirmModal =
        useCallback(async () => {
            const nextStatus =
                validateOrderStatus();

            if (
                !order ||
                !nextStatus
            ) {
                return;
            }

            setIsLoading(true);

            setErrors((prev) => {
                const newErrors = {
                    ...prev,
                };

                delete newErrors.submit;

                return newErrors;
            });

            try {
                const result =
                    await service
                        .confirmStatusUpdate(
                            order.orderId,
                            nextStatus.id
                        );

                const normalizedData =
                    normalizeConfirmData(
                        result,
                        order,
                        nextStatus
                    );

                setConfirmedOrder(
                    normalizedData
                );

                setIsConfirmOpen(true);
            } catch (error: unknown) {
                setErrors((prev) => ({
                    ...prev,
                    submit:
                        getErrorMessage(
                            error,
                            "注文ステータス更新内容の確認に失敗しました。"
                        ),
                }));
            } finally {
                setIsLoading(false);
            }
        }, [
            order,
            service,
            validateOrderStatus,
        ]);

    /**
     * 確認モーダルを閉じる
     */
    const closeConfirmModal =
        useCallback(() => {
            if (isLoading) {
                return;
            }

            setIsConfirmOpen(false);
            setConfirmedOrder(null);

            setErrors((prev) => {
                const newErrors = {
                    ...prev,
                };

                delete newErrors.submit;

                return newErrors;
            });
        }, [isLoading]);

    /**
 * 注文ステータスを更新する
 */
    const confirmUpdateStatus =
        useCallback(async () => {
            if (
                !order ||
                !selectedStatus
            ) {
                setErrors((prev) => ({
                    ...prev,
                    submit:
                        "更新する注文情報を取得できませんでした。",
                }));

                return;
            }

            setIsLoading(true);

            setErrors((prev) => {
                const newErrors = {
                    ...prev,
                };

                delete newErrors.submit;

                return newErrors;
            });

            try {
                await service.updateStatus(
                    order.orderId,
                    selectedStatus.id
                );

                setConfirmedOrder(null);
                setIsConfirmOpen(false);
                setErrors({});

                /*
                 * 更新完了トーストを表示する。
                 */
                setIsToastVisible(true);

                /*
                 * 更新成功後、購入履歴検索画面へ戻る。
                 */
                router.replace(
                    "/admin/order/search"
                );
            } catch (error: unknown) {
                setErrors((prev) => ({
                    ...prev,
                    submit:
                        getErrorMessage(
                            error,
                            "注文ステータスの更新に失敗しました。"
                        ),
                }));
            } finally {
                setIsLoading(false);
            }
        }, [
            order,
            selectedStatus,
            service,
            router,
        ]);

    /**
     * 選択内容を初期状態へ戻す
     */
    const resetStatus =
        useCallback(() => {
            setSelectedStatusId(0);
            setConfirmedOrder(null);
            setIsConfirmOpen(false);

            setErrors((prev) => {
                const newErrors = {
                    ...prev,
                };

                delete newErrors.orderStatus;
                delete newErrors.submit;

                return newErrors;
            });
        }, []);

    /**
     * トーストを閉じる
     */
    const closeToast =
        useCallback(() => {
            setIsToastVisible(false);
        }, []);

    /**
     * 入力項目にエラーがあるか
     */
    const hasValidationErrors =
        Boolean(
            errors.orderStatus ||
            errors.system
        );

    return {
        order,
        confirmedOrder,

        orderStatusOptions:
            ORDER_STATUS_OPTIONS,

        selectedStatusId,
        selectedStatus,

        errors,
        isLoading,
        isConfirmOpen,
        isToastVisible,
        hasValidationErrors,

        handleStatusChange,
        handleStatusBlur,

        openConfirmModal,
        closeConfirmModal,
        confirmUpdateStatus,

        resetStatus,
        closeToast,
    };
};