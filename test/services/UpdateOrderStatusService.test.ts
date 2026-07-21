import {
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from "vitest";

import type { IOrdersRepository } from
    "@/interfaces/IOrdersRepository";
import type {
    UpdateOrderStatusComplete,
    UpdateOrderStatusConfirm,
    UpdateOrderStatusInput,
} from "@/models/UpdateOrderStatusData";
import {
    UpdateOrderStatusService,
} from
    "@/services/UpdateOrderStatusService";

/**
 * 注文ステータス更新入力情報を生成する
 */
const createUpdateOrderStatusInput = (
    orderId:
        string =
        "50000000-0000-0000-0000-000000000001",
): UpdateOrderStatusInput => ({
    orderId,
    orderDate:
        "2026/07/16 11:05:00",
    customerAccountName:
        "yamamoto_f",
    orderContent:
        "卓上電卓 12桁 × 2",
    currentStatusId: 3,
    currentStatusName:
        "発送済み",
    orderStatuses: [
        {
            id: 1,
            name: "注文受付",
        },
        {
            id: 2,
            name: "発送準備中",
        },
        {
            id: 3,
            name: "発送済み",
        },
        {
            id: 4,
            name: "配達完了",
        },
    ],
} as unknown as
    UpdateOrderStatusInput);

/**
 * 注文ステータス更新確認情報を生成する
 */
const createUpdateOrderStatusConfirm = (
    orderId:
        string =
        "50000000-0000-0000-0000-000000000001",
    newStatusId:
        number = 4,
): UpdateOrderStatusConfirm => ({
    orderId,
    orderDate:
        "2026/07/16 11:05:00",
    customerAccountName:
        "yamamoto_f",
    orderContent:
        "卓上電卓 12桁 × 2",
    currentStatusId: 3,
    currentStatusName:
        "発送済み",
    newStatusId,
    newStatusName:
        "配達完了",
} as unknown as
    UpdateOrderStatusConfirm);

/**
 * 注文ステータス更新完了情報を生成する
 */
const createUpdateOrderStatusComplete = (
    orderId:
        string =
        "50000000-0000-0000-0000-000000000001",
    newStatusId:
        number = 4,
): UpdateOrderStatusComplete => ({
    orderId,
    newStatusId,
    newStatusName:
        "配達完了",
    message:
        "注文ステータスを更新しました。",
} as unknown as
    UpdateOrderStatusComplete);

describe(
    "UpdateOrderStatusService",
    () => {
        let repository:
            IOrdersRepository;

        let service:
            UpdateOrderStatusService;

        beforeEach(() => {
            repository = {
                findById: vi.fn(),
                confirmStatusUpdate:
                    vi.fn(),
                updateStatus:
                    vi.fn(),
            } as unknown as
                IOrdersRepository;

            service =
                new UpdateOrderStatusService(
                    repository,
                );
        });

        it(
            "インスタンスを生成できる",
            () => {
                expect(
                    service,
                ).toBeInstanceOf(
                    UpdateOrderStatusService,
                );
            },
        );

        it(
            "注文UUIDを指定するとRepositoryのfindByIdが呼ばれ注文情報が返される",
            async () => {
                // データを用意する
                const orderUuid =
                    "50000000-0000-0000-0000-000000000001";

                const order =
                    createUpdateOrderStatusInput(
                        orderUuid,
                    );

                vi.mocked(
                    repository.findById,
                ).mockResolvedValue(
                    order,
                );

                // 注文情報を取得する
                const result =
                    await service.findById(
                        orderUuid,
                    );

                // Repositoryの呼び出しを検証する
                expect(
                    repository.findById,
                ).toHaveBeenCalledTimes(1);

                expect(
                    repository.findById,
                ).toHaveBeenCalledWith(
                    orderUuid,
                );

                // 取得結果を検証する
                expect(result).toBe(
                    order,
                );
            },
        );

        it(
            "指定した注文が存在しない場合はnullを返す",
            async () => {
                // データを用意する
                const orderUuid =
                    "50000000-0000-0000-0000-000000000099";

                vi.mocked(
                    repository.findById,
                ).mockResolvedValue(
                    null,
                );

                // 注文情報を取得する
                const result =
                    await service.findById(
                        orderUuid,
                    );

                // Repositoryの呼び出しを検証する
                expect(
                    repository.findById,
                ).toHaveBeenCalledTimes(1);

                expect(
                    repository.findById,
                ).toHaveBeenCalledWith(
                    orderUuid,
                );

                // 取得結果を検証する
                expect(result).toBeNull();
            },
        );

        it(
            "注文情報取得でRepositoryが例外を発生させるとその例外が伝播する",
            async () => {
                // データを用意する
                const orderUuid =
                    "50000000-0000-0000-0000-000000000001";

                const error =
                    new Error(
                        "注文情報の取得に失敗しました。",
                    );

                vi.mocked(
                    repository.findById,
                ).mockRejectedValue(
                    error,
                );

                // 例外を検証する
                await expect(
                    service.findById(
                        orderUuid,
                    ),
                ).rejects.toThrow(
                    "注文情報の取得に失敗しました。",
                );

                expect(
                    repository.findById,
                ).toHaveBeenCalledTimes(1);

                expect(
                    repository.findById,
                ).toHaveBeenCalledWith(
                    orderUuid,
                );
            },
        );

        it(
            "注文ステータスの更新内容を確認するとRepositoryのconfirmStatusUpdateが呼ばれ確認結果が返される",
            async () => {
                // データを用意する
                const orderId =
                    "50000000-0000-0000-0000-000000000001";

                const newStatusId = 4;

                const confirmResult =
                    createUpdateOrderStatusConfirm(
                        orderId,
                        newStatusId,
                    );

                vi.mocked(
                    repository
                        .confirmStatusUpdate,
                ).mockResolvedValue(
                    confirmResult,
                );

                // 更新内容を確認する
                const result =
                    await service
                        .confirmStatusUpdate(
                            orderId,
                            newStatusId,
                        );

                // Repositoryの呼び出しを検証する
                expect(
                    repository
                        .confirmStatusUpdate,
                ).toHaveBeenCalledTimes(1);

                expect(
                    repository
                        .confirmStatusUpdate,
                ).toHaveBeenCalledWith(
                    orderId,
                    newStatusId,
                );

                // 確認結果を検証する
                expect(result).toBe(
                    confirmResult,
                );
            },
        );

        it(
            "更新内容確認でRepositoryが例外を発生させるとその例外が伝播する",
            async () => {
                // データを用意する
                const orderId =
                    "50000000-0000-0000-0000-000000000001";

                const newStatusId = 4;

                const error =
                    new Error(
                        "更新内容の確認に失敗しました。",
                    );

                vi.mocked(
                    repository
                        .confirmStatusUpdate,
                ).mockRejectedValue(
                    error,
                );

                // 例外を検証する
                await expect(
                    service
                        .confirmStatusUpdate(
                            orderId,
                            newStatusId,
                        ),
                ).rejects.toThrow(
                    "更新内容の確認に失敗しました。",
                );

                expect(
                    repository
                        .confirmStatusUpdate,
                ).toHaveBeenCalledTimes(1);

                expect(
                    repository
                        .confirmStatusUpdate,
                ).toHaveBeenCalledWith(
                    orderId,
                    newStatusId,
                );
            },
        );

        it(
            "注文ステータスを更新するとRepositoryのupdateStatusが呼ばれ更新結果が返される",
            async () => {
                // データを用意する
                const orderId =
                    "50000000-0000-0000-0000-000000000001";

                const newStatusId = 4;

                const completeResult =
                    createUpdateOrderStatusComplete(
                        orderId,
                        newStatusId,
                    );

                vi.mocked(
                    repository.updateStatus,
                ).mockResolvedValue(
                    completeResult,
                );

                // 注文ステータスを更新する
                const result =
                    await service.updateStatus(
                        orderId,
                        newStatusId,
                    );

                // Repositoryの呼び出しを検証する
                expect(
                    repository.updateStatus,
                ).toHaveBeenCalledTimes(1);

                expect(
                    repository.updateStatus,
                ).toHaveBeenCalledWith(
                    orderId,
                    newStatusId,
                );

                // 更新結果を検証する
                expect(result).toBe(
                    completeResult,
                );
            },
        );

        it(
            "注文ステータス更新でRepositoryが例外を発生させるとその例外が伝播する",
            async () => {
                // データを用意する
                const orderId =
                    "50000000-0000-0000-0000-000000000001";

                const newStatusId = 4;

                const error =
                    new Error(
                        "注文ステータスの更新に失敗しました。",
                    );

                vi.mocked(
                    repository.updateStatus,
                ).mockRejectedValue(
                    error,
                );

                // 例外を検証する
                await expect(
                    service.updateStatus(
                        orderId,
                        newStatusId,
                    ),
                ).rejects.toThrow(
                    "注文ステータスの更新に失敗しました。",
                );

                expect(
                    repository.updateStatus,
                ).toHaveBeenCalledTimes(1);

                expect(
                    repository.updateStatus,
                ).toHaveBeenCalledWith(
                    orderId,
                    newStatusId,
                );
            },
        );
    },
);