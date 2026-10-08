import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",

  basePath: "/labelpro",
  assetPrefix: "/labelpro/",

  images: {
    unoptimized: true,
  },

  trailingSlash: true,
};

export default nextConfig;
