import type { EmployeeAccount } from "@/models/EmployeeAccount";

/**
 * 担当者アカウント登録Serviceインターフェイス
 */
export interface IRegisterEmployeeAccountService {
  /**
   * アカウント未登録社員一覧を取得する
   */
  getForm(): Promise<EmployeeAccount[]>;

  /**
   * アカウント名の重複確認をする
   */
  validateAccountName(accountName: string): Promise<void>;

  /**
   * 担当者アカウントを登録する
   */
  registerEmployeeAccount(
    employeeAccount: EmployeeAccount,
  ): Promise<EmployeeAccount>;
}
