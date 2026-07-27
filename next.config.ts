import type {
  NextConfig,
} from "next";

/**
 * Azure VM本番では、
 * VM内部のバックエンドへ直接接続する。
 *
 * ローカル・CIでは、
 * 公開中のNext.jsのプロキシを経由する。
 */
const apiBaseUrl =
  process.env.API_BASE_URL;

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

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname:
          "trainingstorage20260713.blob.core.windows.net",
        port: "",
        pathname:
          "/product-images/products/**",
      },
    ],
  },

  async rewrites() {
    return [
      {
        source:
          "/proxy-api/auth/:path*",
        destination:
          getApiDestination(
            "/api/admin/auth/:path*",
            "/auth/:path*",
          ),
      },
      {
        source:
          "/proxy-api/account/:path*",
        destination:
          getApiDestination(
            "/admin/account/:path*",
            "/account/:path*",
          ),
      },
      {
        source:
          "/proxy-api/product/:path*",
        destination:
          getApiDestination(
            "/admin/product/:path*",
            "/product/:path*",
          ),
      },
      {
        source:
          "/proxy-api/category/:path*",
        destination:
          getApiDestination(
            "/admin/category/:path*",
            "/category/:path*",
          ),
      },
      {
        source:
          "/proxy-api/order/:path*",
        destination:
          getApiDestination(
            "/admin/order/:path*",
            "/order/:path*",
          ),
      },
    ];
  },
};

export default nextConfig;