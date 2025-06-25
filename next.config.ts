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
  webpack: (config, { isServer }) => {
    return config;
  },
};

export default nextConfig;
