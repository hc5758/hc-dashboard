/** @type {import('next').NextConfig} */
const nextConfig = {
  images: { unoptimized: true },
  experimental: { serverActions: { allowedOrigins: ['*'] } },
}
module.exports = nextConfig
