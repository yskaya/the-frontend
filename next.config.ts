import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,
  
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
