import type { NextConfig } from "next";

/**
 * バックエンドAPIの接続先
 *
 * 環境変数API_BASE_URLが設定されている場合は、その値を使用する。
 * 未設定の場合は、Azure VMのパブリックIPを使用する。
 *
 * ローカル・CI:
 *   http://74.176.217.130
 *
 * Azure VM本番:
 *   http://127.0.0.1:5000
 */
const apiBaseUrl =
  process.env.API_BASE_URL ??
  "http://74.176.217.130";

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
        hostname:
          "trainingstorage20260713.blob.core.windows.net",
        port: "",
        pathname: "/product-images/products/**",
      },
    ],
  },

  /**
   * フロントエンドからバックエンドAPIへ
   * リクエストを転送するための設定
   */
  async rewrites() {
    return [
      {
        /**
         * 担当者認証API
         */
        source: "/proxy-api/auth/:path*",
        destination:
          `${apiBaseUrl}/api/admin/auth/:path*`,
      },
      {
        /**
         * 担当者アカウントAPI
         */
        source: "/proxy-api/account/:path*",
        destination:
          `${apiBaseUrl}/admin/account/:path*`,
      },
      {
        /**
         * 商品管理API
         */
        source: "/proxy-api/product/:path*",
        destination:
          `${apiBaseUrl}/admin/product/:path*`,
      },
      {
        /**
         * 商品カテゴリ管理API
         */
        source: "/proxy-api/category/:path*",
        destination:
          `${apiBaseUrl}/admin/category/:path*`,
      },
      {
        /**
         * 購入管理API
         */
        source: "/proxy-api/order/:path*",
        destination:
          `${apiBaseUrl}/admin/order/:path*`,
      },
    ];
  },
};

export default nextConfig;
