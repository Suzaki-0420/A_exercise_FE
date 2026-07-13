import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  async rewrites() {
    return [
      {
        /**
         * 担当者アカウントAPI用のプロキシ設定
         * source: フロントエンド側で呼び出すURL（相対パス）
         * destination: 実際にデータを取得しに行くバックエンドURL
         * ※画面（/api/users/register）とのURL衝突を避けるため、
         *   API専用の入り口として「/proxy-api/」を冠しています。
         */
        source: '/proxy-api/users/:path*',
        destination: 'http://127.0.0.1/admin/account/:path*',
      },
      {
        /**
         * 商品管理API用のプロキシ設定
         * source: フロントエンド側で呼び出すURL
         * destination: 商品管理APIエンドポイント
         */
        source: '/proxy-api/products/:path*',
        destination: 'http://127.0.0.1/admin/product/:path*',
      },
      {
        /**
         * 商品カテゴリ管理API用のプロキシ設定
         * source: フロントエンド側で呼び出すURL
         * destination: 商品管理APIエンドポイント
         */
        source: '/proxy-api/products/:path*',
        destination: 'http://127.0.0.1/admin/category/:path*',
      },
      {
        /**
         * 購入管理API用のプロキシ設定
         * source: フロントエンド側で呼び出すURL
         * destination: 商品管理APIエンドポイント
         */
        source: '/proxy-api/products/:path*',
        destination: 'http://127.0.0.1/admin/order/:path*',
      },
    ]
  }
};

export default nextConfig;
