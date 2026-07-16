import { container } from "@/di/container";
import { TYPES } from "@/di/types";
import { ISearchProductServiceByKeywordService } from "@/interfaces/ISearchProductByKeywordService";
import { Product } from "@/models/Product";
import { useState } from "react";
/**
 * 演習 8-7 バックエンドにアクセスするリポジトリを実装して切り替える
 * 商品検索のState(状態)と操作を提供するカスタムフック
 */
export const useSearchProductByKeyword = () => {
    // 状態(State)の定義
    // 検索結果の商品データを配列として保持するState
    const [products, setProducts] = useState<Product[]>([]);
    // 検索処理中(通信中)であるかを判定するためのフラグState
    const [isLoading, setIsLoading] = useState<boolean>(false);
    // エラー状態を保持するStateを追加（例外発生時のエラーメッセージを保存するため）
    const [error, setError] = useState<string | null>(null);
    // 削除済み商品の表示フラグ
    const [showDeletedOnly, setShowDeletedOnly] = useState(false);

    // DIコンテナからユースケース(Service)を取得する
    const searchService = container.get<ISearchProductServiceByKeywordService>(TYPES.ISearchProductServiceByKeywordService);

    // UIから呼び出される実行関数
    const search = async (keyword: string) => {
        // 処理開始時にローディング状態をオンにする(UI側でボタンを無効化するなどの制御に使用)
        setIsLoading(true);
        // 検索開始時にエラーをリセットする
        setError(null);
        try {
            // Serviceを呼び出してデータを取得する
            const result = await searchService.execute(keyword, showDeletedOnly);
            // 取得したデータをStateに保存（これにより画面が再描画される）
            setProducts(result);
        } catch (e: any) {
            // リポジトリが投げたエラーをキャッチしてエラーメッセージをStateに保存する
            setError(e.message);
            setProducts([]); // エラー時はリストをクリアする
        } finally {
            // 処理の成功・失敗に関わらず、必ずローディング状態をオフに戻す
            setIsLoading(false);
        }
    };

    // UI層に対して、State(データ)と関数を公開する
    return {
        products,   // コンポーネント側で表示するための商品リスト
        isLoading,  // コンポーネント側でローディング表示を切り替えるための状態
        error,      // コンポーネント側でエラーメッセージを表示するための状態
        search,     // コンポーネント側で検索処理を実行するための関数
        showDeletedOnly,
        setShowDeletedOnly
    };
};