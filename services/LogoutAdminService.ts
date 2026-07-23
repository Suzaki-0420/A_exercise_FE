import type { IAdminAuthRepository } from "@/interfaces/IAdminAuthRepository";
import type { ILogoutAdminService } from "@/interfaces/ILogoutAdminService";
import { TYPES } from "@/di/types";
import { inject, injectable } from "inversify";

/**
 * 担当者ログアウトService
 */
@injectable()
export class LogoutAdminService implements ILogoutAdminService {
  public constructor(
    @inject(TYPES.IAdminAuthRepository)
    private readonly adminAuthRepository: IAdminAuthRepository,
  ) {}

  /**
   * 担当者をログアウトする
   */
  public async logout(): Promise<void> {
    await this.adminAuthRepository.logout();
  }
}
