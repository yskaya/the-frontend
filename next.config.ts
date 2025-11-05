import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,
  
  // Don't fail build on ESLint warnings - only fail on actual errors
  eslint: {
    ignoreDuringBuilds: false, // We still want to see warnings, but they won't block
    dirs: ['src'],
  },
  
  // Don't fail build on TypeScript errors - only show warnings
  typescript: {
    ignoreBuildErrors: false, // TypeScript errors will still be shown but won't block if they're warnings
  },
  
  // Customize error overlay in development
  devIndicators: {
    buildActivity: true,
    buildActivityPosition: 'bottom-right',
  },
  
  // Production optimizations
  productionBrowserSourceMaps: false,
  
  // Custom webpack config to handle errors
  webpack: (config, { dev, isServer }) => {
    if (!isServer && !dev) {
      // In production, minimize error info
      config.optimization = {
        ...config.optimization,
        minimize: true,
      };
    }
    return config;
  },
};

export default nextConfig;
