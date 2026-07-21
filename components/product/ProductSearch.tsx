"use client";
import { Product } from "@/models/Product";
import {
    useEffect,
    useState,
} from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { AlertCircle } from "lucide-react";
import { KeywordSearchForm } from "./KeywordSearchForm";

import { ProductCardList } from "./ProductCardList";
import { CategorySearchForm } from "./CategorySearchForm";

import { useSearchProductByKeyword } from "@/components/hooks/useSearchProductByKeyword";
import { useSearchProductByCategory } from "@/components/hooks/useSearchProductByCategory";
import { useProductCategories } from "@/components/hooks/useProductCategories";
import { useDeleteProduct } from "@/components/hooks/useDeleteProduct";
import { saveProductForUpdate } from "@/components/product/edit/productUpdateStorage";

/**
 * 現在画面に表示する検索結果の種類
 */
type DisplayMode =
    | "category"
    | "keyword";

/**
 * 商品検索画面
 *
 * ・初回表示時はカテゴリ未指定で全商品を表示する
 * ・キーワードによる商品検索を行う
 * ・通常商品と削除済み商品を切り替える
 */
export const ProductSearch = () => {
    const router = useRouter();

    /**
     * 検索キーワード
     */
    const [keyword, setKeyword] =
        useState<string>("");

    /**
     * 現在表示している検索結果
     *
     * 初回表示では全件取得を行うため、
     * categoryを初期値とする。
     */
    const [displayMode, setDisplayMode] =
        useState<DisplayMode>("category");

    const {
        deleteTarget,
        isDeleteModalOpen,
        isDeleting,
        deleteError,
        isDeleteToastVisible,

        openDeleteModal,
        closeDeleteModal,
        confirmDelete,
        closeDeleteToast,
    } = useDeleteProduct();

    /**
     * 削除済み商品のみ表示するか
     *
     * キーワード検索とカテゴリ検索の
     * 共通条件として画面側で管理する。
     */
    const [
        showDeletedOnly,
        setShowDeletedOnly,
    ] = useState<boolean>(false);

    /**
     * キーワード検索Hook
     */
    const {
        products: keywordProducts,
        isLoading: isKeywordLoading,
        error: keywordError,
        search: searchByKeyword,
    } = useSearchProductByKeyword();

    /**
     * カテゴリ検索Hook
     */
    const {
        products: categoryProducts,
        isLoading: isCategoryLoading,
        error: categoryError,
        search: searchByCategory,
    } = useSearchProductByCategory();

    const {
        categories,
        isLoading: isCategoriesLoading,
        error: categoriesError,
    } = useProductCategories();



    /**
 * 削除確認モーダルで
 * 「削除する」を押したときの処理
 */
    const handleConfirmDelete =
        async (): Promise<void> => {
            const isDeleted =
                await confirmDelete();

            /*
             * 削除に失敗した場合は、
             * モーダル内にエラーを表示する。
             */
            if (!isDeleted) {
                return;
            }

            /*
             * 削除成功後、
             * 現在表示中の検索条件で再検索する。
             */
            if (displayMode === "keyword") {
                const trimmedKeyword =
                    keyword.trim();

                if (trimmedKeyword === "") {
                    return;
                }

                await searchByKeyword(
                    trimmedKeyword,
                    showDeletedOnly
                );

                return;
            }

            const categoryUuidForSearch =
                categoryUuid === "all"
                    ? ""
                    : categoryUuid;

            await searchByCategory(
                categoryUuidForSearch,
                showDeletedOnly
            );
        };

    /**
 * 選択中の商品カテゴリ
 *
 * "all" はすべてのカテゴリを表す。
 */
    const [categoryUuid, setCategoryUuid] =
        useState<string>("all");

    /**
     * 初回表示時に全商品を取得する
     *
     * categoryUuidに空文字を渡すことで、
     * カテゴリ未指定の検索を行う。
     *
     * showDeletedOnlyはfalseなので、
     * 通常商品の一覧を取得する。
     */
    useEffect(() => {
        void searchByCategory(
            "",
            false
        );
    }, [searchByCategory]);
    /**
 * 検索方法タブ切り替え
 */
    const handleTabChange = (
        mode: DisplayMode
    ) => {
        setDisplayMode(mode);
    };

    /**
     * キーワード検索ボタン押下
     */
    const handleSearchClick = () => {
        const trimmedKeyword =
            keyword.trim();

        if (trimmedKeyword === "") {
            return;
        }

        setDisplayMode("keyword");

        void searchByKeyword(
            trimmedKeyword,
            showDeletedOnly
        );
    };

    /**
     * 全商品表示ボタン押下
     *
     * 現在の削除済み表示条件を維持したまま、
     * カテゴリ未指定の検索を行う。
     */
    const handleShowAllClick = () => {
        setDisplayMode("category");

        void searchByCategory(
            "",
            showDeletedOnly
        );
    };

    const handleCategoryChange = (
        selectedCategoryUuid: string
    ) => {
        setCategoryUuid(
            selectedCategoryUuid
        );

        setDisplayMode("category");

        const valueForApi =
            selectedCategoryUuid === "all"
                ? ""
                : selectedCategoryUuid;

        void searchByCategory(
            valueForApi,
            showDeletedOnly
        );
    };

    /**
 * 削除済み表示切り替え
 *
 * 現在のキーワードまたはカテゴリを維持したまま、
 * 通常商品と削除済み商品を切り替える。
 */
    const handleDeletedOnlyChange = (
        checked: boolean
    ) => {
        setShowDeletedOnly(checked);

        /*
         * キーワード検索結果を表示している場合
         */
        if (displayMode === "keyword") {
            const trimmedKeyword =
                keyword.trim();

            if (trimmedKeyword === "") {
                return;
            }

            void searchByKeyword(
                trimmedKeyword,
                checked
            );

            return;
        }

        /*
         * カテゴリ検索結果を表示している場合
         *
         * "all" のときだけ空文字を渡す。
         * 特定カテゴリ選択中なら、そのUUIDを維持する。
         */
        const categoryUuidForSearch =
            categoryUuid === "all"
                ? ""
                : categoryUuid;

        void searchByCategory(
            categoryUuidForSearch,
            checked
        );
    };

    /**
     * 現在表示する商品一覧
     */
    const products =
        displayMode === "keyword"
            ? keywordProducts
            : categoryProducts;

    /**
     * 現在表示中の検索処理の状態
     */
    const isLoading =
        displayMode === "keyword"
            ? isKeywordLoading
            : isCategoryLoading;

    /**
     * 現在表示中の検索処理のエラー
     */
    const error =
        displayMode === "keyword"
            ? keywordError
            : categoryError;

    const isDeletedCheckboxDisabled =
        isLoading ||
        (
            displayMode === "category" &&
            categoryUuid === "all"
        );

    const handleUpdate = (
        product: Product
    ) => {
        saveProductForUpdate(product);

        router.push(
            `/admin/product/edit/${product.productUuid}`
        );
    };

    return (
        <div className="mx-auto max-w-6xl rounded-lg border border-border bg-white p-8 shadow-sm">
            <div className="mb-6 flex items-center justify-center gap-4">
                <h2 className="text-2xl font-bold text-foreground">
                    商品検索
                </h2>

                <Button
                    type="button"
                    onClick={() => {
                        router.push("/admin/product/add");
                    }}
                    className="bg-green-600 px-6 py-3 text-lg font-semibold text-white hover:bg-green-700"
                >
                    新商品登録
                </Button>
            </div>

            {/* 検索方法タブ */}
            <div
                className="mb-6 grid grid-cols-2 border-b"
                role="tablist"
                aria-label="商品検索方法"
            >
                <button
                    type="button"
                    role="tab"
                    aria-selected={
                        displayMode === "category"
                    }
                    onClick={() => {
                        handleTabChange("category");
                    }}
                    className={`rounded-t-md border px-4 py-3 font-semibold transition-colors ${displayMode === "category"
                        ? "border-green-600 bg-green-600 text-white"
                        : "border-gray-300 bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                >
                    カテゴリ検索
                </button>

                <button
                    type="button"
                    role="tab"
                    aria-selected={
                        displayMode === "keyword"
                    }
                    onClick={() => {
                        handleTabChange("keyword");
                    }}
                    className={`rounded-t-md border px-4 py-3 font-semibold transition-colors ${displayMode === "keyword"
                        ? "border-green-600 bg-green-600 text-white"
                        : "border-gray-300 bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                >
                    キーワード検索
                </button>
            </div>


            {/* 検索条件入力エリア */}
            <div className="mb-8">
                {displayMode === "category" ? (
                    <div className="space-y-4">
                        <CategorySearchForm
                            categories={categories}
                            categoryUuid={categoryUuid}
                            isLoading={
                                isCategoriesLoading ||
                                isCategoryLoading
                            }
                            onCategoryChange={
                                handleCategoryChange
                            }
                        />

                        <div className="flex justify-center">
                            <div className="flex flex-col gap-1">
                                <div
                                    className={`flex items-center space-x-2 ${isDeletedCheckboxDisabled
                                        ? "opacity-50"
                                        : ""
                                        }`}
                                >
                                    <Checkbox
                                        id="showDeletedOnlyCategory"
                                        checked={
                                            showDeletedOnly
                                        }
                                        disabled={
                                            isDeletedCheckboxDisabled
                                        }
                                        onCheckedChange={(
                                            checked
                                        ) =>
                                            handleDeletedOnlyChange(
                                                checked === true
                                            )
                                        }
                                    />

                                    <Label
                                        htmlFor="showDeletedOnlyCategory"
                                        className={
                                            isDeletedCheckboxDisabled
                                                ? "cursor-not-allowed"
                                                : "cursor-pointer"
                                        }
                                    >
                                        削除済み
                                    </Label>
                                </div>

                                {categoryUuid === "all" && (
                                    <p className="pl-6 text-xs text-muted-foreground">
                                        カテゴリを選択すると利用できます
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="flex justify-center">
                            <KeywordSearchForm
                                keyword={keyword}
                                isLoading={
                                    isKeywordLoading
                                }
                                onKeywordChange={
                                    setKeyword
                                }
                                onSearch={
                                    handleSearchClick
                                }
                            />
                        </div>

                        <div className="flex justify-center">
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="showDeletedOnlyKeyword"
                                    checked={
                                        showDeletedOnly
                                    }
                                    disabled={
                                        isKeywordLoading
                                    }
                                    onCheckedChange={(
                                        checked
                                    ) =>
                                        handleDeletedOnlyChange(
                                            checked === true
                                        )
                                    }
                                />

                                <Label
                                    htmlFor="showDeletedOnlyKeyword"
                                    className="cursor-pointer"
                                >
                                    削除済み
                                </Label>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* エラー表示 */}
            {error && (
                <div className="mb-6 flex items-center gap-2 rounded-md border border-red-200 bg-red-50 p-4 text-red-600">
                    <AlertCircle className="h-5 w-5 shrink-0" />

                    <span className="font-medium">
                        {error}
                    </span>
                </div>
            )}

            {/* ローディング表示 */}
            {isLoading && (
                <p className="py-8 text-center text-muted-foreground">
                    商品を取得しています...
                </p>
            )}

            {/* 商品が存在しない場合 */}
            {!isLoading &&
                !error &&
                products.length === 0 && (
                    <p className="py-8 text-center text-muted-foreground">
                        {showDeletedOnly
                            ? "削除済みの商品が見つかりません。"
                            : "商品が見つかりません。"}
                    </p>
                )}

            {/* 商品カード一覧 */}
            {!isLoading &&
                products.length > 0 && (
                    <ProductCardList
                        products={products}
                        onDelete={openDeleteModal}
                        onUpdate={handleUpdate}


                    />
                )}

            {/* 商品削除確認モーダル */}
            {isDeleteModalOpen &&
                deleteTarget && (
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
                        role="presentation"
                        onMouseDown={
                            closeDeleteModal
                        }
                    >
                        <section
                            role="dialog"
                            aria-modal="true"
                            aria-labelledby="delete-product-modal-title"
                            aria-describedby="delete-product-modal-description"
                            className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl"
                            onMouseDown={(event) => {
                                /*
                                 * モーダル本体をクリックしたときに、
                                 * 背景側のクリック処理が動くのを防ぐ。
                                 */
                                event.stopPropagation();
                            }}
                        >
                            <h2
                                id="delete-product-modal-title"
                                className="mb-4 text-center text-xl font-bold text-gray-900"
                            >
                                商品削除の確認
                            </h2>

                            <p
                                id="delete-product-modal-description"
                                className="text-center text-gray-700"
                            >
                                以下の商品を削除しますか？
                            </p>

                            <div className="mt-5 rounded-md border border-gray-200 bg-gray-50 p-4">
                                <dl className="space-y-3">
                                    <div className="grid grid-cols-[100px_1fr] gap-3">
                                        <dt className="font-semibold text-gray-700">
                                            商品名
                                        </dt>

                                        <dd className="break-words text-gray-900">
                                            {deleteTarget.name}
                                        </dd>
                                    </div>

                                    <div className="grid grid-cols-[100px_1fr] gap-3">
                                        <dt className="font-semibold text-gray-700">
                                            単価
                                        </dt>

                                        <dd className="text-gray-900">
                                            {deleteTarget.price.toLocaleString()}
                                            円
                                        </dd>
                                    </div>

                                    <div className="grid grid-cols-[100px_1fr] gap-3">
                                        <dt className="font-semibold text-gray-700">
                                            カテゴリ
                                        </dt>

                                        <dd className="break-words text-gray-900">
                                            {deleteTarget
                                                .productCategory
                                                ?.name ??
                                                "未設定"}
                                        </dd>
                                    </div>
                                </dl>
                            </div>

                            <p className="mt-4 text-center text-sm text-red-600">
                                削除した商品は、通常の商品一覧には表示されなくなります。
                            </p>

                            {/* 削除エラー */}
                            {deleteError && (
                                <div
                                    role="alert"
                                    className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-600"
                                >
                                    {deleteError}
                                </div>
                            )}

                            <div className="mt-8 flex justify-center gap-4">
                                <button
                                    type="button"
                                    onClick={
                                        closeDeleteModal
                                    }
                                    disabled={
                                        isDeleting
                                    }
                                    className="rounded border border-gray-400 px-5 py-2 font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    キャンセル
                                </button>

                                <button
                                    type="button"
                                    onClick={() => {
                                        void handleConfirmDelete();
                                    }}
                                    disabled={
                                        isDeleting
                                    }
                                    className="rounded bg-red-600 px-5 py-2 font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {isDeleting
                                        ? "削除中..."
                                        : "削除する"}
                                </button>
                            </div>
                        </section>
                    </div>
                )}
        </div>
    );
};