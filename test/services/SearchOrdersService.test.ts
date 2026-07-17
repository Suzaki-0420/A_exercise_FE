import {
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from "vitest";

import type { IOrdersRepository } from
    "@/interfaces/IOrdersRepository";
import type { OrderSearchItem } from
    "@/models/OrderSearchItem";
import { SearchOrdersService } from
    "@/services/SearchOrdersService";

describe("SearchOrdersService", () => {
    let repository:
        IOrdersRepository;

    let service:
        SearchOrdersService;

    beforeEach(() => {
        repository = {
            findAll: vi.fn(),
            search: vi.fn(),
        } as unknown as IOrdersRepository;

        service = new SearchOrdersService(
            repository,
        );
    });

    it(
        "インスタンスを生成できる",
        () => {
            expect(service).toBeInstanceOf(
                SearchOrdersService,
            );
        },
    );

    it(
        "すべての購入履歴を取得するとRepositoryのfindAllが呼ばれ取得結果が返される",
        async () => {
            // データを用意する
            const orders = [
                {
                    orderUuid:
                        "50000000-0000-0000-0000-000000000004",
                    orderDate:
                        "2026/07/16 11:05:00",
                    customerAccountName:
                        "yamamoto_f",
                    orderContent:
                        "卓上電卓 12桁 × 2",
                    orderStatus:
                        "配達完了",
                    statusUpdateUrl:
                        "/admin/order/status/update/50000000-0000-0000-0000-000000000004",
                },
            ] as OrderSearchItem[];

            vi.mocked(repository.findAll)
                .mockResolvedValue(orders);

            // すべての購入履歴を取得する
            const result =
                await service.findAll();

            // Repositoryが呼ばれたことを検証する
            expect(
                repository.findAll,
            ).toHaveBeenCalledTimes(1);

            expect(
                repository.findAll,
            ).toHaveBeenCalledWith();

            // 取得結果を検証する
            expect(result).toBe(orders);
        },
    );

    it(
        "すべての購入履歴の取得でRepositoryが例外を発生させるとその例外が伝播する",
        async () => {
            // データを用意する
            const error = new Error(
                "購入履歴の取得に失敗しました。",
            );

            vi.mocked(repository.findAll)
                .mockRejectedValue(error);

            // 例外を検証する
            await expect(
                service.findAll(),
            ).rejects.toThrow(
                "購入履歴の取得に失敗しました。",
            );

            expect(
                repository.findAll,
            ).toHaveBeenCalledTimes(1);
        },
    );

    it(
        "条件を指定して購入履歴を検索するとRepositoryのsearchが呼ばれ検索結果が返される",
        async () => {
            // データを用意する
            const orderDate =
                "2026-07-16";

            const customerAccountName =
                "yamamoto_f";

            const orders = [
                {
                    orderUuid:
                        "50000000-0000-0000-0000-000000000004",
                    orderDate:
                        "2026/07/16 11:05:00",
                    customerAccountName:
                        "yamamoto_f",
                    orderContent:
                        "卓上電卓 12桁 × 2",
                    orderStatus:
                        "配達完了",
                    statusUpdateUrl:
                        "/admin/order/status/update/50000000-0000-0000-0000-000000000004",
                },
            ] as OrderSearchItem[];

            vi.mocked(repository.search)
                .mockResolvedValue(orders);

            // 条件を指定して購入履歴を検索する
            const result =
                await service.searchOrders(
                    orderDate,
                    customerAccountName,
                );

            // Repositoryが呼ばれたことを検証する
            expect(
                repository.search,
            ).toHaveBeenCalledTimes(1);

            expect(
                repository.search,
            ).toHaveBeenCalledWith(
                orderDate,
                customerAccountName,
            );

            // 検索結果を検証する
            expect(result).toBe(orders);
        },
    );

    it(
        "購入履歴の検索でRepositoryが例外を発生させるとその例外が伝播する",
        async () => {
            // データを用意する
            const orderDate =
                "2026-07-16";

            const customerAccountName =
                "yamamoto_f";

            const error = new Error(
                "購入履歴の検索に失敗しました。",
            );

            vi.mocked(repository.search)
                .mockRejectedValue(error);

            // 例外を検証する
            await expect(
                service.searchOrders(
                    orderDate,
                    customerAccountName,
                ),
            ).rejects.toThrow(
                "購入履歴の検索に失敗しました。",
            );

            expect(
                repository.search,
            ).toHaveBeenCalledTimes(1);

            expect(
                repository.search,
            ).toHaveBeenCalledWith(
                orderDate,
                customerAccountName,
            );
        },
    );
});