import { TYPES } from "@/di/types";
import type { IAdminAuthRepository } from "@/interfaces/IAdminAuthRepository";
import type { ILoginAdminService } from "@/interfaces/ILoginAdminService";
import type {
    AdminLoginCredentials,
    LoggedInAdmin,
} from "@/models/AdminAuth";
import { inject, injectable } from "inversify";

/**
 * 担当者ログインService
 */
@injectable()
export class LoginAdminService
    implements ILoginAdminService
{
    public constructor(
        @inject(TYPES.IAdminAuthRepository)
        private readonly adminAuthRepository: IAdminAuthRepository
    ) {}

    /**
     * 担当者としてログインする
     */
    public async login(
        credentials: AdminLoginCredentials
    ): Promise<LoggedInAdmin> {
        return await this.adminAuthRepository.login(
            credentials
        );
    }
}
