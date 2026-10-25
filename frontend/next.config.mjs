/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  reactCompiler: true,

  experimental: {
    serverSourceMaps: false,
  },


  turbopack: {},
  

  webpack(config) {
    config.devtool = false; // Disable source maps if needed
    return config;
  },
};

export default nextConfig;
