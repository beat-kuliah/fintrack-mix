/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Fix hot reload di WSL/Windows
  webpackDevMiddleware: (config) => {
    config.watchOptions = {
      poll: 1000, // Check for changes every second
      aggregateTimeout: 300, // Delay before rebuilding once the first file changed
    }
    return config
  },
}

module.exports = nextConfig

