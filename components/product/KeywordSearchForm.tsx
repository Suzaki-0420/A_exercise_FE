"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

/**
 * キーワード検索フォームのProps
 */
type KeywordSearchFormProps = {
  keyword: string;
  isLoading: boolean;
  onKeywordChange: (keyword: string) => void;
  onSearch: () => void;
};

/**
 * 商品キーワード検索フォーム
 *
 * 入力値や検索処理は親コンポーネントで管理し、
 * このコンポーネントは表示とイベント通知のみを担当する。
 */
export const KeywordSearchForm = ({
  keyword,
  isLoading,
  onKeywordChange,
  onSearch,
}: KeywordSearchFormProps) => {
  /**
   * Enterキーによる検索
   */
  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Enter") {
      return;
    }

    if (keyword.trim() === "") {
      return;
    }

    onSearch();
  };

  return (
    <div className="flex items-center justify-center gap-4">
      <div className="w-80">
        <Input
          type="text"
          aria-label="商品名"
          value={keyword}
          onChange={(event) => onKeywordChange(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="商品名を入力..."
        />
      </div>

      <Button
        type="button"
        onClick={onSearch}
        disabled={isLoading || keyword.trim() === ""}
      >
        {isLoading ? "検索中..." : "キーワード検索"}
      </Button>
    </div>
  );
};
