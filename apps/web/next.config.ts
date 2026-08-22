import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@erilog/schemas', '@erilog/crypto', '@erilog/reconcile'],
};

export default nextConfig;
