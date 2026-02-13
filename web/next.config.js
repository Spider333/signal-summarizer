/** @type {import('next').NextConfig} */
const nextConfig = {
  // Removed 'output: export' to enable API routes for server-side authentication
  images: {
    unoptimized: true
  }
}

module.exports = nextConfig
