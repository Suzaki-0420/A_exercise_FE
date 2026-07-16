import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  async rewrites() {
    return [
      {
        /**
         * 担当者認証API用のプロキシ設定
         * source: フロントエンド側で呼び出すURL
         * destination: 担当者認証APIエンドポイント
         */
        source: '/proxy-api/auth/:path*',
        destination: 'http://74.176.217.130/api/admin/auth/:path*',
      },
      {
        /**
         * 担当者アカウントAPI用のプロキシ設定
         * source: フロントエンド側で呼び出すURL（相対パス）
         * destination: 実際にデータを取得しに行くバックエンドURL
         * ※画面（/api/users/register）とのURL衝突を避けるため、
         *   API専用の入り口として「/proxy-api/」を冠しています。
         */
        source: '/proxy-api/account/:path*',
        destination: 'http://74.176.217.130/admin/account/:path*',
      },
      {
        /**
         * 商品管理API用のプロキシ設定
         * source: フロントエンド側で呼び出すURL
         * destination: 商品管理APIエンドポイント
         */
        source: '/proxy-api/product/:path*',
        destination: 'http://74.176.217.130/admin/product/:path*',
      },
      {
        /**
         * 商品カテゴリ管理API用のプロキシ設定
         * source: フロントエンド側で呼び出すURL
         * destination: 商品管理APIエンドポイント
         */
        source: '/proxy-api/category/:path*',
        destination: 'http://74.176.217.130/admin/category/:path*',
      },
      {
        /**
         * 購入管理API用のプロキシ設定
         * source: フロントエンド側で呼び出すURL
         * destination: 商品管理APIエンドポイント
         */
        source: '/proxy-api/order/:path*',
        destination: 'http://74.176.217.130/admin/order/:path*',
      },
    ]
  }
};

export default nextConfig;
