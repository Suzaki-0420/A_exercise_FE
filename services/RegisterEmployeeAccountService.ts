import {
    inject,
    injectable,
} from "inversify";

import { TYPES } from "@/di/types";
import type { IEmployeeAccountRepository } from
    "@/interfaces/IEmployeeAccountRepository";
import type { IRegisterEmployeeAccountService } from
    "@/interfaces/IRegisterEmployeeAccountService";
import type { EmployeeAccount } from
    "@/models/EmployeeAccount";

/**
 * 担当者アカウント登録Service
 */
@injectable()
export class RegisterEmployeeAccountService
    implements IRegisterEmployeeAccountService {

    /**
     * コンストラクタ
     */
    public constructor(
        @inject(TYPES.IEmployeeAccountRepository)
        private readonly employeeAccountRepository:
            IEmployeeAccountRepository
    ) { }

    /**
     * アカウント未登録社員一覧を取得する
     */
    public async getForm():
        Promise<EmployeeAccount[]> {

        return await this.employeeAccountRepository
            .getForm();
    }

    /**
     * アカウント名の重複確認をする
     */
    public async validateAccountName(
        accountName: string
    ): Promise<void> {

        const normalizedAccountName =
            accountName.trim();

        const exists =
            await this.employeeAccountRepository
                .existsByAccountName(
                    normalizedAccountName
                );

        if (exists) {
            throw new Error(
                "このアカウント名は既に使用されています。"
            );
        }
    }

    /**
     * 担当者アカウントを登録する
     */
    public async registerEmployeeAccount(
        employeeAccount: EmployeeAccount
    ): Promise<EmployeeAccount> {

        const normalizedEmployeeAccount:
            EmployeeAccount = {
            ...employeeAccount,
            name: employeeAccount.name.trim(),
        };

        return await this.employeeAccountRepository
            .create(normalizedEmployeeAccount);
    }
}