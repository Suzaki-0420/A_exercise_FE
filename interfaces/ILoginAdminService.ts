import type {
    AdminLoginCredentials,
    LoggedInAdmin,
} from "@/models/AdminAuth";

/**
 * 担当者ログインServiceインターフェイス
 */
export interface ILoginAdminService {
    /**
     * 担当者としてログインする
     */
    login(
        credentials: AdminLoginCredentials
    ): Promise<LoggedInAdmin>;
}
