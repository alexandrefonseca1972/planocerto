import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
