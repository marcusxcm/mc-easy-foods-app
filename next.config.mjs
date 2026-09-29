/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: '/mc-easy-foods-app',
  assetPrefix: '/mc-easy-foods-app/',
  trailingSlash: true,
  experimental: { typedRoutes: false }
};

export default nextConfig;
