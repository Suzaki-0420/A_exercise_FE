import type { EmployeeAccount } from "@/models/EmployeeAccount";

/**
 * 社員アカウントRepositoryインターフェイス
 */
export interface IEmployeeAccountRepository {
    /**
     * 社員アカウントを登録する
     */
    create(
        employeeAccount: EmployeeAccount
    ): Promise<EmployeeAccount>;

    /**
     * アカウント名に一致する社員アカウントを取得する
     */
    findByName(
        accountName: string
    ): Promise<EmployeeAccount | null>;

    /**
     * アカウント名が既に存在するか確認する
     */
    existsByAccountName(
        accountName: string
    ): Promise<boolean>;

    /**
     * 社員UUIDに紐づくアカウントが既に存在するか確認する
     */
    existsByEmployeeUuid(
        employeeUuid: string
    ): Promise<boolean>;
}