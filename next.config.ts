import type { NextConfig } from "next";
import { BASE_PATH } from "./lib/base-path";

const nextConfig: NextConfig = {
  basePath: BASE_PATH,
  cacheComponents: true,
  partialPrefetching: true,
  async redirects() {
    // Until a main website owns the domain root, send visitors straight to the demo.
    // Some browsers and link-preview services request icons at the domain root, outside the base path.
    return [
      { source: "/", destination: BASE_PATH, basePath: false, permanent: false },
      { source: "/favicon.ico", destination: `${BASE_PATH}/icon.svg`, basePath: false, permanent: false },
      { source: "/apple-touch-icon.png", destination: `${BASE_PATH}/brand/apple-icon`, basePath: false, permanent: false },
      { source: "/apple-touch-icon-precomposed.png", destination: `${BASE_PATH}/brand/apple-icon`, basePath: false, permanent: false },
    ];
  },
};

export default nextConfig;
