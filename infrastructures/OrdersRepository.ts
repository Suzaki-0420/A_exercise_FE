import type { IOrdersRepository } from "@/interfaces/IOrdersRepository";
import type { Orders } from "@/models/Orders";
import { injectable } from "inversify";
import type {
    OrderSearchItem,
    SearchOrdersResponse,
} from "@/models/OrderSearchItem";
import type {
    UpdateOrderStatusInput,
    UpdateOrderStatusConfirm,
    UpdateOrderStatusComplete
} from "@/models/UpdateOrderStatusData";
/**
 * 注文Repository実装クラス
 */
@injectable()
export class OrdersRepository
    implements IOrdersRepository {

    /**
     * すべての購入履歴を取得する
     */
    public async findAll():
        Promise<OrderSearchItem[]> {
        // TODO: 実際のControllerのURLに合わせて修正する
        const url = "/proxy-api/order/search";

        const response = await fetch(url, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) {
            const errorData = await response
                .json()
                .catch(() => ({}));

            console.log("========== API ERROR ==========");
            console.log("findAll url:", url);
            console.log("findAll status:", response.status);
            console.log("findAll error body:", errorData);
            console.log("===============================");

            if (errorData.message) {
                throw new Error(errorData.message);
            }

            throw new Error(
                `購入履歴一覧の取得に失敗しました ` +
                `(Status: ${response.status})`
            );
        }

        const responseData =
            await response.json() as SearchOrdersResponse;

        return responseData.orderList;
    }

    /**
     * 条件を指定して購入履歴を検索する
     */
    public async search(
        orderDate: string,
        customerAccountName: string
    ): Promise<OrderSearchItem[]> {
        const params = new URLSearchParams();

        /*
         * 空文字の場合はクエリパラメータへ追加しない。
         * Controller側が空文字を受け取る設計なら、
         * 常に追加する形へ変更してもよい。
         */
        if (orderDate) {
            params.append(
                "orderDate",
                orderDate
            );
        }

        if (customerAccountName) {
            params.append(
                "customerAccountName",
                customerAccountName
            );
        }

        // TODO: 実際のControllerのURLに合わせて修正する
        const url =
            `/proxy-api/order/search/result?${params.toString()}`;

        const response = await fetch(url, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) {
            const errorData = await response
                .json()
                .catch(() => ({}));

            console.log("========== API ERROR ==========");
            console.log("search url:", url);
            console.log("search status:", response.status);
            console.log("search error body:", errorData);
            console.log("===============================");

            if (errorData.message) {
                throw new Error(errorData.message);
            }

            if (errorData.errors) {
                const messages = Object.values(
                    errorData.errors
                )
                    .flat()
                    .join("\n");

                throw new Error(messages);
            }

            throw new Error(
                `購入履歴の検索に失敗しました ` +
                `(Status: ${response.status})`
            );
        }

        const responseData =
            await response.json() as SearchOrdersResponse;

        return responseData.orderList;
    }

    /**
     * 指定された注文UUIDの注文情報を取得する
     */
    public async findById(
        orderUuid: string
    ): Promise<UpdateOrderStatusInput | null> {
        // TODO: 実際のControllerのURLに合わせて修正する
        const url =
            `/proxy-api/order/status/update/${encodeURIComponent(orderUuid)}`;

        const response = await fetch(url, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        });

        /*
         * 注文が存在しない場合
         */
        if (response.status === 404) {
            return null;
        }

        if (!response.ok) {
            const errorData = await response
                .json()
                .catch(() => ({}));

            console.log("========== API ERROR ==========");
            console.log("findById url:", url);
            console.log("findById status:", response.status);
            console.log("findById error body:", errorData);
            console.log("===============================");

            if (errorData.message) {
                throw new Error(errorData.message);
            }

            throw new Error(
                `注文情報の取得に失敗しました ` +
                `(Status: ${response.status})`
            );
        }

        return await response.json();
    }

    /**
     * 注文ステータスの更新内容を確認する
     */
    public async confirmStatusUpdate(
        orderId: string,
        newStatusId: number
    ): Promise<UpdateOrderStatusConfirm> {
        // TODO: 実際のControllerのURLに合わせて修正する
        const url =
            "/proxy-api/order/status/update/confirm";

        /*
         * バックエンドのViewModelに合わせて
         * 必要な項目だけ送信する。
         *
         * Ordersモデルのプロパティ名が異なる場合は
         * ここを修正する。
         */
        const requestBody = {
            orderId,
            newStatusId,
        };

        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type":
                    "application/json",
            },
            credentials: "include",
            body: JSON.stringify(
                requestBody
            ),
        });

        if (!response.ok) {
            const errorData = await response
                .json()
                .catch(() => ({}));

            console.log(
                "========== CONFIRM ORDER STATUS =========="
            );
            console.log("confirm url:", url);
            console.log(
                "confirm request body:",
                requestBody
            );
            console.log(
                "confirm status:",
                response.status
            );
            console.log(
                "confirm error body:",
                errorData
            );
            console.log(
                "=========================================="
            );

            this.throwApiError(
                response.status,
                errorData,
                "注文ステータス更新内容の確認に失敗しました"
            );
        }

        return await response.json();
    }

    /**
     * 注文ステータスを更新する
     */
    public async updateStatus(
        orderId: string,
        newStatusId: number
    ): Promise<UpdateOrderStatusComplete> {
        // TODO: 実際のControllerのURLに合わせて修正する
        const url =
            "/proxy-api/order/status/update/complete";

        const requestBody = {
            orderId,
            newStatusId,
        };

        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            const errorData = await response
                .json()
                .catch(() => ({}));

            console.log(
                "========== UPDATE ORDER STATUS =========="
            );
            console.log("update url:", url);
            console.log(
                "update request body:",
                requestBody
            );
            console.log(
                "update status:",
                response.status
            );
            console.log(
                "update error body:",
                errorData
            );
            console.log(
                "========================================="
            );

            this.throwApiError(
                response.status,
                errorData,
                "注文ステータスの更新に失敗しました"
            );
        }

        return await response.json();
    }

    /**
     * バックエンドのエラーレスポンスを
     * フロント用の例外へ変換する
     */
    private throwApiError(
        status: number,
        errorData: {
            message?: string;
            messages?: string[];
            errors?: Record<string, unknown>;
        },
        defaultMessage: string
    ): never {
        /*
         * messages形式のエラーに対応する。
         */
        if (
            Array.isArray(errorData.messages) &&
            errorData.messages.length > 0
        ) {
            throw new Error(
                errorData.messages.join("\n")
            );
        }

        /*
         * ASP.NET Core標準の
         * ValidationProblemDetails形式に対応する。
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

        if (errorData.message) {
            throw new Error(errorData.message);
        }

        throw new Error(
            `${defaultMessage} ` +
            `(Status: ${status})`
        );
    }
}