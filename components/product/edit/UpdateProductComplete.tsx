"use client";

import { useUpdateProduct } from "@/components/hooks/useUpdateProduct";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
    CheckCircle2Icon,
    HouseIcon,
    SearchIcon,
} from "lucide-react";
import { useEffect } from "react";

/**
 * BP011 商品修正（完了）画面
 */
export const UpdateProductComplete = () => {
    const {
        completedResult,
        handleInvalidFlow,
        handleLeaveComplete,
    } = useUpdateProduct();

    useEffect(() => {
        if (!completedResult) {
            handleInvalidFlow("/admin");
        }
    }, [completedResult, handleInvalidFlow]);

    if (!completedResult) {
        return (
            <main className="flex flex-1 items-center justify-center bg-gray-50 px-4 py-12">
                <div
                    role="status"
                    className="flex items-center gap-2 text-sm text-gray-600"
                >
                    <Spinner aria-hidden="true" />
                    メニュー画面へ移動しています...
                </div>
            </main>
        );
    }

    return (
        <main className="flex flex-1 items-start justify-center bg-gray-50 px-4 py-10 sm:items-center sm:py-16">
            <section
                aria-labelledby="update-product-complete-title"
                className="w-full max-w-xl rounded-lg border bg-white p-6 text-center shadow-sm sm:p-8"
            >
                <CheckCircle2Icon
                    aria-hidden="true"
                    className="mx-auto size-12 text-green-700"
                />
                <h1
                    id="update-product-complete-title"
                    className="mt-4 text-2xl font-bold text-gray-900"
                >
                    商品変更（完了）
                </h1>
                <p className="mt-3 text-gray-700">
                    商品情報の修正が完了しました。
                </p>
                <p className="mt-2 text-sm text-gray-600">
                    対象商品：{completedResult.name}
                </p>

                <div className="mt-8 grid gap-3 sm:grid-cols-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() =>
                            handleLeaveComplete("/admin")
                        }
                    >
                        <HouseIcon aria-hidden="true" />
                        メニューへ
                    </Button>
                    <Button
                        type="button"
                        onClick={() =>
                            handleLeaveComplete(
                                "/admin/product"
                            )
                        }
                        className="bg-green-700 text-white hover:bg-green-800"
                    >
                        <SearchIcon aria-hidden="true" />
                        商品検索へ戻る
                    </Button>
                </div>
            </section>
        </main>
    );
};
