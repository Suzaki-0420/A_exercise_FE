"use client";

import { useState } from "react";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { AlertCircle } from "lucide-react";
import { useSearchProductByKeyword } from "@/components/hooks/useSearchProductByKeyword";

/**
 * 商品キーワード検索画面
 */
export const ProductSearch = () => {

    // 検索キーワード
    const [keyword, setKeyword] = useState<string>("");

    // カスタムフック
    const {
        products,
        isLoading,
        error,
        search,
        showDeletedOnly,
        setShowDeletedOnly,
    } = useSearchProductByKeyword();

    // 検索ボタン押下
    const handleSearchClick = () => {
        search(keyword);
    };

    return (
        <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-sm border border-border">
            <h2 className="text-2xl font-bold text-foreground mb-6 text-center border-b pb-4">
                商品キーワード検索
            </h2>

            {/* 検索入力エリア */}
            <div className="flex justify-center items-center gap-4 mb-8">
                <Input
                    type="text"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    placeholder="商品名を入力..."
                    className="max-w-sm"
                />

                <Button
                    onClick={handleSearchClick}
                    disabled={isLoading}
                    className="px-8"
                >
                    {isLoading ? "検索中..." : "検索"}
                </Button>

                <div className="flex items-center space-x-2">
                    <Checkbox
                        id="showDeletedOnly"
                        checked={showDeletedOnly}
                        onCheckedChange={(checked) =>
                            setShowDeletedOnly(checked === true)
                        }
                    />
                    <Label htmlFor="showDeletedOnly">
                        削除済みのみ
                    </Label>
                </div>
            </div>

            {/* エラー表示 */}
            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-md flex items-center gap-2">
                    <AlertCircle className="h-5 w-5" />
                    <span className="font-medium">{error}</span>
                </div>
            )}

            {/* 検索結果 */}
            <div>
                {products.length === 0 && !isLoading && (
                    <p className="text-center text-muted-foreground py-4">
                        商品が見つかりません。検索ボタンを押してください。
                    </p>
                )}

                {products.length > 0 && (
                    <div className="border rounded-md">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/50">
                                    <TableHead className="text-center">
                                        画像
                                    </TableHead>
                                    <TableHead>
                                        商品名
                                    </TableHead>
                                    <TableHead className="text-right">
                                        価格
                                    </TableHead>
                                    <TableHead className="text-center">
                                        カテゴリ
                                    </TableHead>
                                    <TableHead className="text-right">
                                        在庫
                                    </TableHead>
                                </TableRow>
                            </TableHeader>

                            <TableBody>
                                {products.map((product) => (
                                    <TableRow key={product.productUuid}>
                                        {/* 商品画像 */}
                                        <TableCell className="text-center">
                                            {product.imageUrl ? (
                                                <Image
                                                    src={product.imageUrl}
                                                    alt={product.name}
                                                    width={64}
                                                    height={64}
                                                    className="rounded object-cover mx-auto"
                                                />
                                            ) : (
                                                <span className="text-muted-foreground text-xs">
                                                    画像なし
                                                </span>
                                            )}
                                        </TableCell>

                                        {/* 商品名 */}
                                        <TableCell className="font-medium">
                                            {product.name}
                                        </TableCell>

                                        {/* 価格 */}
                                        <TableCell className="text-right">
                                            ￥{product.price.toLocaleString()}
                                        </TableCell>

                                        {/* カテゴリ */}
                                        <TableCell className="text-center">
                                            <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                                                {product.productCategory?.name ?? "-"}
                                            </span>
                                        </TableCell>

                                        {/* 在庫 */}
                                        <TableCell className="text-right">
                                            {product.productStock?.quantity ?? 0}
                                            <span className="text-muted-foreground text-xs">
                                                {" "}個
                                            </span>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </div>
        </div>
    );
};

