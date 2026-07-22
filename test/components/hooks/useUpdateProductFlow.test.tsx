// @vitest-environment jsdom

import { useUpdateProduct } from "@/components/hooks/useUpdateProduct";
import {
    clearProductForUpdate,
    loadProductForUpdate,
    saveProductForUpdate,
} from "@/components/product/edit/productUpdateStorage";
import type { Product } from "@/models/Product";
import type { ProductCategory } from "@/models/ProductCategory";
import {
    ProductUpdateError,
    type ProductUpdateResult,
} from "@/models/ProductUpdate";
import {
    act,
    cleanup,
    renderHook,
    waitFor,
} from "@testing-library/react";
import type {
    ChangeEvent,
    FormEvent,
} from "react";
import {
    afterEach,
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from "vitest";

const {
    contextState,
    mockContainerGet,
    mockGetCategories,
    mockValidateProductName,
    mockUpdateProduct,
    mockRouter,
} = vi.hoisted(() => ({
    contextState: {
        draft: null as Product | null,
        imageFile: null as File | null,
        completedResult: null as ProductUpdateResult | null,
        saveDraft: vi.fn(),
        setCompletedResult: vi.fn(),
        clearFlow: vi.fn(),
    },
    mockContainerGet: vi.fn(),
    mockGetCategories: vi.fn(),
    mockValidateProductName: vi.fn(),
    mockUpdateProduct: vi.fn(),
    mockRouter: {
        push: vi.fn(),
        replace: vi.fn(),
        refresh: vi.fn(),
    },
}));

vi.mock("@/di/container", () => ({
    container: {
        get: mockContainerGet,
    },
}));

vi.mock(
    "@/components/product/edit/UpdateProductContext",
    () => ({
        useUpdateProductContext: () => contextState,
    })
);

vi.mock("next/navigation", () => ({
    useRouter: () => mockRouter,
}));

const category: ProductCategory = {
    categoryUuid:
        "e50d978b-b73d-4afb-8e85-ace9cf1e12a7",
    name: "文房具",
};

const otherCategory: ProductCategory = {
    categoryUuid:
        "e50d978b-b73d-4afb-8e85-ace9cf1e12a8",
    name: "雑貨",
};

const product: Product = {
    productUuid:
        "10000000-0000-0000-0000-000000000001",
    name: "水性ボールペン黒",
    price: 120,
    imageUrl: null,
    productCategory: category,
    productStock: {
        stockUuid:
            "20000000-0000-0000-0000-000000000001",
        quantity: 80,
    },
    deleteFlg: 0,
};

const updateResult: ProductUpdateResult = {
    productUuid: product.productUuid,
    name: product.name,
    price: product.price,
    stockQuantity: product.productStock!.quantity,
    categoryUuid: category.categoryUuid,
    imageUrl: null,
    updated: true,
};

type HookResult = {
    current: ReturnType<typeof useUpdateProduct>;
};

const changeField = (
    result: HookResult,
    name: string,
    value: string
) => {
    act(() => {
        result.current.handleChange({
            target: { name, value },
        } as ChangeEvent<HTMLInputElement>);
    });
};

const submitForConfirmation = async (
    result: HookResult
) => {
    await act(async () => {
        await result.current.handleProceedToConfirm({
            preventDefault: vi.fn(),
        } as unknown as FormEvent<HTMLFormElement>);
    });
};

const renderInitializedHook = async (
    selectedProduct: Product = product
) => {
    saveProductForUpdate(selectedProduct);
    const hook = renderHook(() =>
        useUpdateProduct(selectedProduct.productUuid)
    );

    await waitFor(() => {
        expect(hook.result.current.isLoading).toBe(false);
        expect(hook.result.current.formData).toEqual(
            selectedProduct
        );
    });

    return hook;
};

describe("useUpdateProductの商品修正フロー", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.useRealTimers();
        sessionStorage.clear();
        Object.assign(contextState, {
            draft: null,
            imageFile: null,
            completedResult: null,
        });
        mockContainerGet.mockReturnValue({
            getCategories: mockGetCategories,
            validateProductName:
                mockValidateProductName,
            updateProduct: mockUpdateProduct,
        });
        mockGetCategories.mockResolvedValue([
            category,
            otherCategory,
        ]);
        mockValidateProductName.mockResolvedValue(undefined);
        mockUpdateProduct.mockResolvedValue(updateResult);
    });

    afterEach(() => {
        cleanup();
        clearProductForUpdate();
        vi.useRealTimers();
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
    });

    it("商品未選択の各操作は安全に終了し、指定された遷移だけを行う", async () => {
        const { result } = renderHook(() =>
            useUpdateProduct()
        );

        changeField(result, "name", "変更名");
        act(() => {
            result.current.handlePriceBlur();
            result.current.handleStockBlur();
            result.current.handleCategoryBlur();
            result.current.handleImageBlur();
        });
        await act(async () => {
            await result.current.handleNameBlur();
        });
        await submitForConfirmation(result);
        await act(async () => {
            await result.current.handleUpdate();
        });
        act(() => {
            result.current.handleBackToInput();
            result.current.handleCancel();
            result.current.handleInvalidFlow("/admin");
            result.current.handleLeaveComplete(
                "/admin/product"
            );
        });

        expect(result.current.formData).toBeNull();
        expect(mockRouter.replace).toHaveBeenCalledWith(
            "/admin/product"
        );
        expect(contextState.clearFlow).toHaveBeenCalledTimes(
            2
        );
        expect(mockRouter.push).toHaveBeenCalledWith(
            "/admin/product"
        );
    });

    it("不正な商品UUIDではメッセージ表示後に商品検索へ戻る", async () => {
        vi.useFakeTimers();
        const { result, unmount } = renderHook(() =>
            useUpdateProduct("invalid-product-id")
        );

        await act(async () => {
            await Promise.resolve();
        });

        expect(result.current.submitError).toContain(
            "指定された商品は存在しません。"
        );
        act(() => {
            vi.advanceTimersByTime(1500);
        });
        expect(mockRouter.replace).toHaveBeenCalledWith(
            "/admin/product"
        );
        unmount();
    });

    it("商品検索から商品が引き継がれていない場合は商品検索へ戻る", async () => {
        vi.useFakeTimers();
        const { result, unmount } = renderHook(() =>
            useUpdateProduct(product.productUuid)
        );

        await act(async () => {
            await Promise.resolve();
        });

        expect(result.current.submitError).toContain(
            "商品検索画面から修正する商品を選択してください。"
        );
        act(() => {
            vi.advanceTimersByTime(1500);
        });
        expect(mockRouter.replace).toHaveBeenCalledWith(
            "/admin/product"
        );
        unmount();
    });

    it("Contextの商品と画像を初期値として利用する", async () => {
        const imageFile = new File(["image"], "product.png", {
            type: "image/png",
        });
        contextState.draft = product;
        contextState.imageFile = imageFile;

        const { result } = renderHook(() =>
            useUpdateProduct(product.productUuid)
        );

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });
        expect(result.current.formData).toEqual(product);
        expect(result.current.imageFile).toBe(imageFile);
        expect(result.current.categories).toEqual([
            category,
            otherCategory,
        ]);
    });

    it("商品カテゴリ取得が401の場合はログイン画面へ遷移する", async () => {
        mockGetCategories.mockRejectedValue(
            new ProductUpdateError("認証切れ", 401)
        );
        saveProductForUpdate(product);

        const { result } = renderHook(() =>
            useUpdateProduct(product.productUuid)
        );

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });
        expect(mockRouter.replace).toHaveBeenCalledWith(
            "/admin/login"
        );
        expect(mockRouter.refresh).toHaveBeenCalledTimes(1);
    });

    it("商品カテゴリ取得の一般エラーを画面へ表示する", async () => {
        mockGetCategories.mockRejectedValue(
            new Error("network error")
        );

        const { result } = renderHook(() =>
            useUpdateProduct(
                product.productUuid,
                { initialProduct: product }
            )
        );

        await waitFor(() => {
            expect(result.current.submitError).toBe(
                "商品修正画面の表示に必要な情報を取得できませんでした。"
            );
        });
        expect(result.current.isLoading).toBe(false);
        expect(result.current.formData).toBeNull();
        expect(result.current.categories).toEqual([]);
    });

    it("初期化完了前に画面を離れた場合は状態を更新しない", async () => {
        let resolveCategories!: (
            categories: ProductCategory[]
        ) => void;
        mockGetCategories.mockReturnValue(
            new Promise((resolve) => {
                resolveCategories = resolve;
            })
        );
        saveProductForUpdate(product);
        const { unmount } = renderHook(() =>
            useUpdateProduct(product.productUuid)
        );

        unmount();
        await act(async () => {
            resolveCategories([category]);
        });

        expect(mockRouter.replace).not.toHaveBeenCalled();
    });

    it("初期化エラーの確定前に画面を離れた場合はエラーを表示しない", async () => {
        let rejectCategories!: (reason: unknown) => void;
        mockGetCategories.mockReturnValue(
            new Promise((_resolve, reject) => {
                rejectCategories = reject;
            })
        );
        saveProductForUpdate(product);
        const { unmount } = renderHook(() =>
            useUpdateProduct(product.productUuid)
        );

        unmount();
        await act(async () => {
            rejectCategories(new Error("network error"));
        });

        expect(mockRouter.replace).not.toHaveBeenCalled();
    });

    it("各入力値を画面状態へ反映し、フォーカス離脱時に検証する", async () => {
        const { result } = await renderInitializedHook();

        changeField(result, "name", "油性ペン");
        changeField(result, "price", "");
        changeField(result, "price", "250");
        changeField(result, "stockQuantity", "");
        changeField(result, "stockQuantity", "25");
        changeField(
            result,
            "categoryUuid",
            otherCategory.categoryUuid
        );
        changeField(result, "categoryUuid", "unknown");
        changeField(result, "unknown", "value");

        expect(result.current.formData).toMatchObject({
            name: "油性ペン",
            price: 250,
            productStock: {
                quantity: 25,
            },
            productCategory: null,
        });

        act(() => {
            result.current.handlePriceBlur();
            result.current.handleStockBlur();
            result.current.handleCategoryBlur();
            result.current.handleImageBlur();
        });

        expect(result.current.fieldErrors.categoryUuid).toBe(
            "カテゴリを選択してください。"
        );
    });

    it("在庫情報がない商品でも在庫数を入力できる", async () => {
        const productWithoutStock: Product = {
            ...product,
            productStock: null,
        };
        const { result } = await renderInitializedHook(
            productWithoutStock
        );

        changeField(result, "stockQuantity", "10");

        expect(result.current.formData?.productStock).toEqual({
            stockUuid: "",
            quantity: 10,
        });
    });

    it("画像選択と解除を状態へ反映する", async () => {
        const { result } = await renderInitializedHook();
        const imageFile = new File(["image"], "product.png", {
            type: "image/png",
        });

        act(() => {
            result.current.handleImageChange({
                target: { files: [imageFile] },
            } as unknown as ChangeEvent<HTMLInputElement>);
        });
        expect(result.current.imageFile).toBe(imageFile);

        act(() => {
            result.current.handleImageChange({
                target: { files: null },
            } as unknown as ChangeEvent<HTMLInputElement>);
        });
        expect(result.current.imageFile).toBeNull();
    });

    it("選択画像のプレビューURLを生成し、破棄時に解放する", async () => {
        const createObjectURL = vi.fn(() => "blob:preview");
        const revokeObjectURL = vi.fn();

        /*
         * URL全体を単純なオブジェクトへ置き換えると、
         * jsdom内部で使用されるURLコンストラクタも失われる。
         * 元のURLを継承し、Object URL用メソッドだけを追加する。
         */
        const NativeURL = globalThis.URL;

        class MockURL extends NativeURL {
            public static createObjectURL =
                createObjectURL;

            public static revokeObjectURL =
                revokeObjectURL;
        }

        vi.stubGlobal(
            "URL",
            MockURL,
        );

        const { result, unmount } =
            await renderInitializedHook();
        const imageFile = new File(["image"], "product.png", {
            type: "image/png",
        });

        act(() => {
            result.current.handleImageChange({
                target: { files: [imageFile] },
            } as unknown as ChangeEvent<HTMLInputElement>);
        });

        await waitFor(() => {
            expect(result.current.imagePreviewUrl).toBe(
                "blob:preview"
            );
        });
        unmount();

        expect(createObjectURL).toHaveBeenCalledWith(imageFile);
        expect(revokeObjectURL).toHaveBeenCalledWith(
            "blob:preview"
        );
    });

    it("商品名の形式が不正な場合は重複確認を行わない", async () => {
        const { result } = await renderInitializedHook();
        changeField(result, "name", "@");

        await act(async () => {
            await result.current.handleNameBlur();
        });

        expect(result.current.fieldErrors.name).toBeTruthy();
        expect(
            mockValidateProductName
        ).not.toHaveBeenCalled();
    });

    it("確認済みの商品名は重複確認APIを再度呼ばない", async () => {
        const { result } = await renderInitializedHook();
        changeField(result, "name", "油性ペン");

        await act(async () => {
            await result.current.handleNameBlur();
            await result.current.handleNameBlur();
        });

        expect(mockValidateProductName).toHaveBeenCalledTimes(
            1
        );
    });

    it("同じ商品名の重複確認が進行中の場合はAPI呼び出しを共有する", async () => {
        let resolveValidation!: () => void;
        mockValidateProductName.mockReturnValue(
            new Promise<void>((resolve) => {
                resolveValidation = resolve;
            })
        );
        const { result } = await renderInitializedHook();
        changeField(result, "name", "油性ペン");

        let first!: Promise<void>;
        let second!: Promise<void>;
        act(() => {
            first = result.current.handleNameBlur();
            second = result.current.handleNameBlur();
        });
        await act(async () => {
            resolveValidation();
            await Promise.all([first, second]);
        });

        expect(mockValidateProductName).toHaveBeenCalledTimes(
            1
        );
    });

    it("重複確認中に商品名が変わった場合は古い結果を採用しない", async () => {
        let resolveValidation!: () => void;
        mockValidateProductName.mockReturnValue(
            new Promise<void>((resolve) => {
                resolveValidation = resolve;
            })
        );
        const { result } = await renderInitializedHook();
        changeField(result, "name", "油性ペン");

        let validation!: Promise<void>;
        act(() => {
            validation = result.current.handleNameBlur();
        });
        changeField(result, "name", "蛍光ペン");
        await act(async () => {
            resolveValidation();
            await validation;
        });

        expect(result.current.fieldErrors.name).toBeUndefined();
    });

    it("異なる商品名の重複確認が並行した場合は新しい確認状態を維持する", async () => {
        const resolvers = new Map<string, () => void>();
        mockValidateProductName.mockImplementation(
            (name: string) =>
                new Promise<void>((resolve) => {
                    resolvers.set(name, resolve);
                })
        );
        const { result } = await renderInitializedHook();
        changeField(result, "name", "油性ペン");

        let firstValidation!: Promise<void>;
        act(() => {
            firstValidation =
                result.current.handleNameBlur();
        });
        changeField(result, "name", "蛍光ペン");
        let secondValidation!: Promise<void>;
        act(() => {
            secondValidation =
                result.current.handleNameBlur();
        });

        await act(async () => {
            resolvers.get("油性ペン")!();
            await firstValidation;
        });
        await act(async () => {
            resolvers.get("蛍光ペン")!();
            await secondValidation;
        });

        expect(mockValidateProductName).toHaveBeenCalledTimes(
            2
        );
        expect(result.current.fieldErrors.name).toBeUndefined();
    });

    it("重複確認の想定外エラーを共通メッセージへ変換する", async () => {
        mockValidateProductName.mockRejectedValue("unexpected");
        const { result } = await renderInitializedHook();
        changeField(result, "name", "油性ペン");

        await act(async () => {
            await result.current.handleNameBlur();
        });

        expect(result.current.fieldErrors.name).toBe(
            "商品名の重複確認に失敗しました。"
        );
    });

    it("重複確認エラーの確定前に商品名が変わった場合は古いエラーを表示しない", async () => {
        let rejectValidation!: (reason: unknown) => void;
        mockValidateProductName.mockReturnValue(
            new Promise<void>((_resolve, reject) => {
                rejectValidation = reject;
            })
        );
        const { result } = await renderInitializedHook();
        changeField(result, "name", "油性ペン");

        let validation!: Promise<void>;
        act(() => {
            validation = result.current.handleNameBlur();
        });
        changeField(result, "name", "蛍光ペン");
        await act(async () => {
            rejectValidation(new Error("duplicate"));
            await validation;
        });

        expect(result.current.fieldErrors.name).toBeUndefined();
    });

    it("入力エラーがある場合は確認画面へ進まない", async () => {
        const { result } = await renderInitializedHook();
        changeField(result, "name", "");

        await submitForConfirmation(result);

        expect(result.current.fieldErrors.name).toBe(
            "商品名を入力してください。"
        );
        expect(contextState.saveDraft).not.toHaveBeenCalled();
    });

    it("モーダルでは選択商品を初期表示して確認画面を開く", async () => {
        const onProceedToConfirm = vi.fn();
        const { result } = renderHook(() =>
            useUpdateProduct(
                product.productUuid,
                {
                    initialProduct: product,
                    onProceedToConfirm,
                }
            )
        );

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
            expect(result.current.formData).toEqual(product);
        });

        await submitForConfirmation(result);

        expect(contextState.saveDraft).toHaveBeenCalledWith(
            product,
            null
        );
        expect(onProceedToConfirm).toHaveBeenCalledTimes(1);
        expect(mockRouter.push).not.toHaveBeenCalledWith(
            "/admin/product/edit/confirm"
        );
    });

    it("モーダルの商品更新成功時は完了処理を呼び出す", async () => {
        const onUpdateSuccess = vi.fn();
        const onUpdatePendingChange = vi.fn();
        contextState.draft = product;
        const { result } = renderHook(() =>
            useUpdateProduct(
                undefined,
                {
                    onUpdateSuccess,
                    onUpdatePendingChange,
                }
            )
        );

        await act(async () => {
            await result.current.handleUpdate();
        });

        expect(onUpdateSuccess).toHaveBeenCalledWith(
            updateResult
        );
        expect(
            onUpdatePendingChange.mock.calls
        ).toEqual([[true], [false]]);
        expect(mockRouter.push).not.toHaveBeenCalledWith(
            "/admin/product/edit/complete"
        );
    });

    it("更新後処理の失敗を商品更新APIの失敗と区別する", async () => {
        const onUpdateSuccess = vi
            .fn()
            .mockRejectedValue(new Error("refresh error"));
        contextState.draft = product;
        const { result } = renderHook(() =>
            useUpdateProduct(
                undefined,
                { onUpdateSuccess }
            )
        );

        await act(async () => {
            await result.current.handleUpdate();
        });

        expect(mockUpdateProduct).toHaveBeenCalledTimes(1);
        expect(result.current.submitError).toBe(
            "商品情報の修正は完了しましたが、商品一覧を再取得できませんでした。商品検索画面を再読み込みしてください。"
        );
        expect(result.current.isLoading).toBe(false);
    });

    it("モーダルの戻る・キャンセル処理を呼び出す", () => {
        const onBackToInput = vi.fn();
        const onCancel = vi.fn();
        contextState.draft = product;
        const { result } = renderHook(() =>
            useUpdateProduct(
                undefined,
                {
                    onBackToInput,
                    onCancel,
                }
            )
        );

        act(() => {
            result.current.handleBackToInput();
            result.current.handleCancel();
        });

        expect(onBackToInput).toHaveBeenCalledTimes(1);
        expect(onCancel).toHaveBeenCalledTimes(1);
        expect(mockRouter.push).not.toHaveBeenCalled();
    });

    it("商品更新成功時は完了結果を保存して完了画面へ進む", async () => {
        const imageFile = new File(["image"], "product.png", {
            type: "image/png",
        });
        contextState.draft = product;
        contextState.imageFile = imageFile;
        saveProductForUpdate(product);
        const { result } = renderHook(() =>
            useUpdateProduct()
        );

        await act(async () => {
            await result.current.handleUpdate();
        });

        expect(mockUpdateProduct).toHaveBeenCalledWith(
            product,
            imageFile
        );
        expect(
            contextState.setCompletedResult
        ).toHaveBeenCalledWith(updateResult);
        expect(
            loadProductForUpdate(product.productUuid)
        ).toBeNull();
        expect(mockRouter.push).toHaveBeenCalledWith(
            "/admin/product/edit/complete"
        );
        expect(result.current.isLoading).toBe(false);
    });

    it("商品更新の401エラーではログイン画面へ遷移する", async () => {
        contextState.draft = product;
        mockUpdateProduct.mockRejectedValue(
            new ProductUpdateError("認証切れ", 401)
        );
        const { result } = renderHook(() =>
            useUpdateProduct()
        );

        await act(async () => {
            await result.current.handleUpdate();
        });

        expect(mockRouter.replace).toHaveBeenCalledWith(
            "/admin/login"
        );
        expect(mockRouter.refresh).toHaveBeenCalledTimes(1);
    });

    it("商品更新の業務エラーを項目・送信エラーへ反映する", async () => {
        contextState.draft = product;
        mockUpdateProduct.mockRejectedValue(
            new ProductUpdateError(
                "入力内容を確認してください。",
                400,
                { name: "商品名エラー" }
            )
        );
        const { result } = renderHook(() =>
            useUpdateProduct()
        );

        await act(async () => {
            await result.current.handleUpdate();
        });

        expect(result.current.fieldErrors.name).toBe(
            "商品名エラー"
        );
        expect(result.current.submitError).toBe(
            "入力内容を確認してください。"
        );
    });

    it("商品更新の想定外エラーを共通メッセージへ変換する", async () => {
        contextState.draft = product;
        mockUpdateProduct.mockRejectedValue("unexpected");
        const { result } = renderHook(() =>
            useUpdateProduct()
        );

        await act(async () => {
            await result.current.handleUpdate();
        });

        expect(result.current.submitError).toBe(
            "商品情報の修正に失敗しました。管理者に連絡してください。"
        );
    });

    it("確認画面から入力画面へ商品UUIDをURLエンコードして戻る", () => {
        contextState.draft = {
            ...product,
            productUuid: "product uuid/test",
        };
        const { result } = renderHook(() =>
            useUpdateProduct()
        );

        act(() => {
            result.current.handleBackToInput();
        });

        expect(mockRouter.push).toHaveBeenCalledWith(
            "/admin/product/edit/product%20uuid%2Ftest"
        );
    });
});
