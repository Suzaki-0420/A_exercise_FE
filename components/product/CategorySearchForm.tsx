"use client";

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { ProductCategory } from "@/models/ProductCategory";


/**
 * カテゴリ検索フォームのProps
 */
type CategorySearchFormProps = {
    categories: ProductCategory[];
    categoryUuid: string;
    isLoading: boolean;
    onCategoryChange: (
        categoryUuid: string
    ) => void;
};

/**
 * 商品カテゴリ検索フォーム
 *
 * カテゴリを選択したタイミングで、
 * 親コンポーネントへ選択値を通知する。
 */
export const CategorySearchForm = ({
    categories,
    categoryUuid,
    isLoading,
    onCategoryChange,
}: CategorySearchFormProps) => {
    return (
        <div className="flex items-center justify-center gap-4">
            <div className="w-80">
                <Select
                    value={categoryUuid}
                    onValueChange={
                        onCategoryChange
                    }
                    disabled={isLoading}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="カテゴリを選択してください" />
                    </SelectTrigger>

                    <SelectContent>
                        <SelectItem value="all">
                            すべてのカテゴリ
                        </SelectItem>

                        {categories.map(
                            (category) => (
                                <SelectItem
                                    key={
                                        category.categoryUuid
                                    }
                                    value={
                                        category.categoryUuid
                                    }
                                >
                                    {category.name}
                                </SelectItem>
                            )
                        )}
                    </SelectContent>
                </Select>
            </div>
        </div>
    );
};