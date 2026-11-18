import type { NextConfig } from "next";
import path from "path";
import { fileURLToPath } from "url";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  turbopack: {
    root: projectRoot,
  },
  // Anexos de até 10MB passam por Server Action (achado #8): o padrão é 1MB
  // nas actions e 10MB no buffer do proxy; folga para o overhead multipart.
  experimental: {
    serverActions: { bodySizeLimit: "11mb" },
    proxyClientMaxBodySize: "11mb",
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
