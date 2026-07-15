import type { IEmployeeAccountRepository } from "@/interfaces/IEmployeeAccountRepository";
import type { EmployeeAccount } from "@/models/EmployeeAccount";
import { injectable } from "inversify";

/**
 * 担当者アカウントRepository
 */
@injectable()
export class EmployeeAccountRepository
    implements IEmployeeAccountRepository {

    /**
     * アカウント未登録社員一覧を取得する
     */
    public async getForm():
        Promise<EmployeeAccount[]> {

        const url = "/proxy-api/account/form";

        const response = await fetch(url, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
            credentials: "include",
        });

        if (!response.ok) {
            const errorData = await response
                .json()
                .catch(() => ({}));

            console.log("========== API ERROR ==========");
            console.log("getForm url:", url);
            console.log("getForm status:", response.status);
            console.log("getForm error body:", errorData);
            console.log("===============================");

            if (errorData.message) {
                throw new Error(errorData.message);
            }

            throw new Error(
                `未登録社員一覧の取得に失敗しました (Status: ${response.status})`
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

        const url =
            `/proxy-api/account/validate?${params.toString()}`;

        const response = await fetch(url, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
            credentials: "include",
        });

        /*
         * 409 Conflictは、
         * アカウント名が既に存在することを表す。
         */
        if (response.status === 409) {
            return true;
        }

        if (!response.ok) {
            const errorData = await response
                .json()
                .catch(() => ({}));

            console.log("========== API ERROR ==========");
            console.log("validate url:", url);
            console.log("validate status:", response.status);
            console.log("validate error body:", errorData);
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
                `アカウント名の確認に失敗しました (Status: ${response.status})`
            );
        }

        /*
         * 200 OKの場合はレスポンスのexistsを使用する。
         *
         * バックエンドの正常レスポンス例:
         * {
         *   "exists": false,
         *   "message": "使用できるアカウント名です"
         * }
         */
        const responseData = await response.json() as {
            exists?: boolean;
        };

        return responseData.exists ?? false;
    }

    /**
     * 担当者アカウントを登録する
     */
    public async create(
        employeeAccount: EmployeeAccount
    ): Promise<EmployeeAccount> {
        const url = "/proxy-api/account/register";

        const requestBody = {
            employeeUuid:
                employeeAccount.employee?.employeeUuid,
            accountName: employeeAccount.name,
            password: employeeAccount.password,
        };

        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            credentials: "include",
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

            if (errorData.message) {
                throw new Error(errorData.message);
            }

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

            throw new Error(
                `担当者アカウントの登録に失敗しました (Status: ${response.status})`
            );
        }

        const responseData = await response.json();

        return {
            accountUuid:
                responseData.accountUuid ?? "",
            name: responseData.accountName,
            password: responseData.password,
            employee: employeeAccount.employee,
        };
    }
}