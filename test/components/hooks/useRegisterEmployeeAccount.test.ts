// @vitest-environment jsdom

import {
    act,
    cleanup,
    renderHook,
    waitFor,
} from "@testing-library/react";
import type {
    ChangeEvent,
} from "react";
import {
    afterEach,
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from "vitest";

import { TYPES } from "@/di/types";
import type {
    IRegisterEmployeeAccountService,
} from
    "@/interfaces/IRegisterEmployeeAccountService";
import type {
    EmployeeAccount,
} from
    "@/models/EmployeeAccount";
import {
    useRegisterEmployeeAccount,
} from
    "@/components/hooks/useRegisterEmployeeAccount";

/*
 * vi.mockは巻き上げられるため、
 * vi.hoistedでモック関数を生成する。
 */
const {
    mockContainerGet,
    mockGetForm,
    mockValidateAccountName,
    mockRegisterEmployeeAccount,
} = vi.hoisted(() => ({
    mockContainerGet: vi.fn(),
    mockGetForm: vi.fn(),
    mockValidateAccountName: vi.fn(),
    mockRegisterEmployeeAccount:
        vi.fn(),
}));

vi.mock("@/di/container", () => ({
    container: {
        get: mockContainerGet,
    },
}));

type RegisterEmployeeAccountHook =
    ReturnType<
        typeof useRegisterEmployeeAccount
    >;

type HookResult = {
    current:
    RegisterEmployeeAccountHook;
};

type FormFieldName =
    | "employeeUuid"
    | "name"
    | "password";

/**
 * 社員情報を生成する
 */
const createEmployeeAccount = (
    employeeUuid: string,
    employeeName: string,
): EmployeeAccount => ({
    accountUuid: "",
    name: "",
    password: "",
    employee: {
        employeeUuid,
        name: employeeName,
    },
} as EmployeeAccount);

/**
 * 入力値を変更する
 */
const changeField = (
    result: HookResult,
    name: FormFieldName,
    value: string,
): void => {
    act(() => {
        result.current.handleChange({
            target: {
                name,
                value,
            },
        } as ChangeEvent<
            HTMLInputElement |
            HTMLSelectElement
        >);
    });
};

/**
 * 初期ロード完了まで待機する
 */
const waitForInitialLoad = async (
    result: HookResult,
): Promise<void> => {
    await waitFor(() => {
        expect(
            mockGetForm,
        ).toHaveBeenCalledTimes(1);

        expect(
            result.current
                .isInitialLoading,
        ).toBe(false);
    });
};

/**
 * 正常な入力値を設定する
 */
const setValidFormData = (
    result: HookResult,
    employeeUuid =
        "employee-uuid-1",
): void => {
    changeField(
        result,
        "employeeUuid",
        employeeUuid,
    );

    changeField(
        result,
        "name",
        "  yamada01  ",
    );

    changeField(
        result,
        "password",
        "password123",
    );
};

/**
 * 確認モーダルを開く
 */
const openConfirmModal = async (
    result: HookResult,
): Promise<void> => {
    setValidFormData(result);

    await act(async () => {
        await result.current
            .openConfirmModal();
    });
};

describe(
    "useRegisterEmployeeAccount",
    () => {
        const employeeAccount1 =
            createEmployeeAccount(
                "employee-uuid-1",
                "山田太郎",
            );

        const employeeAccount2 =
            createEmployeeAccount(
                "employee-uuid-2",
                "佐藤花子",
            );

        beforeEach(() => {
            mockContainerGet.mockReset();
            mockGetForm.mockReset();

            mockValidateAccountName
                .mockReset();

            mockRegisterEmployeeAccount
                .mockReset();

            const mockService = {
                getForm:
                    mockGetForm,
                validateAccountName:
                    mockValidateAccountName,
                registerEmployeeAccount:
                    mockRegisterEmployeeAccount,
            } as
                IRegisterEmployeeAccountService;

            mockContainerGet
                .mockReturnValue(
                    mockService,
                );

            mockGetForm
                .mockResolvedValue([
                    employeeAccount1,
                    employeeAccount2,
                ]);

            mockValidateAccountName
                .mockResolvedValue(
                    undefined,
                );
        });

        afterEach(() => {
            cleanup();

            vi.clearAllTimers();
            vi.useRealTimers();
            vi.restoreAllMocks();
        });

        it(
            "初期状態が正しく設定される",
            async () => {
                const { result } =
                    renderHook(
                        () =>
                            useRegisterEmployeeAccount(),
                    );

                expect(
                    mockContainerGet,
                ).toHaveBeenCalledWith(
                    TYPES
                        .IRegisterEmployeeAccountService,
                );

                await waitForInitialLoad(
                    result,
                );

                expect(
                    result.current
                        .employeeAccounts,
                ).toEqual([
                    employeeAccount1,
                    employeeAccount2,
                ]);

                expect(
                    result.current.formData,
                ).toEqual({
                    employeeUuid: "",
                    name: "",
                    password: "",
                });

                expect(
                    result.current.errors,
                ).toEqual({});

                expect(
                    result.current
                        .selectedEmployeeName,
                ).toBe("");

                expect(
                    result.current
                        .isInitialLoading,
                ).toBe(false);

                expect(
                    result.current.isLoading,
                ).toBe(false);

                expect(
                    result.current
                        .isConfirmOpen,
                ).toBe(false);

                expect(
                    result.current
                        .isToastVisible,
                ).toBe(false);

                expect(
                    result.current
                        .hasValidationErrors,
                ).toBe(false);
            },
        );

        it(
            "初期表示時に未登録社員一覧を取得する",
            async () => {
                const { result } =
                    renderHook(
                        () =>
                            useRegisterEmployeeAccount(),
                    );

                await waitForInitialLoad(
                    result,
                );

                expect(
                    mockGetForm,
                ).toHaveBeenCalledTimes(1);

                expect(
                    result.current
                        .employeeAccounts,
                ).toEqual([
                    employeeAccount1,
                    employeeAccount2,
                ]);

                expect(
                    result.current.errors
                        .system,
                ).toBeUndefined();
            },
        );

        it(
            "未登録社員一覧取得でErrorが発生するとsystemエラーを設定する",
            async () => {
                mockGetForm
                    .mockRejectedValue(
                        new Error(
                            "社員一覧の取得に失敗しました。",
                        ),
                    );

                const { result } =
                    renderHook(
                        () =>
                            useRegisterEmployeeAccount(),
                    );

                await waitForInitialLoad(
                    result,
                );

                expect(
                    result.current.errors
                        .system,
                ).toBe(
                    "社員一覧の取得に失敗しました。",
                );

                expect(
                    result.current
                        .employeeAccounts,
                ).toEqual([]);

                expect(
                    result.current
                        .hasValidationErrors,
                ).toBe(true);

                expect(
                    result.current
                        .isInitialLoading,
                ).toBe(false);
            },
        );

        it(
            "未登録社員一覧取得でError以外が発生すると既定のメッセージを設定する",
            async () => {
                mockGetForm
                    .mockRejectedValue(
                        "unknown error",
                    );

                const { result } =
                    renderHook(
                        () =>
                            useRegisterEmployeeAccount(),
                    );

                await waitForInitialLoad(
                    result,
                );

                expect(
                    result.current.errors
                        .system,
                ).toBe(
                    "社員情報の取得に失敗しました。",
                );

                expect(
                    result.current
                        .employeeAccounts,
                ).toEqual([]);

                expect(
                    result.current
                        .isInitialLoading,
                ).toBe(false);
            },
        );

        it(
            "入力値を変更するとフォームデータが更新される",
            async () => {
                const { result } =
                    renderHook(
                        () =>
                            useRegisterEmployeeAccount(),
                    );

                await waitForInitialLoad(
                    result,
                );

                changeField(
                    result,
                    "employeeUuid",
                    "employee-uuid-1",
                );

                changeField(
                    result,
                    "name",
                    "yamada01",
                );

                changeField(
                    result,
                    "password",
                    "password123",
                );

                expect(
                    result.current.formData,
                ).toEqual({
                    employeeUuid:
                        "employee-uuid-1",
                    name: "yamada01",
                    password:
                        "password123",
                });
            },
        );

        it(
            "社員を選択すると選択中の社員名を取得できる",
            async () => {
                const { result } =
                    renderHook(
                        () =>
                            useRegisterEmployeeAccount(),
                    );

                await waitForInitialLoad(
                    result,
                );

                changeField(
                    result,
                    "employeeUuid",
                    "employee-uuid-1",
                );

                expect(
                    result.current
                        .selectedEmployeeName,
                ).toBe("山田太郎");
            },
        );

        it(
            "存在しない社員識別IDの場合は社員名が空文字になる",
            async () => {
                const { result } =
                    renderHook(
                        () =>
                            useRegisterEmployeeAccount(),
                    );

                await waitForInitialLoad(
                    result,
                );

                changeField(
                    result,
                    "employeeUuid",
                    "not-found-uuid",
                );

                expect(
                    result.current
                        .selectedEmployeeName,
                ).toBe("");
            },
        );

        it(
            "社員が未選択の場合は社員選択エラーになる",
            async () => {
                const { result } =
                    renderHook(
                        () =>
                            useRegisterEmployeeAccount(),
                    );

                await waitForInitialLoad(
                    result,
                );

                changeField(
                    result,
                    "name",
                    "yamada01",
                );

                changeField(
                    result,
                    "password",
                    "password123",
                );

                await act(async () => {
                    await result.current
                        .openConfirmModal();
                });

                expect(
                    result.current.errors
                        .employeeUuid,
                ).toBe(
                    "社員名を選択してください。",
                );

                expect(
                    result.current
                        .isConfirmOpen,
                ).toBe(false);

                expect(
                    result.current
                        .hasValidationErrors,
                ).toBe(true);
            },
        );

        it(
            "存在しない社員を選択した場合は社員不存在エラーになる",
            async () => {
                const { result } =
                    renderHook(
                        () =>
                            useRegisterEmployeeAccount(),
                    );

                await waitForInitialLoad(
                    result,
                );

                setValidFormData(
                    result,
                    "not-found-uuid",
                );

                await act(async () => {
                    await result.current
                        .openConfirmModal();
                });

                expect(
                    result.current.errors
                        .employeeUuid,
                ).toBe(
                    "選択された社員が存在しません。",
                );

                expect(
                    result.current
                        .isConfirmOpen,
                ).toBe(false);
            },
        );

        it(
            "アカウント名が未入力の場合は必須エラーになる",
            async () => {
                const { result } =
                    renderHook(
                        () =>
                            useRegisterEmployeeAccount(),
                    );

                await waitForInitialLoad(
                    result,
                );

                changeField(
                    result,
                    "name",
                    "   ",
                );

                await act(async () => {
                    await result.current
                        .handleAccountNameBlur();
                });

                expect(
                    result.current.errors
                        .name,
                ).toBe(
                    "アカウント名を入力してください。",
                );

                expect(
                    mockValidateAccountName,
                ).not.toHaveBeenCalled();
            },
        );

        it(
            "アカウント名が5文字未満の場合は文字数エラーになる",
            async () => {
                const { result } =
                    renderHook(
                        () =>
                            useRegisterEmployeeAccount(),
                    );

                await waitForInitialLoad(
                    result,
                );

                changeField(
                    result,
                    "name",
                    "abcd",
                );

                await act(async () => {
                    await result.current
                        .handleAccountNameBlur();
                });

                expect(
                    result.current.errors
                        .name,
                ).toBe(
                    "アカウント名は5文字以上20文字以内で入力してください。",
                );

                expect(
                    mockValidateAccountName,
                ).not.toHaveBeenCalled();
            },
        );

        it(
            "アカウント名が20文字の場合は重複確認できる",
            async () => {
                const { result } =
                    renderHook(
                        () =>
                            useRegisterEmployeeAccount(),
                    );

                await waitForInitialLoad(
                    result,
                );

                const accountName =
                    "a".repeat(20);

                changeField(
                    result,
                    "name",
                    accountName,
                );

                await act(async () => {
                    await result.current
                        .handleAccountNameBlur();
                });

                expect(
                    mockValidateAccountName,
                ).toHaveBeenCalledWith(
                    accountName,
                );

                expect(
                    result.current.errors
                        .name,
                ).toBeUndefined();
            },
        );

        it(
            "アカウント名が20文字を超える場合は文字数エラーになる",
            async () => {
                const { result } =
                    renderHook(
                        () =>
                            useRegisterEmployeeAccount(),
                    );

                await waitForInitialLoad(
                    result,
                );

                changeField(
                    result,
                    "name",
                    "a".repeat(21),
                );

                await act(async () => {
                    await result.current
                        .handleAccountNameBlur();
                });

                expect(
                    result.current.errors
                        .name,
                ).toBe(
                    "アカウント名は5文字以上20文字以内で入力してください。",
                );

                expect(
                    mockValidateAccountName,
                ).not.toHaveBeenCalled();
            },
        );

        it(
            "アカウント名に半角英数字以外が含まれる場合は形式エラーになる",
            async () => {
                const { result } =
                    renderHook(
                        () =>
                            useRegisterEmployeeAccount(),
                    );

                await waitForInitialLoad(
                    result,
                );

                changeField(
                    result,
                    "name",
                    "yamada_01",
                );

                await act(async () => {
                    await result.current
                        .handleAccountNameBlur();
                });

                expect(
                    result.current.errors
                        .name,
                ).toBe(
                    "アカウント名は半角英数字で入力してください。",
                );

                expect(
                    mockValidateAccountName,
                ).not.toHaveBeenCalled();
            },
        );

        it(
            "有効なアカウント名の場合は前後の空白を除去して重複確認する",
            async () => {
                const { result } =
                    renderHook(
                        () =>
                            useRegisterEmployeeAccount(),
                    );

                await waitForInitialLoad(
                    result,
                );

                changeField(
                    result,
                    "name",
                    "  yamada01  ",
                );

                await act(async () => {
                    await result.current
                        .handleAccountNameBlur();
                });

                expect(
                    mockValidateAccountName,
                ).toHaveBeenCalledTimes(1);

                expect(
                    mockValidateAccountName,
                ).toHaveBeenCalledWith(
                    "yamada01",
                );

                expect(
                    result.current.errors
                        .name,
                ).toBeUndefined();
            },
        );

        it(
            "アカウント名確認でErrorが発生するとそのメッセージを表示する",
            async () => {
                mockValidateAccountName
                    .mockRejectedValue(
                        new Error(
                            "このアカウント名は既に使用されています。",
                        ),
                    );

                const { result } =
                    renderHook(
                        () =>
                            useRegisterEmployeeAccount(),
                    );

                await waitForInitialLoad(
                    result,
                );

                changeField(
                    result,
                    "name",
                    "yamada01",
                );

                await act(async () => {
                    await result.current
                        .handleAccountNameBlur();
                });

                expect(
                    result.current.errors
                        .name,
                ).toBe(
                    "このアカウント名は既に使用されています。",
                );
            },
        );

        it(
            "アカウント名確認でError以外が発生すると既定のメッセージを表示する",
            async () => {
                mockValidateAccountName
                    .mockRejectedValue(
                        "unknown error",
                    );

                const { result } =
                    renderHook(
                        () =>
                            useRegisterEmployeeAccount(),
                    );

                await waitForInitialLoad(
                    result,
                );

                changeField(
                    result,
                    "name",
                    "yamada01",
                );

                await act(async () => {
                    await result.current
                        .handleAccountNameBlur();
                });

                expect(
                    result.current.errors
                        .name,
                ).toBe(
                    "アカウント名の確認に失敗しました。",
                );
            },
        );

        it(
            "パスワードが未入力の場合は必須エラーになる",
            async () => {
                const { result } =
                    renderHook(
                        () =>
                            useRegisterEmployeeAccount(),
                    );

                await waitForInitialLoad(
                    result,
                );

                changeField(
                    result,
                    "employeeUuid",
                    "employee-uuid-1",
                );

                changeField(
                    result,
                    "name",
                    "yamada01",
                );

                await act(async () => {
                    await result.current
                        .openConfirmModal();
                });

                expect(
                    result.current.errors
                        .password,
                ).toBe(
                    "パスワードを入力してください。",
                );

                expect(
                    result.current
                        .isConfirmOpen,
                ).toBe(false);
            },
        );

        it(
            "パスワードが8文字未満の場合は文字数エラーになる",
            async () => {
                const { result } =
                    renderHook(
                        () =>
                            useRegisterEmployeeAccount(),
                    );

                await waitForInitialLoad(
                    result,
                );

                changeField(
                    result,
                    "employeeUuid",
                    "employee-uuid-1",
                );

                changeField(
                    result,
                    "name",
                    "yamada01",
                );

                changeField(
                    result,
                    "password",
                    "abc1234",
                );

                await act(async () => {
                    await result.current
                        .openConfirmModal();
                });

                expect(
                    result.current.errors
                        .password,
                ).toBe(
                    "パスワードは8文字以上64文字以内で入力してください。",
                );

                expect(
                    result.current
                        .isConfirmOpen,
                ).toBe(false);
            },
        );

        it(
            "パスワードが64文字の場合は確認モーダルを開ける",
            async () => {
                const { result } =
                    renderHook(
                        () =>
                            useRegisterEmployeeAccount(),
                    );

                await waitForInitialLoad(
                    result,
                );

                changeField(
                    result,
                    "employeeUuid",
                    "employee-uuid-1",
                );

                changeField(
                    result,
                    "name",
                    "yamada01",
                );

                changeField(
                    result,
                    "password",
                    "a".repeat(64),
                );

                await act(async () => {
                    await result.current
                        .openConfirmModal();
                });

                expect(
                    result.current.errors
                        .password,
                ).toBeUndefined();

                expect(
                    result.current
                        .isConfirmOpen,
                ).toBe(true);
            },
        );

        it(
            "パスワードが64文字を超える場合は文字数エラーになる",
            async () => {
                const { result } =
                    renderHook(
                        () =>
                            useRegisterEmployeeAccount(),
                    );

                await waitForInitialLoad(
                    result,
                );

                changeField(
                    result,
                    "employeeUuid",
                    "employee-uuid-1",
                );

                changeField(
                    result,
                    "name",
                    "yamada01",
                );

                changeField(
                    result,
                    "password",
                    "a".repeat(65),
                );

                await act(async () => {
                    await result.current
                        .openConfirmModal();
                });

                expect(
                    result.current.errors
                        .password,
                ).toBe(
                    "パスワードは8文字以上64文字以内で入力してください。",
                );

                expect(
                    result.current
                        .isConfirmOpen,
                ).toBe(false);
            },
        );

        it(
            "パスワードに半角英数字以外が含まれる場合は形式エラーになる",
            async () => {
                const { result } =
                    renderHook(
                        () =>
                            useRegisterEmployeeAccount(),
                    );

                await waitForInitialLoad(
                    result,
                );

                changeField(
                    result,
                    "employeeUuid",
                    "employee-uuid-1",
                );

                changeField(
                    result,
                    "name",
                    "yamada01",
                );

                changeField(
                    result,
                    "password",
                    "password_123",
                );

                await act(async () => {
                    await result.current
                        .openConfirmModal();
                });

                expect(
                    result.current.errors
                        .password,
                ).toBe(
                    "パスワードは半角英数字で入力してください。",
                );

                expect(
                    result.current
                        .isConfirmOpen,
                ).toBe(false);
            },
        );

        it(
            "すべての入力値が有効な場合はアカウント名の空白を除去して確認モーダルを開く",
            async () => {
                const { result } =
                    renderHook(
                        () =>
                            useRegisterEmployeeAccount(),
                    );

                await waitForInitialLoad(
                    result,
                );

                await openConfirmModal(
                    result,
                );

                expect(
                    mockValidateAccountName,
                ).toHaveBeenCalledWith(
                    "yamada01",
                );

                expect(
                    result.current.formData
                        .name,
                ).toBe("yamada01");

                expect(
                    result.current
                        .selectedEmployeeName,
                ).toBe("山田太郎");

                expect(
                    result.current
                        .isConfirmOpen,
                ).toBe(true);

                expect(
                    result.current.errors,
                ).toEqual({});
            },
        );

        it(
            "確認モーダルを閉じることができる",
            async () => {
                const { result } =
                    renderHook(
                        () =>
                            useRegisterEmployeeAccount(),
                    );

                await waitForInitialLoad(
                    result,
                );

                await openConfirmModal(
                    result,
                );

                act(() => {
                    result.current
                        .closeConfirmModal();
                });

                expect(
                    result.current
                        .isConfirmOpen,
                ).toBe(false);
            },
        );

        it(
            "登録中は確認モーダルを閉じない",
            async () => {
                const { result } =
                    renderHook(
                        () =>
                            useRegisterEmployeeAccount(),
                    );

                await waitForInitialLoad(
                    result,
                );

                await openConfirmModal(
                    result,
                );

                let resolveRegister:
                    (
                        value:
                            EmployeeAccount,
                    ) => void = () => { };

                mockRegisterEmployeeAccount
                    .mockImplementation(
                        () =>
                            new Promise<
                                EmployeeAccount
                            >(
                                resolve => {
                                    resolveRegister =
                                        resolve;
                                },
                            ),
                    );

                let registerPromise:
                    Promise<void> =
                    Promise.resolve();

                act(() => {
                    registerPromise =
                        result.current
                            .confirmRegisterEmployeeAccount();
                });

                expect(
                    result.current.isLoading,
                ).toBe(true);

                act(() => {
                    result.current
                        .closeConfirmModal();
                });

                expect(
                    result.current
                        .isConfirmOpen,
                ).toBe(true);

                await act(async () => {
                    resolveRegister({
                        accountUuid:
                            "account-uuid-1",
                        name: "yamada01",
                        password:
                            "password123",
                        employee:
                            employeeAccount1
                                .employee,
                    } as EmployeeAccount);

                    await registerPromise;
                });

                expect(
                    result.current.isLoading,
                ).toBe(false);

                expect(
                    result.current
                        .isConfirmOpen,
                ).toBe(false);
            },
        );

        it(
            "社員情報を取得できない場合は登録せずsubmitエラーを設定する",
            async () => {
                const { result } =
                    renderHook(
                        () =>
                            useRegisterEmployeeAccount(),
                    );

                await waitForInitialLoad(
                    result,
                );

                await act(async () => {
                    await result.current
                        .confirmRegisterEmployeeAccount();
                });

                expect(
                    result.current.errors
                        .submit,
                ).toBe(
                    "選択された社員情報を取得できません。",
                );

                expect(
                    mockRegisterEmployeeAccount,
                ).not.toHaveBeenCalled();

                expect(
                    result.current.isLoading,
                ).toBe(false);
            },
        );

        it(
            "担当者アカウント登録に成功すると選択した社員を一覧から削除してフォームを初期化する",
            async () => {
                const { result } =
                    renderHook(
                        () =>
                            useRegisterEmployeeAccount(),
                    );

                await waitForInitialLoad(
                    result,
                );

                mockRegisterEmployeeAccount
                    .mockResolvedValue({
                        accountUuid:
                            "account-uuid-1",
                        name: "yamada01",
                        password:
                            "password123",
                        employee:
                            employeeAccount1
                                .employee,
                    } as EmployeeAccount);

                await openConfirmModal(
                    result,
                );

                await act(async () => {
                    await result.current
                        .confirmRegisterEmployeeAccount();
                });

                expect(
                    mockRegisterEmployeeAccount,
                ).toHaveBeenCalledTimes(1);

                expect(
                    mockRegisterEmployeeAccount,
                ).toHaveBeenCalledWith({
                    accountUuid: "",
                    name: "yamada01",
                    password:
                        "password123",
                    employee:
                        employeeAccount1
                            .employee,
                });

                expect(
                    result.current
                        .employeeAccounts,
                ).toEqual([
                    employeeAccount2,
                ]);

                expect(
                    result.current.formData,
                ).toEqual({
                    employeeUuid: "",
                    name: "",
                    password: "",
                });

                expect(
                    result.current.errors,
                ).toEqual({});

                expect(
                    result.current.isLoading,
                ).toBe(false);

                expect(
                    result.current
                        .isConfirmOpen,
                ).toBe(false);

                expect(
                    result.current
                        .isToastVisible,
                ).toBe(true);
            },
        );

        it(
            "登録結果が取得できない場合はフォームを初期化しない",
            async () => {
                const { result } =
                    renderHook(
                        () =>
                            useRegisterEmployeeAccount(),
                    );

                await waitForInitialLoad(
                    result,
                );

                mockRegisterEmployeeAccount
                    .mockResolvedValue(
                        null as unknown as
                        EmployeeAccount,
                    );

                await openConfirmModal(
                    result,
                );

                await act(async () => {
                    await result.current
                        .confirmRegisterEmployeeAccount();
                });

                expect(
                    result.current.formData,
                ).toEqual({
                    employeeUuid:
                        "employee-uuid-1",
                    name: "yamada01",
                    password:
                        "password123",
                });

                expect(
                    result.current
                        .employeeAccounts,
                ).toEqual([
                    employeeAccount1,
                    employeeAccount2,
                ]);

                expect(
                    result.current
                        .isConfirmOpen,
                ).toBe(true);

                expect(
                    result.current
                        .isToastVisible,
                ).toBe(false);

                expect(
                    result.current.isLoading,
                ).toBe(false);
            },
        );

        it(
            "通常の登録エラーが発生した場合はsubmitエラーを設定する",
            async () => {
                const { result } =
                    renderHook(
                        () =>
                            useRegisterEmployeeAccount(),
                    );

                await waitForInitialLoad(
                    result,
                );

                mockRegisterEmployeeAccount
                    .mockRejectedValue(
                        new Error(
                            "担当者アカウント登録に失敗しました。",
                        ),
                    );

                await openConfirmModal(
                    result,
                );

                await act(async () => {
                    await result.current
                        .confirmRegisterEmployeeAccount();
                });

                expect(
                    result.current.errors
                        .submit,
                ).toBe(
                    "担当者アカウント登録に失敗しました。",
                );

                expect(
                    result.current
                        .hasValidationErrors,
                ).toBe(false);

                expect(
                    result.current.isLoading,
                ).toBe(false);

                expect(
                    result.current
                        .isConfirmOpen,
                ).toBe(true);

                expect(
                    result.current
                        .isToastVisible,
                ).toBe(false);
            },
        );

        it(
            "JSON形式のバリデーションエラーをフォームエラーへ変換する",
            async () => {
                const { result } =
                    renderHook(
                        () =>
                            useRegisterEmployeeAccount(),
                    );

                await waitForInitialLoad(
                    result,
                );

                const errorMessage =
                    JSON.stringify({
                        type: "validation",
                        errors: {
                            employeeUuid:
                                "社員を選択してください。",
                            accountName:
                                "アカウント名が不正です。",
                            password:
                                "パスワードが不正です。",
                            unknown:
                                "変換対象外です。",
                        },
                    });

                mockRegisterEmployeeAccount
                    .mockRejectedValue(
                        new Error(
                            errorMessage,
                        ),
                    );

                await openConfirmModal(
                    result,
                );

                await act(async () => {
                    await result.current
                        .confirmRegisterEmployeeAccount();
                });

                expect(
                    result.current.errors,
                ).toEqual({
                    employeeUuid:
                        "社員を選択してください。",
                    name:
                        "アカウント名が不正です。",
                    password:
                        "パスワードが不正です。",
                });

                expect(
                    result.current
                        .hasValidationErrors,
                ).toBe(true);

                expect(
                    result.current.isLoading,
                ).toBe(false);
            },
        );

        it(
            "JSON形式のnameエラーをフォームのnameエラーへ変換する",
            async () => {
                const { result } =
                    renderHook(
                        () =>
                            useRegisterEmployeeAccount(),
                    );

                await waitForInitialLoad(
                    result,
                );

                const errorMessage =
                    JSON.stringify({
                        type: "validation",
                        errors: {
                            name:
                                "アカウント名を確認してください。",
                        },
                    });

                mockRegisterEmployeeAccount
                    .mockRejectedValue(
                        new Error(
                            errorMessage,
                        ),
                    );

                await openConfirmModal(
                    result,
                );

                await act(async () => {
                    await result.current
                        .confirmRegisterEmployeeAccount();
                });

                expect(
                    result.current.errors,
                ).toEqual({
                    name:
                        "アカウント名を確認してください。",
                });
            },
        );

        it(
            "JSON形式でもvalidationエラーでない場合はsubmitエラーを設定する",
            async () => {
                const { result } =
                    renderHook(
                        () =>
                            useRegisterEmployeeAccount(),
                    );

                await waitForInitialLoad(
                    result,
                );

                const errorMessage =
                    JSON.stringify({
                        type: "internal",
                        message:
                            "内部エラーが発生しました。",
                    });

                mockRegisterEmployeeAccount
                    .mockRejectedValue(
                        new Error(
                            errorMessage,
                        ),
                    );

                await openConfirmModal(
                    result,
                );

                await act(async () => {
                    await result.current
                        .confirmRegisterEmployeeAccount();
                });

                expect(
                    result.current.errors
                        .submit,
                ).toBe(errorMessage);

                expect(
                    result.current
                        .hasValidationErrors,
                ).toBe(false);

                expect(
                    result.current.isLoading,
                ).toBe(false);
            },
        );

        it(
            "登録処理でError以外が発生した場合は既定のメッセージを表示する",
            async () => {
                const { result } =
                    renderHook(
                        () =>
                            useRegisterEmployeeAccount(),
                    );

                await waitForInitialLoad(
                    result,
                );

                mockRegisterEmployeeAccount
                    .mockRejectedValue(
                        "unknown error",
                    );

                await openConfirmModal(
                    result,
                );

                await act(async () => {
                    await result.current
                        .confirmRegisterEmployeeAccount();
                });

                expect(
                    result.current.errors
                        .submit,
                ).toBe(
                    "担当者アカウントの登録に失敗しました。",
                );

                expect(
                    result.current.isLoading,
                ).toBe(false);
            },
        );

        it(
            "入力値を変更すると該当項目とsubmitのエラーを削除する",
            async () => {
                const { result } =
                    renderHook(
                        () =>
                            useRegisterEmployeeAccount(),
                    );

                await waitForInitialLoad(
                    result,
                );

                mockRegisterEmployeeAccount
                    .mockRejectedValue(
                        new Error(
                            "登録に失敗しました。",
                        ),
                    );

                await openConfirmModal(
                    result,
                );

                await act(async () => {
                    await result.current
                        .confirmRegisterEmployeeAccount();
                });

                expect(
                    result.current.errors
                        .submit,
                ).toBeDefined();

                changeField(
                    result,
                    "name",
                    "suzuki01",
                );

                expect(
                    result.current.errors
                        .name,
                ).toBeUndefined();

                expect(
                    result.current.errors
                        .submit,
                ).toBeUndefined();
            },
        );

        it(
            "フォームを初期状態へ戻すことができる",
            async () => {
                const { result } =
                    renderHook(
                        () =>
                            useRegisterEmployeeAccount(),
                    );

                await waitForInitialLoad(
                    result,
                );

                await openConfirmModal(
                    result,
                );

                act(() => {
                    result.current.resetForm();
                });

                expect(
                    result.current.formData,
                ).toEqual({
                    employeeUuid: "",
                    name: "",
                    password: "",
                });

                expect(
                    result.current.errors,
                ).toEqual({});

                expect(
                    result.current
                        .isConfirmOpen,
                ).toBe(false);
            },
        );

        it(
            "フォームを初期化してもsystemエラーは保持する",
            async () => {
                mockGetForm
                    .mockRejectedValue(
                        new Error(
                            "社員一覧の取得に失敗しました。",
                        ),
                    );

                const { result } =
                    renderHook(
                        () =>
                            useRegisterEmployeeAccount(),
                    );

                await waitForInitialLoad(
                    result,
                );

                changeField(
                    result,
                    "name",
                    "yamada01",
                );

                act(() => {
                    result.current.resetForm();
                });

                expect(
                    result.current.formData,
                ).toEqual({
                    employeeUuid: "",
                    name: "",
                    password: "",
                });

                expect(
                    result.current.errors,
                ).toEqual({
                    system:
                        "社員一覧の取得に失敗しました。",
                });

                expect(
                    result.current
                        .hasValidationErrors,
                ).toBe(true);
            },
        );

        it(
            "トーストを手動で閉じることができる",
            async () => {
                const { result } =
                    renderHook(
                        () =>
                            useRegisterEmployeeAccount(),
                    );

                await waitForInitialLoad(
                    result,
                );

                mockRegisterEmployeeAccount
                    .mockResolvedValue({
                        accountUuid:
                            "account-uuid-1",
                        name: "yamada01",
                        password:
                            "password123",
                        employee:
                            employeeAccount1
                                .employee,
                    } as EmployeeAccount);

                await openConfirmModal(
                    result,
                );

                await act(async () => {
                    await result.current
                        .confirmRegisterEmployeeAccount();
                });

                expect(
                    result.current
                        .isToastVisible,
                ).toBe(true);

                act(() => {
                    result.current
                        .closeToast();
                });

                expect(
                    result.current
                        .isToastVisible,
                ).toBe(false);
            },
        );

        it(
            "トーストは3秒後に自動で閉じる",
            async () => {
                const { result } =
                    renderHook(
                        () =>
                            useRegisterEmployeeAccount(),
                    );

                await waitForInitialLoad(
                    result,
                );

                /*
                 * トースト用タイマーが
                 * 登録される前に切り替える。
                 */
                vi.useFakeTimers();

                mockRegisterEmployeeAccount
                    .mockResolvedValue({
                        accountUuid:
                            "account-uuid-1",
                        name: "yamada01",
                        password:
                            "password123",
                        employee:
                            employeeAccount1
                                .employee,
                    } as EmployeeAccount);

                await openConfirmModal(
                    result,
                );

                await act(async () => {
                    await result.current
                        .confirmRegisterEmployeeAccount();
                });

                expect(
                    result.current
                        .isToastVisible,
                ).toBe(true);

                act(() => {
                    vi.advanceTimersByTime(
                        2999,
                    );
                });

                expect(
                    result.current
                        .isToastVisible,
                ).toBe(true);

                act(() => {
                    vi.advanceTimersByTime(
                        1,
                    );
                });

                expect(
                    result.current
                        .isToastVisible,
                ).toBe(false);
            },
        );
    },
);