/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    typedRoutes: true,
  },
  images: {
    domains: [
      'pbs.twimg.com',
      'abs.twimg.com',
      'avatars.githubusercontent.com',
    ],
  },
  webpack: (config: { resolve: { fallback: any } }) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    }
    return config
  },
}

module.exports = nextConfig