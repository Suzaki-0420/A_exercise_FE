import type { NextConfig } from "next";

/**
 * バックエンドAPIの接続先
 *
 * 環境変数API_BASE_URLが設定されている本番環境では、
 * VM内のバックエンドへ直接接続する。
 * 未設定のローカル・CI環境では、公開中のNext.jsを経由して
 * Azure VM上のバックエンドへ接続する。
 *
 * Azure VM本番:
 *   http://127.0.0.1:5000
 */
const apiBaseUrl = process.env.API_BASE_URL;

const deployedApiProxyBaseUrl =
  "https://fullness-stationery.japaneast.cloudapp.azure.com/proxy-api";

const getApiDestination = (
  backendPath: string,
  proxyPath: string,
): string =>
  apiBaseUrl
    ? `${apiBaseUrl}${backendPath}`
    : `${deployedApiProxyBaseUrl}${proxyPath}`;

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
        destination: getApiDestination(
          "/api/admin/auth/:path*",
          "/auth/:path*",
        ),
      },
      {
        /**
         * 担当者アカウントAPI
         */
        source: "/proxy-api/account/:path*",
        destination: getApiDestination(
          "/admin/account/:path*",
          "/account/:path*",
        ),
      },
      {
        /**
         * 商品管理API
         */
        source: "/proxy-api/product/:path*",
        destination: getApiDestination(
          "/admin/product/:path*",
          "/product/:path*",
        ),
      },
      {
        /**
         * 商品カテゴリ管理API
         */
        source: "/proxy-api/category/:path*",
        destination: getApiDestination(
          "/admin/category/:path*",
          "/category/:path*",
        ),
      },
      {
        /**
         * 購入管理API
         */
        source: "/proxy-api/order/:path*",
        destination: getApiDestination(
          "/admin/order/:path*",
          "/order/:path*",
        ),
      },
    ];
  },
};

export default nextConfig;
