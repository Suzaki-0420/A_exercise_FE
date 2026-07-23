/**
 * 担当者ログアウトServiceインターフェイス
 */
export interface ILogoutAdminService {
  /**
   * 担当者をログアウトする
   */
  logout(): Promise<void>;
}
