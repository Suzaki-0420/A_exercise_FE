import type { NextConfig } from "next";

/**
 * バックエンドAPIの接続先
 *
 * ローカル開発:
 * .env.local の API_BASE_URL を使用する
 *
 * 本番ビルド:
 * GitHub Actionsで設定した API_BASE_URL を使用する
 *
 * 未設定時:
 * ローカル開発用のURLへフォールバックする
 */
const apiBaseUrl = process.env.API_BASE_URL ?? "http://127.0.0.1:5000";

const nextConfig: NextConfig = {
  output: "standalone",

  /**
   * Azure Blob Storage上の商品画像を
   * next/imageで表示するための許可設定
   */
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "trainingstorage20260713.blob.core.windows.net",
        port: "",
        pathname: "/product-images/products/**",
      },
    ],
  },

  /**
   * フロントエンドの /proxy-api へのリクエストを
   * バックエンドAPIへ転送する
   */
  async rewrites() {
    return [
      {
        /**
         * 担当者認証API
         *
         * 例:
         * /proxy-api/auth/login
         * ↓
         * /api/admin/auth/login
         */
        source: "/proxy-api/auth/:path*",
        destination: `${apiBaseUrl}/api/admin/auth/:path*`,
      },
      {
        /**
         * 担当者アカウントAPI
         */
        source: "/proxy-api/account/:path*",
        destination: `${apiBaseUrl}/admin/account/:path*`,
      },
      {
        /**
         * 商品管理API
         */
        source: "/proxy-api/product/:path*",
        destination: `${apiBaseUrl}/admin/product/:path*`,
      },
      {
        /**
         * 商品カテゴリ管理API
         */
        source: "/proxy-api/category/:path*",
        destination: `${apiBaseUrl}/admin/category/:path*`,
      },
      {
        /**
         * 購入管理API
         */
        source: "/proxy-api/order/:path*",
        destination: `${apiBaseUrl}/admin/order/:path*`,
      },
    ];
  },
};

export default nextConfig;
