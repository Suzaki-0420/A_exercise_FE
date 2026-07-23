import type { EmployeeAccount } from "@/models/EmployeeAccount";

/**
 * 社員アカウントRepositoryインターフェイス
 */
export interface IEmployeeAccountRepository {
  /**
   * アカウント未登録社員一覧を取得する
   */
  getForm(): Promise<EmployeeAccount[]>;

  /**
   * アカウント名が既に存在するか確認する
   */
  existsByAccountName(accountName: string): Promise<boolean>;

  /**
   * 社員アカウントを登録する
   */
  create(employeeAccount: EmployeeAccount): Promise<EmployeeAccount>;
}
