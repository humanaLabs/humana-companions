import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {
    ppr: true,
  },
  images: {
    remotePatterns: [
      {
        hostname: 'avatar.vercel.sh',
      },
    ],
  },
  // Força o uso do Webpack ao invés do Turbopack
  webpack: (config, { isServer, webpack }) => {
    // Configuração para lidar com bibliotecas de processamento de documentos
    if (isServer) {
      // Ignora arquivos de exemplo/teste das bibliotecas
      config.externals = config.externals || [];
      config.externals.push({
        'test/data/05-versions-space.pdf': 'empty',
      });
    }

    // Configuração adicional para fallbacks
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
    };

    return config;
  },
};

export default nextConfig;
