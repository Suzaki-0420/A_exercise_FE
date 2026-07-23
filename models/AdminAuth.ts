/**
 * 担当者ログインの入力値
 */
export interface AdminLoginCredentials {
  accountName: string;
  password: string;
}

/**
 * 担当者ログイン成功時に返される担当者情報
 */
export interface LoggedInAdmin {
  accountUuid: string;
  accountName: string;
  employeeName: string;
}

/**
 * 担当者ログアウト成功時の結果
 */
export interface AdminLogoutResult {
  loggedOut: boolean;
}

/**
 * ログインフォームの項目別エラー
 */
export type AdminLoginFieldErrors = Partial<
  Record<keyof AdminLoginCredentials, string>
>;

/**
 * 担当者ログイン処理で画面へ通知するエラー
 */
export class AdminLoginError extends Error {
  public readonly fieldErrors: AdminLoginFieldErrors;

  public constructor(message: string, fieldErrors: AdminLoginFieldErrors = {}) {
    super(message);
    this.name = "AdminLoginError";
    this.fieldErrors = fieldErrors;
  }
}

/**
 * 担当者ログアウト処理で画面へ通知するエラー
 */
export class AdminLogoutError extends Error {
  public readonly status?: number;

  public constructor(message: string, status?: number) {
    super(message);
    this.name = "AdminLogoutError";
    this.status = status;
  }
}
