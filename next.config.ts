import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/share/:id',
        destination: '/result/:id',
      },
      {
        source: '/shared/:id',
        destination: '/result/:id',
      },
    ];
  },
  async redirects() {
    return [
      {
        source: '/shared',
        destination: '/',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
