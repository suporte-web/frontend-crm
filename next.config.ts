import type { NextConfig } from 'next';

const backendInternalUrl =
  process.env.BACKEND_INTERNAL_URL || 'http://127.0.0.1:3001';

const nextConfig: NextConfig = {
  experimental: {
    // Até 20 anexos de 20 MB, mais os campos e delimitadores multipart.
    proxyClientMaxBodySize: '401mb',
    // Evita o crescimento do cache de desenvolvimento em disco.
    turbopackFileSystemCacheForDev: false,
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${backendInternalUrl}/api/:path*`,
      },
      {
        source: '/docs/:path*',
        destination: `${backendInternalUrl}/docs/:path*`,
      },
    ];
  },
};

export default nextConfig;
