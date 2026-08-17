import type { NextConfig } from "next";
import path from "path";
import { fileURLToPath } from "url";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  turbopack: {
    root: projectRoot,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "www.gravatar.com",
      },
    ],
  },
  async redirects() {
    return [
      { source: "/plano", destination: "/planos", permanent: true },
      { source: "/plano/:path*", destination: "/planos/:path*", permanent: true },
    ];
  },
};

export default nextConfig;
