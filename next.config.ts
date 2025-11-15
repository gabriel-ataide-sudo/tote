import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 1. Adicione esta linha para exportação estática
  output: "export",

  // 2. Adicione isso para desabilitar a otimização de imagem
  images: {
    unoptimized: true,
  },

  // 3. Recomendado para o invoke do Tauri funcionar sem problemas
  reactStrictMode: false,
};

export default nextConfig;