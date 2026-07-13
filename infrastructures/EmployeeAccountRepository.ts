import type { IEmployeeAccountRepository } from "@/interfaces/IEmployeeAccountRepository";
import type { EmployeeAccount } from "@/models/EmployeeAccount";
import { injectable } from "inversify";

/**
 * 社員アカウントRepository
 */
@injectable()
export class EmployeeAccountRepository
    implements IEmployeeAccountRepository {

    /**
     * 社員アカウントを登録する
     */
    public async create(
        employeeAccount: EmployeeAccount
    ): Promise<EmployeeAccount> {
        /*
         * TODO:
         * 実際のControllerのURLに合わせて変更してください。
         */
        const url = "/proxy-api/account/register";

        /*
         * バックエンドの登録用ViewModelへ合わせた送信データ。
         *
         * プロパティ名は、実際のViewModelに合わせて
         * 修正する必要があります。
         */
        const requestBody = {
            accountName: employeeAccount.name,
            password: employeeAccount.password,
            employeeUuid:
                employeeAccount.employee?.employeeUuid ?? null,
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
                "========== REGISTER EMPLOYEE ACCOUNT =========="
            );
            console.log("register url:", url);
            console.log("request body:", requestBody);
            console.log("status:", response.status);
            console.log("error body:", errorData);
            console.log(
                "==============================================="
            );

            /*
             * ASP.NET Coreのフィールド別エラーに対応する。
             */
            if (errorData.errors) {
                const fieldErrors: {
                    [key: string]: string;
                } = {};

                Object.entries(errorData.errors).forEach(
                    ([key, value]) => {
                        const normalizedKey =
                            key.charAt(0).toLowerCase() +
                            key.slice(1);

                        fieldErrors[normalizedKey] =
                            Array.isArray(value)
                                ? String(value[0])
                                : String(value);
                    }
                );

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
                `社員アカウントの登録に失敗しました ` +
                `(Status: ${response.status})`
            );
        }

        return await response.json();
    }

    /**
     * アカウント名に一致する社員アカウントを取得する
     */
    public async findByName(
        accountName: string
    ): Promise<EmployeeAccount | null> {
        const params = new URLSearchParams({
            accountName,
        });

        /*
         * TODO:
         * 実際のControllerのURLに合わせて変更してください。
         */
        const url =
            `/proxy-api/account/validate?${params.toString()}`;

        const response = await fetch(url, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        });

        if (response.status === 404) {
            return null;
        }

        if (!response.ok) {
            const errorData = await response
                .json()
                .catch(() => ({}));

            console.log("========== API ERROR ==========");
            console.log("findByName url:", url);
            console.log(
                "findByName status:",
                response.status
            );
            console.log(
                "findByName error body:",
                errorData
            );
            console.log("===============================");

            if (errorData.message) {
                throw new Error(errorData.message);
            }

            throw new Error(
                `社員アカウントの取得に失敗しました ` +
                `(Status: ${response.status})`
            );
        }

        return await response.json();
    }

    /**
     * アカウント名が既に存在するか確認する
     */
    public async existsByAccountName(
        accountName: string
    ): Promise<boolean> {
        const params = new URLSearchParams({
            accountName,
        });

        /*
         * TODO:
         * 実際のControllerのURLに合わせて変更してください。
         */
        const url =
            `/proxy-api/account/validate?${params.toString()}`;

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
            console.log(
                "existsByAccountName url:",
                url
            );
            console.log(
                "existsByAccountName status:",
                response.status
            );
            console.log(
                "existsByAccountName error body:",
                errorData
            );
            console.log("===============================");

            if (errorData.message) {
                throw new Error(errorData.message);
            }

            throw new Error(
                `アカウント名の存在確認に失敗しました ` +
                `(Status: ${response.status})`
            );
        }

        /*
         * 次のようなレスポンスを想定しています。
         *
         * {
         *     "exists": true
         * }
         */
        const data: { exists: boolean } =
            await response.json();

        return data.exists;
    }

    /**
     * 社員UUIDに紐づくアカウントが既に存在するか確認する
     */
    public async existsByEmployeeUuid(
        employeeUuid: string
    ): Promise<boolean> {
        const params = new URLSearchParams({
            employeeUuid,
        });

        /*
         * TODO:
         * 実際のControllerのURLに合わせて変更してください。
         */
        const url =
            `/proxy-api/account/exists/employee?${params.toString()}`;

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
            console.log(
                "existsByEmployeeUuid url:",
                url
            );
            console.log(
                "existsByEmployeeUuid status:",
                response.status
            );
            console.log(
                "existsByEmployeeUuid error body:",
                errorData
            );
            console.log("===============================");

            if (errorData.message) {
                throw new Error(errorData.message);
            }

            throw new Error(
                `社員アカウントの存在確認に失敗しました ` +
                `(Status: ${response.status})`
            );
        }

        const data: { exists: boolean } =
            await response.json();

        return data.exists;
    }
}