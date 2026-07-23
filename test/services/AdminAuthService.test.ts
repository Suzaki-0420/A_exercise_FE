import type { IAdminAuthRepository } from "@/interfaces/IAdminAuthRepository";
import type { AdminLoginCredentials, LoggedInAdmin } from "@/models/AdminAuth";
import { LoginAdminService } from "@/services/LoginAdminService";
import { LogoutAdminService } from "@/services/LogoutAdminService";
import { describe, expect, it, vi } from "vitest";

const credentials: AdminLoginCredentials = {
  accountName: "yamada01",
  password: "passYamada",
};

const loggedInAdmin: LoggedInAdmin = {
  accountUuid: "10000000-0000-0000-0000-000000000001",
  accountName: "yamada01",
  employeeName: "山田太郎",
};

const createRepository = (): IAdminAuthRepository => ({
  login: vi.fn().mockResolvedValue(loggedInAdmin),
  logout: vi.fn().mockResolvedValue(undefined),
});

describe("担当者認証Service", () => {
  it("ログイン処理をRepositoryへ委譲して結果を返す", async () => {
    const repository = createRepository();
    const service = new LoginAdminService(repository);

    await expect(service.login(credentials)).resolves.toEqual(loggedInAdmin);
    expect(repository.login).toHaveBeenCalledWith(credentials);
  });

  it("ログアウト処理をRepositoryへ委譲する", async () => {
    const repository = createRepository();
    const service = new LogoutAdminService(repository);

    await expect(service.logout()).resolves.toBeUndefined();
    expect(repository.logout).toHaveBeenCalledTimes(1);
  });
});
