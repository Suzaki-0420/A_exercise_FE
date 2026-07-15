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

    public constructor(
        message: string,
        fieldErrors: AdminLoginFieldErrors = {}
    ) {
        super(message);
        this.name = "AdminLoginError";
        this.fieldErrors = fieldErrors;
    }
}
