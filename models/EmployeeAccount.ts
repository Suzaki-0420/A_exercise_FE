import { Employee } from "./Employee";

/**
 * 社員アカウントを表すモデル
 */
export interface EmployeeAccount {
  /**
   * アカウント識別ID（UUID）
   */
  accountUuid: string;

  /**
   * アカウント名
   */
  name: string;

  /**
   * パスワード
   */
  password: string;

  /**
   * 社員
   */
  employee: Employee | null;
}
