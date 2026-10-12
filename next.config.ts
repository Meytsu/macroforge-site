import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ninguém enquadra o site num iframe (clickjacking — achado do pentest de 2026-10-11). A CSP aqui tem SÓ
  // `frame-ancestors`: não restringe scripts, imagens nem os vídeos do YouTube que a landing embute.
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
        ],
      },
    ];
  },
};

export default nextConfig;
