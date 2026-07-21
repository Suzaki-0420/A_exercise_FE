"use client";

import { container } from "@/di/container";
import { TYPES } from "@/di/types";
import type { IRegisterEmployeeAccountService } from
    "@/interfaces/IRegisterEmployeeAccountService";
import type { EmployeeAccount } from
    "@/models/EmployeeAccount";
import {
    type ChangeEvent,
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";

/**
 * 担当者アカウント登録フォーム
 */
type EmployeeAccountFormData = {
    employeeUuid: string;
    name: string;
    password: string;
};

/**
 * 担当者アカウント登録フォームのエラー
 */
type EmployeeAccountFormErrors = {
    employeeUuid?: string;
    name?: string;
    password?: string;
    submit?: string;
    system?: string;
};

/**
 * フォームの初期値を生成する
 */
const createInitialFormData =
    (): EmployeeAccountFormData => ({
        employeeUuid: "",
        name: "",
        password: "",
    });

/**
* すべて同じ文字で構成されているか判定する
*/
const isSingleCharacterOnly =
    (value: string): boolean => {

        if (value.length <= 1) {
            return false;
        }

        return new Set(value).size === 1;
    };

/**
 * 担当者アカウント登録画面用カスタムフック
 */
export const useRegisterEmployeeAccount =
    () => {

        const service = useMemo(
            () =>
                container.get<
                    IRegisterEmployeeAccountService
                >(
                    TYPES
                        .IRegisterEmployeeAccountService
                ),
            []
        );

        /**
         * アカウント未登録社員一覧
         */
        const [
            employeeAccounts,
            setEmployeeAccounts,
        ] = useState<EmployeeAccount[]>([]);

        const [formData, setFormData] =
            useState<EmployeeAccountFormData>(
                createInitialFormData
            );

        const [errors, setErrors] =
            useState<EmployeeAccountFormErrors>(
                {}
            );

        const [isInitialLoading, setIsInitialLoading] =
            useState(true);

        const [isLoading, setIsLoading] =
            useState(false);

        const [isConfirmOpen, setIsConfirmOpen] =
            useState(false);

        const [isToastVisible, setIsToastVisible] =
            useState(false);

        /**
         * 選択中の社員アカウント情報
         */
        const selectedEmployeeAccount =
            useMemo(
                () =>
                    employeeAccounts.find(
                        account =>
                            account.employee
                                ?.employeeUuid ===
                            formData.employeeUuid
                    ),
                [
                    employeeAccounts,
                    formData.employeeUuid,
                ]
            );

        /**
         * 選択中の社員名
         */
        const selectedEmployeeName =
            selectedEmployeeAccount
                ?.employee
                ?.name ?? "";

        /**
 * 初期表示時に未登録社員一覧を取得する
 */
        useEffect(() => {
            let isActive = true;

            const loadForm =
                async (): Promise<void> => {
                    try {
                        const accounts =
                            await service.getForm();

                        if (!isActive) {
                            return;
                        }

                        setEmployeeAccounts(
                            accounts
                        );

                        setErrors(prev => {
                            const newErrors = {
                                ...prev,
                            };

                            delete newErrors.system;

                            return newErrors;
                        });
                    } catch (error: unknown) {
                        if (!isActive) {
                            return;
                        }

                        const message =
                            error instanceof Error
                                ? error.message
                                : "社員情報の取得に失敗しました。";

                        setErrors(prev => ({
                            ...prev,
                            system: message,
                        }));
                    } finally {
                        if (isActive) {
                            setIsInitialLoading(
                                false
                            );
                        }
                    }
                };

            void loadForm();

            return () => {
                isActive = false;
            };
        }, [service]);


        /**
         * トーストを3秒後に閉じる
         */
        useEffect(() => {
            if (!isToastVisible) {
                return;
            }

            const timerId =
                window.setTimeout(() => {
                    setIsToastVisible(false);
                }, 3000);

            return () => {
                window.clearTimeout(timerId);
            };
        }, [isToastVisible]);

        /**
         * 指定された項目のエラーを設定する
         */
        const setFieldError = useCallback(
            (
                field:
                    keyof EmployeeAccountFormErrors,
                message?: string
            ) => {
                setErrors(prev => {
                    const newErrors = {
                        ...prev,
                    };

                    if (message) {
                        newErrors[field] =
                            message;
                    } else {
                        delete newErrors[field];
                    }

                    return newErrors;
                });
            },
            []
        );

        /**
         * 社員選択を検証する
         */
        const validateEmployee =
            useCallback((): boolean => {
                if (!formData.employeeUuid) {
                    setFieldError(
                        "employeeUuid",
                        "社員名を選択してください。"
                    );

                    return false;
                }

                if (!selectedEmployeeAccount) {
                    setFieldError(
                        "employeeUuid",
                        "選択された社員が存在しません。"
                    );

                    return false;
                }

                setFieldError(
                    "employeeUuid"
                );

                return true;
            }, [
                formData.employeeUuid,
                selectedEmployeeAccount,
                setFieldError,
            ]);

        /**
         * アカウント名を検証する
         */
        const validateAccountName =
            useCallback(
                async (): Promise<boolean> => {
                    const accountName =
                        formData.name.trim();

                    if (!accountName) {
                        setFieldError(
                            "name",
                            "アカウント名を入力してください。"
                        );

                        return false;
                    }

                    if (
                        accountName.length < 5 ||
                        accountName.length > 20
                    ) {
                        setFieldError(
                            "name",
                            "アカウント名は5文字以上20文字以内で入力してください。"
                        );

                        return false;
                    }

                    const accountNamePattern =
                        /^[A-Za-z0-9]+$/;

                    if (
                        !accountNamePattern.test(
                            accountName
                        )
                    ) {
                        setFieldError(
                            "name",
                            "アカウント名は半角英数字で入力してください。"
                        );

                        return false;
                    }

                    if (
                        isSingleCharacterOnly(
                            accountName
                        )
                    ) {
                        setFieldError(
                            "name",
                            "アカウント名に同じ文字のみを使用することはできません。"
                        );

                        return false;
                    }

                    try {
                        await service
                            .validateAccountName(
                                accountName
                            );

                        setFieldError("name");

                        return true;
                    } catch (error: unknown) {
                        const message =
                            error instanceof Error
                                ? error.message
                                : "アカウント名の確認に失敗しました。";

                        setFieldError(
                            "name",
                            message
                        );

                        return false;
                    }
                },
                [
                    formData.name,
                    service,
                    setFieldError,
                ]
            );

        /**
         * パスワードを検証する
         */
        const validatePassword =
            useCallback((): boolean => {
                const password =
                    formData.password;

                if (!password) {
                    setFieldError(
                        "password",
                        "パスワードを入力してください。"
                    );

                    return false;
                }

                if (
                    password.length < 8 ||
                    password.length > 64
                ) {
                    setFieldError(
                        "password",
                        "パスワードは5文字以上20文字以内で入力してください。"
                    );

                    return false;
                }

                const passwordPattern =
                    /^[A-Za-z0-9]+$/;

                if (
                    !passwordPattern.test(
                        password
                    )
                ) {
                    setFieldError(
                        "password",
                        "パスワードは半角英数字で入力してください。"
                    );

                    return false;
                }

                if (
                    isSingleCharacterOnly(
                        password
                    )
                ) {
                    setFieldError(
                        "password",
                        "パスワードに同じ文字のみを使用することはできません。"
                    );

                    return false;
                }

                setFieldError("password");

                return true;
            }, [
                formData.password,
                setFieldError,
            ]);

        /**
         * 入力値変更処理
         */
        const handleChange = useCallback(
            (
                event: ChangeEvent<
                    HTMLInputElement |
                    HTMLSelectElement
                >
            ) => {
                const {
                    name,
                    value,
                } = event.target;

                setFormData(prev => ({
                    ...prev,
                    [name]: value,
                }));

                setErrors(prev => {
                    const newErrors = {
                        ...prev,
                    };

                    delete newErrors[
                        name as keyof
                        EmployeeAccountFormErrors
                    ];

                    delete newErrors.submit;

                    return newErrors;
                });
            },
            []
        );

        /**
         * アカウント名から
         * フォーカスが外れた場合
         */
        const handleAccountNameBlur =
            useCallback(async () => {
                await validateAccountName();
            }, [validateAccountName]);

        /**
        * パスワードから
        * フォーカスが外れた場合
        */
        const handlePasswordBlur =
            useCallback(() => {
                validatePassword();
            }, [validatePassword]);

        /**
         * 入力内容を検証して
         * 確認モーダルを開く
         */
        const openConfirmModal =
            useCallback(async () => {
                const isEmployeeValid =
                    validateEmployee();

                const isPasswordValid =
                    validatePassword();

                const isAccountNameValid =
                    await validateAccountName();

                if (
                    !isEmployeeValid ||
                    !isAccountNameValid ||
                    !isPasswordValid
                ) {
                    return;
                }

                setFormData(prev => ({
                    ...prev,
                    name: prev.name.trim(),
                }));

                setFieldError("submit");

                setIsConfirmOpen(true);
            }, [
                validateEmployee,
                validateAccountName,
                validatePassword,
                setFieldError,
            ]);

        /**
         * 確認モーダルを閉じる
         */
        const closeConfirmModal =
            useCallback(() => {
                if (isLoading) {
                    return;
                }

                setIsConfirmOpen(false);
            }, [isLoading]);

        /**
         * 担当者アカウントを登録する
         */
        const confirmRegisterEmployeeAccount =
            useCallback(async () => {
                if (
                    !selectedEmployeeAccount
                        ?.employee
                ) {
                    setFieldError(
                        "submit",
                        "選択された社員情報を取得できません。"
                    );

                    return;
                }

                setIsLoading(true);

                try {
                    const employeeAccount:
                        EmployeeAccount = {
                        accountUuid: "",
                        name:
                            formData.name.trim(),
                        password:
                            formData.password,
                        employee:
                            selectedEmployeeAccount
                                .employee,
                    };

                    const result =
                        await service
                            .registerEmployeeAccount(
                                employeeAccount
                            );

                    if (!result) {
                        return;
                    }

                    setEmployeeAccounts(
                        prev =>
                            prev.filter(
                                account =>
                                    account.employee
                                        ?.employeeUuid !==
                                    formData
                                        .employeeUuid
                            )
                    );

                    setFormData(
                        createInitialFormData()
                    );

                    setErrors({});

                    setIsConfirmOpen(false);

                    setIsToastVisible(true);
                } catch (error: unknown) {
                    const message =
                        error instanceof Error
                            ? error.message
                            : "担当者アカウントの登録に失敗しました。";

                    try {
                        const parsed =
                            JSON.parse(message) as {
                                type?: string;
                                errors?: Record<
                                    string,
                                    unknown
                                >;
                            };

                        if (
                            parsed.type ===
                            "validation" &&
                            parsed.errors
                        ) {
                            const convertedErrors:
                                EmployeeAccountFormErrors =
                                {};

                            Object.entries(
                                parsed.errors
                            ).forEach(
                                ([key, value]) => {
                                    const fieldMap:
                                        Record<
                                            string,
                                            keyof EmployeeAccountFormErrors
                                        > = {
                                        employeeUuid:
                                            "employeeUuid",
                                        accountName:
                                            "name",
                                        name:
                                            "name",
                                        password:
                                            "password",
                                    };

                                    const field =
                                        fieldMap[key];

                                    if (field) {
                                        convertedErrors[
                                            field
                                        ] =
                                            String(
                                                value
                                            );
                                    }
                                }
                            );

                            setErrors(
                                convertedErrors
                            );
                        } else {
                            setFieldError(
                                "submit",
                                message
                            );
                        }
                    } catch {
                        setFieldError(
                            "submit",
                            message
                        );
                    }
                } finally {
                    setIsLoading(false);
                }
            }, [
                selectedEmployeeAccount,
                formData,
                service,
                setFieldError,
            ]);

        /**
         * フォームを初期状態へ戻す
         */
        const resetForm = useCallback(() => {
            setFormData(
                createInitialFormData()
            );

            setErrors(prev => {
                const systemError =
                    prev.system;

                return systemError
                    ? {
                        system:
                            systemError,
                    }
                    : {};
            });

            setIsConfirmOpen(false);
        }, []);

        /**
         * トーストを閉じる
         */
        const closeToast = useCallback(() => {
            setIsToastVisible(false);
        }, []);

        return {
            employeeAccounts,
            formData,
            errors,

            selectedEmployeeName,

            isInitialLoading,
            isLoading,
            isConfirmOpen,
            isToastVisible,

            handleChange,
            handleAccountNameBlur,
            handlePasswordBlur,

            openConfirmModal,
            closeConfirmModal,
            confirmRegisterEmployeeAccount,

            resetForm,
            closeToast,
        };
    };