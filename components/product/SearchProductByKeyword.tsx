"use client";

import {
    useEffect,
    useState,
} from "react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { AlertCircle } from "lucide-react";
import { KeywordSearchForm } from "./KeywordSearchForm";

import { ProductCardList } from "./ProductCardList";
import { CategorySearchForm } from "../product/CategorySearchForm";

import { useSearchProductByKeyword } from "@/components/hooks/useSearchProductByKeyword";
import { useSearchProductByCategory } from "@/components/hooks/useSearchProductByCategory";
import { useProductCategories } from "@/components/hooks/useProductCategories";

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
     * 現在表示している検索方法を維持したまま、
     * 通常商品と削除済み商品を切り替える。
     */
    const handleDeletedOnlyChange = (
        checked: boolean
    ) => {
        setShowDeletedOnly(checked);

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

        void searchByCategory(
            "",
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

    return (
        <div className="mx-auto max-w-6xl rounded-lg border border-border bg-white p-8 shadow-sm">
            <h2 className="mb-6 border-b pb-4 text-center text-2xl font-bold text-foreground">
                商品検索
            </h2>

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


            {/* 検索入力エリア */}
            <div className="mb-8 flex flex-wrap items-center justify-center gap-4">
                <KeywordSearchForm
                    keyword={keyword}
                    isLoading={isKeywordLoading}
                    onKeywordChange={setKeyword}
                    onSearch={handleSearchClick}
                />

                <div className="flex items-center space-x-2">
                    <Checkbox
                        id="showDeletedOnly"
                        checked={showDeletedOnly}
                        disabled={isLoading}
                        onCheckedChange={(
                            checked
                        ) =>
                            handleDeletedOnlyChange(
                                checked === true
                            )
                        }
                    />

                    <Label htmlFor="showDeletedOnly">
                        削除済み
                    </Label>
                </div>
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
                    />
                )}
        </div>
    );
};