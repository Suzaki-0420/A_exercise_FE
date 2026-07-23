import { describe, it, expect, vi, beforeEach } from "vitest";
import { EmployeeAccountRepository } from "@/infrastructures/EmployeeAccountRepository";
import type { EmployeeAccount } from "@/models/EmployeeAccount";

describe("EmployeeAccountRepository", () => {
  let repository: EmployeeAccountRepository;

  const fetchMock = vi.fn();

  beforeEach(() => {
    repository = new EmployeeAccountRepository();

    global.fetch = fetchMock;

    fetchMock.mockReset();
  });

  const createResponse = (body: unknown, status = 200) =>
    ({
      ok: true,
      status,
      json: vi.fn().mockResolvedValue(body),
    }) as unknown as Response;

  const createErrorResponse = (body: unknown, status = 400) =>
    ({
      ok: false,
      status,
      json: vi.fn().mockResolvedValue(body),
    }) as unknown as Response;

  const createJsonErrorResponse = (status = 500) =>
    ({
      ok: false,
      status,
      json: vi.fn().mockRejectedValue(new Error()),
    }) as unknown as Response;

  const createEmployeeAccount = (): EmployeeAccount =>
    ({
      accountUuid: "account-1",
      name: "test",
      password: "password",
      employee: {
        employeeUuid: "employee-1",
        name: "山田",
      },
    }) as EmployeeAccount;

  // ============================
  // getForm
  // ============================

  describe("getForm", () => {
    it("未登録社員一覧を取得できる", async () => {
      fetchMock.mockResolvedValue(
        createResponse({
          title: "社員一覧",
          employees: [
            {
              employeeUuid: "001",
              employeeName: "山田",
            },
          ],
        }),
      );

      await expect(repository.getForm()).resolves.toEqual([
        {
          accountUuid: "",
          name: "",
          password: "",
          employee: {
            employeeUuid: "001",
            name: "山田",
          },
        },
      ]);
    });

    it("messageエラーの場合throwする", async () => {
      fetchMock.mockResolvedValue(
        createErrorResponse({
          message: "取得失敗",
        }),
      );

      await expect(repository.getForm()).rejects.toThrow("取得失敗");
    });

    it("通常エラーの場合throwする", async () => {
      fetchMock.mockResolvedValue(createErrorResponse({}, 500));

      await expect(repository.getForm()).rejects.toThrow(
        "未登録社員一覧の取得に失敗しました",
      );
    });

    it("json解析失敗の場合throwする", async () => {
      fetchMock.mockResolvedValue(createJsonErrorResponse());

      await expect(repository.getForm()).rejects.toThrow(
        "未登録社員一覧の取得に失敗しました",
      );
    });
  });

  // ============================
  // existsByAccountName
  // ============================

  describe("existsByAccountName", () => {
    it("409の場合trueを返す", async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 409,
      });

      await expect(repository.existsByAccountName("test")).resolves.toBe(true);
    });

    it("exists=trueの場合trueを返す", async () => {
      fetchMock.mockResolvedValue(
        createResponse({
          exists: true,
        }),
      );

      await expect(repository.existsByAccountName("test")).resolves.toBe(true);
    });

    it("exists=falseの場合falseを返す", async () => {
      fetchMock.mockResolvedValue(
        createResponse({
          exists: false,
        }),
      );

      await expect(repository.existsByAccountName("test")).resolves.toBe(false);
    });

    it("existsがundefinedの場合falseを返す", async () => {
      fetchMock.mockResolvedValue(createResponse({}));

      await expect(repository.existsByAccountName("test")).resolves.toBe(false);
    });

    it("messageエラーの場合throwする", async () => {
      fetchMock.mockResolvedValue(
        createErrorResponse({
          message: "確認失敗",
        }),
      );

      await expect(repository.existsByAccountName("test")).rejects.toThrow(
        "確認失敗",
      );
    });

    it("errorsエラーの場合throwする", async () => {
      fetchMock.mockResolvedValue(
        createErrorResponse({
          errors: {
            AccountName: ["重複しています"],
          },
        }),
      );

      await expect(repository.existsByAccountName("test")).rejects.toThrow(
        "重複しています",
      );
    });

    it("通常エラーの場合throwする", async () => {
      fetchMock.mockResolvedValue(createErrorResponse({}, 500));

      await expect(repository.existsByAccountName("test")).rejects.toThrow(
        "アカウント名の確認に失敗しました",
      );
    });

    it("json解析失敗の場合throwする", async () => {
      fetchMock.mockResolvedValue(createJsonErrorResponse());

      await expect(repository.existsByAccountName("test")).rejects.toThrow();
    });
  });

  // ============================
  // create
  // ============================

  describe("create", () => {
    it("登録成功時はアカウントを返す", async () => {
      fetchMock.mockResolvedValue(
        createResponse({
          accountUuid: "001",
          accountName: "test",
          password: "pass",
        }),
      );

      const result = await repository.create(createEmployeeAccount());

      expect(result.accountUuid).toBe("001");

      expect(result.name).toBe("test");
    });

    it("messageエラーの場合throwする", async () => {
      fetchMock.mockResolvedValue(
        createErrorResponse({
          message: "登録失敗",
        }),
      );

      await expect(repository.create(createEmployeeAccount())).rejects.toThrow(
        "登録失敗",
      );
    });

    it("errors配列の場合throwする", async () => {
      fetchMock.mockResolvedValue(
        createErrorResponse({
          errors: {
            AccountName: ["必須です"],
          },
        }),
      );

      await expect(repository.create(createEmployeeAccount())).rejects.toThrow(
        "必須です",
      );
    });

    it("errors文字列の場合throwする", async () => {
      fetchMock.mockResolvedValue(
        createErrorResponse({
          errors: {
            AccountName: "不正です",
          },
        }),
      );

      await expect(repository.create(createEmployeeAccount())).rejects.toThrow(
        "不正です",
      );
    });

    it("errorsの値が空配列の場合も処理する", async () => {
      fetchMock.mockResolvedValue(
        createErrorResponse({
          errors: {
            AccountName: [],
          },
        }),
      );

      await expect(
        repository.create(createEmployeeAccount()),
      ).rejects.toThrow();
    });

    it("errorsが空オブジェクトの場合validationエラーをthrowする", async () => {
      fetchMock.mockResolvedValue(
        createErrorResponse({
          errors: {},
        }),
      );

      await expect(repository.create(createEmployeeAccount())).rejects.toThrow(
        "validation",
      );
    });

    it("レスポンスpassword未指定でも返却する", async () => {
      fetchMock.mockResolvedValue(
        createResponse({
          accountUuid: "001",
          accountName: "test",
        }),
      );

      const result = await repository.create(createEmployeeAccount());

      expect(result.password).toBeUndefined();
    });

    it("レスポンスにaccountUuidがない場合空文字を設定する", async () => {
      fetchMock.mockResolvedValue(
        createResponse({
          accountName: "test",
          password: "pass",
        }),
      );

      const result = await repository.create(createEmployeeAccount());

      expect(result.accountUuid).toBe("");
    });

    it("通常エラーの場合throwする", async () => {
      fetchMock.mockResolvedValue(createErrorResponse({}, 500));

      await expect(repository.create(createEmployeeAccount())).rejects.toThrow(
        "担当者アカウントの登録に失敗しました",
      );
    });

    it("json解析失敗の場合throwする", async () => {
      fetchMock.mockResolvedValue(createJsonErrorResponse());

      await expect(
        repository.create(createEmployeeAccount()),
      ).rejects.toThrow();
    });
  });
});
