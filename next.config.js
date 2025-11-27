/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'teatro.az',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: 'teatro.az',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.teatro.az',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        pathname: '/**',
      },
    ],
    unoptimized: false,
  },
}

module.exports = nextConfig



