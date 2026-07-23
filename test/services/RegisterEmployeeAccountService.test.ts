import { beforeEach, describe, expect, it, vi } from "vitest";

import type { IEmployeeAccountRepository } from "@/interfaces/IEmployeeAccountRepository";
import type { EmployeeAccount } from "@/models/EmployeeAccount";
import { RegisterEmployeeAccountService } from "@/services/RegisterEmployeeAccountService";

describe("RegisterEmployeeAccountService", () => {
  let repository: IEmployeeAccountRepository;

  let service: RegisterEmployeeAccountService;

  beforeEach(() => {
    repository = {
      getForm: vi.fn(),
      existsByAccountName: vi.fn(),
      create: vi.fn(),
    } as unknown as IEmployeeAccountRepository;

    service = new RegisterEmployeeAccountService(repository);
  });

  it("インスタンスを生成できる", () => {
    expect(service).toBeInstanceOf(RegisterEmployeeAccountService);
  });

  it("アカウント未登録社員一覧を取得するとRepositoryのgetFormが呼ばれ取得結果が返される", async () => {
    // データを用意する
    const employeeAccounts = [
      {
        name: "山田太郎",
      } as EmployeeAccount,
      {
        name: "佐藤花子",
      } as EmployeeAccount,
    ];

    vi.mocked(repository.getForm).mockResolvedValue(employeeAccounts);

    // アカウント未登録社員一覧を取得する
    const result = await service.getForm();

    // Repositoryが呼ばれたことを検証する
    expect(repository.getForm).toHaveBeenCalledTimes(1);

    // 取得結果を検証する
    expect(result).toBe(employeeAccounts);
  });

  it("アカウント未登録社員一覧取得でRepositoryが例外を発生させるとその例外が伝播する", async () => {
    // データを用意する
    const error = new Error("社員一覧の取得に失敗しました。");

    vi.mocked(repository.getForm).mockRejectedValue(error);

    // 例外を検証する
    await expect(service.getForm()).rejects.toThrow(
      "社員一覧の取得に失敗しました。",
    );

    expect(repository.getForm).toHaveBeenCalledTimes(1);
  });

  it("未使用のアカウント名を重複確認すると前後の空白を除去してRepositoryのexistsByAccountNameが呼ばれる", async () => {
    // データを用意する
    const accountName = "  yamada_t  ";

    vi.mocked(repository.existsByAccountName).mockResolvedValue(false);

    // アカウント名の重複確認を実行する
    await service.validateAccountName(accountName);

    // Repositoryが呼ばれたことを検証する
    expect(repository.existsByAccountName).toHaveBeenCalledTimes(1);

    expect(repository.existsByAccountName).toHaveBeenCalledWith("yamada_t");
  });

  it("使用済みのアカウント名を重複確認すると例外が発生する", async () => {
    // データを用意する
    const accountName = "  yamada_t  ";

    vi.mocked(repository.existsByAccountName).mockResolvedValue(true);

    // 例外を検証する
    await expect(service.validateAccountName(accountName)).rejects.toThrow(
      "このアカウント名は既に使用されています。",
    );

    expect(repository.existsByAccountName).toHaveBeenCalledTimes(1);

    expect(repository.existsByAccountName).toHaveBeenCalledWith("yamada_t");
  });

  it("アカウント名の重複確認でRepositoryが例外を発生させるとその例外が伝播する", async () => {
    // データを用意する
    const accountName = "yamada_t";

    const error = new Error("アカウント名の確認に失敗しました。");

    vi.mocked(repository.existsByAccountName).mockRejectedValue(error);

    // 例外を検証する
    await expect(service.validateAccountName(accountName)).rejects.toThrow(
      "アカウント名の確認に失敗しました。",
    );

    expect(repository.existsByAccountName).toHaveBeenCalledWith(accountName);
  });

  it("担当者アカウントを登録すると氏名の前後の空白を除去してRepositoryのcreateが呼ばれ登録結果が返される", async () => {
    // データを用意する
    const employeeAccount = {
      name: "  山田太郎  ",
    } as EmployeeAccount;

    const registeredEmployeeAccount = {
      ...employeeAccount,
      name: "山田太郎",
    } as EmployeeAccount;

    vi.mocked(repository.create).mockResolvedValue(registeredEmployeeAccount);

    // 担当者アカウントを登録する
    const result = await service.registerEmployeeAccount(employeeAccount);

    // Repositoryが呼ばれたことを検証する
    expect(repository.create).toHaveBeenCalledTimes(1);

    expect(repository.create).toHaveBeenCalledWith({
      ...employeeAccount,
      name: "山田太郎",
    });

    // 登録結果を検証する
    expect(result).toBe(registeredEmployeeAccount);
  });

  it("担当者アカウントを登録しても元のオブジェクトは変更されない", async () => {
    // データを用意する
    const employeeAccount = {
      name: "  山田太郎  ",
    } as EmployeeAccount;

    const registeredEmployeeAccount = {
      ...employeeAccount,
      name: "山田太郎",
    } as EmployeeAccount;

    vi.mocked(repository.create).mockResolvedValue(registeredEmployeeAccount);

    // 担当者アカウントを登録する
    await service.registerEmployeeAccount(employeeAccount);

    // 元のオブジェクトを検証する
    expect(employeeAccount.name).toBe("  山田太郎  ");
  });

  it("担当者アカウント登録でRepositoryが例外を発生させるとその例外が伝播する", async () => {
    // データを用意する
    const employeeAccount = {
      name: "  山田太郎  ",
    } as EmployeeAccount;

    const error = new Error("担当者アカウントの登録に失敗しました。");

    vi.mocked(repository.create).mockRejectedValue(error);

    // 例外を検証する
    await expect(
      service.registerEmployeeAccount(employeeAccount),
    ).rejects.toThrow("担当者アカウントの登録に失敗しました。");

    expect(repository.create).toHaveBeenCalledTimes(1);

    expect(repository.create).toHaveBeenCalledWith({
      ...employeeAccount,
      name: "山田太郎",
    });
  });
});
