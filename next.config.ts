import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/shared/:id',
        destination: '/share/:id',
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
