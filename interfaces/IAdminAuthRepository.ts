import type {
    AdminLoginCredentials,
    LoggedInAdmin,
} from "@/models/AdminAuth";

/**
 * 担当者認証Repositoryインターフェイス
 */
export interface IAdminAuthRepository {
    /**
     * 担当者としてログインする
     */
    login(
        credentials: AdminLoginCredentials
    ): Promise<LoggedInAdmin>;
}
