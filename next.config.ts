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
  // Headers de segurança estáticos (complementam a CSP por-requisição do proxy.ts).
  // A CSP/frame-ancestors é definida no proxy; X-Frame-Options aqui é o fallback
  // para navegadores antigos. anti-clickjacking + anti-sniffing + referrer + HSTS.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
