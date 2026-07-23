// @vitest-environment jsdom
import {
    act,
    renderHook,
} from "@testing-library/react";
import {
    afterEach,
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from "vitest";

import { TYPES } from "@/di/types";
import type { IRegisterCategoryService } from
    "@/interfaces/IRegisterCategoryService";
import type { ProductCategory } from
    "@/models/ProductCategory";
import { useRegisterCategory } from "@/components/hooks/useRegisterCategory";

/*
 * vi.mockは巻き上げられるため、
 * vi.hoistedでモック関数を生成する。
 */
const {
    mockContainerGet,
    mockValidateCategoryName,
    mockRegisterCategory,
} = vi.hoisted(() => ({
    mockContainerGet: vi.fn(),
    mockValidateCategoryName: vi.fn(),
    mockRegisterCategory: vi.fn(),
}));

vi.mock("@/di/container", () => ({
    container: {
        get: mockContainerGet,
    },
}));

type RegisterCategoryHook =
    ReturnType<typeof useRegisterCategory>;

type HookResult = {
    current: RegisterCategoryHook;
};

/**
 * カテゴリー名を入力する
 */
const changeCategoryName = (
    result: HookResult,
    value: string,
): void => {
    act(() => {
        result.current.handleChange({
            target: {
                name: "name",
                value,
            },
        } as React.ChangeEvent<HTMLInputElement>);
    });
};

/**
 * 確認モーダルを開く
 */
const openConfirmModal = async (
    result: HookResult,
    name = "文房具",
): Promise<void> => {
    changeCategoryName(
        result,
        name,
    );

    await act(async () => {
        await result.current
            .openConfirmModal();
    });
};

describe("useRegisterCategory", () => {
    beforeEach(() => {
        mockContainerGet.mockReset();
        mockValidateCategoryName.mockReset();
        mockRegisterCategory.mockReset();

        const mockService = {
            validateCategoryName:
                mockValidateCategoryName,
            registerCategory:
                mockRegisterCategory,
        } as IRegisterCategoryService;

        mockContainerGet.mockReturnValue(
            mockService,
        );

        mockValidateCategoryName
            .mockResolvedValue(undefined);
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it(
        "初期状態が正しく設定される",
        () => {
            const { result } = renderHook(
                () => useRegisterCategory(),
            );

            expect(
                mockContainerGet,
            ).toHaveBeenCalledWith(
                TYPES.IRegisterCategoryService,
            );

            expect(
                result.current.formData,
            ).toEqual({
                categoryUuid: "",
                name: "",
            });

            expect(
                result.current.errors,
            ).toEqual({});

            expect(
                result.current.isLoading,
            ).toBe(false);

            expect(
                result.current.isConfirmOpen,
            ).toBe(false);

            expect(
                result.current.isToastVisible,
            ).toBe(false);

            expect(
                result.current
                    .hasValidationErrors,
            ).toBe(false);
        },
    );

    it(
        "カテゴリー名を変更するとフォームデータが更新される",
        () => {
            const { result } = renderHook(
                () => useRegisterCategory(),
            );

            changeCategoryName(
                result,
                "文房具",
            );

            expect(
                result.current.formData.name,
            ).toBe("文房具");
        },
    );

    it(
        "カテゴリー名が未入力の場合は必須エラーになる",
        async () => {
            const { result } = renderHook(
                () => useRegisterCategory(),
            );

            changeCategoryName(
                result,
                "   ",
            );

            await act(async () => {
                await result.current
                    .handleNameBlur();
            });

            expect(
                result.current.errors.name,
            ).toBe(
                "カテゴリー名を入力してください。",
            );

            expect(
                result.current
                    .hasValidationErrors,
            ).toBe(true);

            expect(
                mockValidateCategoryName,
            ).not.toHaveBeenCalled();
        },
    );

    it(
        "カテゴリー名が30文字を超える場合は文字数エラーになる",
        async () => {
            const { result } = renderHook(
                () => useRegisterCategory(),
            );

            const categoryName =
                "あ".repeat(31);

            changeCategoryName(
                result,
                categoryName,
            );

            await act(async () => {
                await result.current
                    .handleNameBlur();
            });

            expect(
                result.current.errors.name,
            ).toBe(
                "カテゴリー名は30文字以内で入力してください。",
            );

            expect(
                mockValidateCategoryName,
            ).not.toHaveBeenCalled();
        },
    );

    it(
        "カテゴリー名に使用できない文字が含まれる場合は形式エラーになる",
        async () => {
            const { result } = renderHook(
                () => useRegisterCategory(),
            );

            changeCategoryName(
                result,
                "文房具@",
            );

            await act(async () => {
                await result.current
                    .handleNameBlur();
            });

            expect(
                result.current.errors.name,
            ).toBe(
                "カテゴリー名は日本語または全角・半角英数字で入力してください。",
            );

            expect(
                mockValidateCategoryName,
            ).not.toHaveBeenCalled();
        },
    );

    it(
        "有効なカテゴリー名の場合は重複確認が実行される",
        async () => {
            const { result } = renderHook(
                () => useRegisterCategory(),
            );

            changeCategoryName(
                result,
                "  文房具  ",
            );

            await act(async () => {
                await result.current
                    .handleNameBlur();
            });

            expect(
                mockValidateCategoryName,
            ).toHaveBeenCalledTimes(1);

            expect(
                mockValidateCategoryName,
            ).toHaveBeenCalledWith(
                "文房具",
            );

            expect(
                result.current.errors.name,
            ).toBeUndefined();
        },
    );

    it(
        "全角英数字を含むカテゴリー名を検証できる",
        async () => {
            const { result } = renderHook(
                () => useRegisterCategory(),
            );

            changeCategoryName(
                result,
                "文具ＡＢＣ１２３",
            );

            await act(async () => {
                await result.current
                    .handleNameBlur();
            });

            expect(
                mockValidateCategoryName,
            ).toHaveBeenCalledWith(
                "文具ＡＢＣ１２３",
            );

            expect(
                result.current.errors.name,
            ).toBeUndefined();
        },
    );

    it(
        "重複確認でErrorが発生した場合はメッセージを表示する",
        async () => {
            const { result } = renderHook(
                () => useRegisterCategory(),
            );

            mockValidateCategoryName
                .mockRejectedValue(
                    new Error(
                        "同じカテゴリー名が存在します。",
                    ),
                );

            changeCategoryName(
                result,
                "文房具",
            );

            await act(async () => {
                await result.current
                    .handleNameBlur();
            });

            expect(
                result.current.errors.name,
            ).toBe(
                "同じカテゴリー名が存在します。",
            );
        },
    );

    it(
        "重複確認でError以外が発生した場合は既定のメッセージを表示する",
        async () => {
            const { result } = renderHook(
                () => useRegisterCategory(),
            );

            mockValidateCategoryName
                .mockRejectedValue(
                    "unknown error",
                );

            changeCategoryName(
                result,
                "文房具",
            );

            await act(async () => {
                await result.current
                    .handleNameBlur();
            });

            expect(
                result.current.errors.name,
            ).toBe(
                "カテゴリー名の重複確認に失敗しました。",
            );
        },
    );

    it(
        "入力値が無効な場合は確認モーダルを開かない",
        async () => {
            const { result } = renderHook(
                () => useRegisterCategory(),
            );

            await act(async () => {
                await result.current
                    .openConfirmModal();
            });

            expect(
                result.current.isConfirmOpen,
            ).toBe(false);

            expect(
                result.current.errors.name,
            ).toBe(
                "カテゴリー名を入力してください。",
            );
        },
    );

    it(
        "入力値が有効な場合は前後の空白を除去して確認モーダルを開く",
        async () => {
            const { result } = renderHook(
                () => useRegisterCategory(),
            );

            await openConfirmModal(
                result,
                "  文房具  ",
            );

            expect(
                mockValidateCategoryName,
            ).toHaveBeenCalledWith(
                "文房具",
            );

            expect(
                result.current.formData.name,
            ).toBe("文房具");

            expect(
                result.current.isConfirmOpen,
            ).toBe(true);
        },
    );

    it(
        "確認モーダルを閉じることができる",
        async () => {
            const { result } = renderHook(
                () => useRegisterCategory(),
            );

            await openConfirmModal(result);

            act(() => {
                result.current
                    .closeConfirmModal();
            });

            expect(
                result.current.isConfirmOpen,
            ).toBe(false);
        },
    );

    it(
        "登録中は確認モーダルを閉じない",
        async () => {
            const { result } = renderHook(
                () => useRegisterCategory(),
            );

            await openConfirmModal(result);

            const registeredCategory:
                ProductCategory = {
                categoryUuid:
                    "category-uuid",
                name: "文房具",
            };

            let resolveRegister:
                (
                    value: ProductCategory,
                ) => void = () => { };

            mockRegisterCategory
                .mockImplementation(
                    () =>
                        new Promise<ProductCategory>(
                            (resolve) => {
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
                        .confirmRegisterCategory();
            });

            expect(
                result.current.isLoading,
            ).toBe(true);

            act(() => {
                result.current
                    .closeConfirmModal();
            });

            expect(
                result.current.isConfirmOpen,
            ).toBe(true);

            await act(async () => {
                resolveRegister(
                    registeredCategory,
                );

                await registerPromise;
            });

            expect(
                result.current.isLoading,
            ).toBe(false);

            expect(
                result.current.isConfirmOpen,
            ).toBe(false);
        },
    );

    it(
        "カテゴリー登録に成功するとフォームを初期化してトーストを表示する",
        async () => {
            const { result } = renderHook(
                () => useRegisterCategory(),
            );

            const registeredCategory:
                ProductCategory = {
                categoryUuid:
                    "category-uuid",
                name: "文房具",
            };

            mockRegisterCategory
                .mockResolvedValue(
                    registeredCategory,
                );

            await openConfirmModal(
                result,
                "  文房具  ",
            );

            await act(async () => {
                await result.current
                    .confirmRegisterCategory();
            });

            expect(
                mockRegisterCategory,
            ).toHaveBeenCalledTimes(1);

            expect(
                mockRegisterCategory,
            ).toHaveBeenCalledWith({
                categoryUuid: "",
                name: "文房具",
            });

            expect(
                result.current.isLoading,
            ).toBe(false);

            expect(
                result.current.isConfirmOpen,
            ).toBe(false);

            expect(
                result.current.isToastVisible,
            ).toBe(true);

            expect(
                result.current.formData,
            ).toEqual({
                categoryUuid: "",
                name: "",
            });

            expect(
                result.current.errors,
            ).toEqual({});
        },
    );

    it(
        "通常の登録エラーが発生した場合はsubmitエラーを設定する",
        async () => {
            const { result } = renderHook(
                () => useRegisterCategory(),
            );

            mockRegisterCategory
                .mockRejectedValue(
                    new Error(
                        "カテゴリー登録に失敗しました。",
                    ),
                );

            await openConfirmModal(result);

            await act(async () => {
                await result.current
                    .confirmRegisterCategory();
            });

            expect(
                result.current.errors.submit,
            ).toBe(
                "カテゴリー登録に失敗しました。",
            );

            expect(
                result.current
                    .hasValidationErrors,
            ).toBe(false);

            expect(
                result.current.isLoading,
            ).toBe(false);

            expect(
                result.current.isConfirmOpen,
            ).toBe(true);

            expect(
                result.current.isToastVisible,
            ).toBe(false);
        },
    );

    it(
        "JSON形式のバリデーションエラーをフォームエラーへ変換する",
        async () => {
            const { result } = renderHook(
                () => useRegisterCategory(),
            );

            const errorMessage =
                JSON.stringify({
                    type: "validation",
                    errors: {
                        Name:
                            "同じカテゴリー名が存在します。",
                        System:
                            "システムエラーが発生しました。",
                    },
                });

            mockRegisterCategory
                .mockRejectedValue(
                    new Error(errorMessage),
                );

            await openConfirmModal(result);

            await act(async () => {
                await result.current
                    .confirmRegisterCategory();
            });

            expect(
                result.current.errors,
            ).toEqual({
                name:
                    "同じカテゴリー名が存在します。",
                system:
                    "システムエラーが発生しました。",
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
        "JSON形式でもvalidationエラーでない場合はsubmitエラーに設定する",
        async () => {
            const { result } = renderHook(
                () => useRegisterCategory(),
            );

            const errorMessage =
                JSON.stringify({
                    type: "internal",
                    message:
                        "内部エラーが発生しました。",
                });

            mockRegisterCategory
                .mockRejectedValue(
                    new Error(errorMessage),
                );

            await openConfirmModal(result);

            await act(async () => {
                await result.current
                    .confirmRegisterCategory();
            });

            expect(
                result.current.errors.submit,
            ).toBe(errorMessage);

            expect(
                result.current
                    .hasValidationErrors,
            ).toBe(false);
        },
    );

    it(
        "登録処理でError以外が発生した場合は既定のメッセージを表示する",
        async () => {
            const { result } = renderHook(
                () => useRegisterCategory(),
            );

            mockRegisterCategory
                .mockRejectedValue(
                    "unknown error",
                );

            await openConfirmModal(result);

            await act(async () => {
                await result.current
                    .confirmRegisterCategory();
            });

            expect(
                result.current.errors.submit,
            ).toBe(
                "カテゴリーの登録に失敗しました。",
            );

            expect(
                result.current.isLoading,
            ).toBe(false);
        },
    );

    it(
        "入力内容を変更すると該当項目とsubmitのエラーを削除する",
        async () => {
            const { result } = renderHook(
                () => useRegisterCategory(),
            );

            mockRegisterCategory
                .mockRejectedValue(
                    new Error(
                        "カテゴリー登録に失敗しました。",
                    ),
                );

            await openConfirmModal(result);

            await act(async () => {
                await result.current
                    .confirmRegisterCategory();
            });

            expect(
                result.current.errors.submit,
            ).toBeDefined();

            changeCategoryName(
                result,
                "新しいカテゴリー",
            );

            expect(
                result.current.errors.name,
            ).toBeUndefined();

            expect(
                result.current.errors.submit,
            ).toBeUndefined();
        },
    );

    it(
        "フォームを初期状態へ戻すことができる",
        async () => {
            const { result } = renderHook(
                () => useRegisterCategory(),
            );

            await openConfirmModal(result);

            expect(
                result.current.isConfirmOpen,
            ).toBe(true);

            act(() => {
                result.current.resetForm();
            });

            expect(
                result.current.formData,
            ).toEqual({
                categoryUuid: "",
                name: "",
            });

            expect(
                result.current.errors,
            ).toEqual({});

            expect(
                result.current.isConfirmOpen,
            ).toBe(false);
        },
    );

    it(
        "トーストを手動で閉じることができる",
        async () => {
            const { result } = renderHook(
                () => useRegisterCategory(),
            );

            mockRegisterCategory
                .mockResolvedValue({
                    categoryUuid:
                        "category-uuid",
                    name: "文房具",
                });

            await openConfirmModal(result);

            await act(async () => {
                await result.current
                    .confirmRegisterCategory();
            });

            expect(
                result.current.isToastVisible,
            ).toBe(true);

            act(() => {
                result.current.closeToast();
            });

            expect(
                result.current.isToastVisible,
            ).toBe(false);
        },
    );

    it(
        "トーストは10秒後に自動で閉じる",
        async () => {
            vi.useFakeTimers();

            const { result } = renderHook(
                () => useRegisterCategory(),
            );

            mockRegisterCategory
                .mockResolvedValue({
                    categoryUuid:
                        "category-uuid",
                    name: "文房具",
                });

            await openConfirmModal(result);

            await act(async () => {
                await result.current
                    .confirmRegisterCategory();
            });

            expect(
                result.current.isToastVisible,
            ).toBe(true);

            act(() => {
                vi.advanceTimersByTime(
                    9999,
                );
            });

            expect(
                result.current.isToastVisible,
            ).toBe(true);

            act(() => {
                vi.advanceTimersByTime(1);
            });

            expect(
                result.current.isToastVisible,
            ).toBe(false);
        },
    );
});