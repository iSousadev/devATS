import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,

  // Permitir requisições de outros dispositivos na rede local durante desenvolvimento
  allowedDevOrigins: [
    "localhost",
    "127.0.0.1",
    "192.168.1.16", // IP específico da rede local
  ] as string[],
};

export default nextConfig;
