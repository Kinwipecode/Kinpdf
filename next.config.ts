import type { NextConfig } from "next";

const BASE_PATH = '/Kinpdf';

const nextConfig: NextConfig = {
  // Static export for GitHub Pages
  output: 'export',
  // Match the repository name
  basePath: BASE_PATH,
  // Match the repository name for assets
  assetPrefix: `${BASE_PATH}/`,
  // Environment variables
  env: {
    NEXT_PUBLIC_BASE_PATH: BASE_PATH,
  },
  // Turbopack config (Next.js 16+)
  turbopack: {
    resolveAlias: {
      canvas: { browser: "./empty-module.js" },
    },
  },
  transpilePackages: ['pdfjs-dist'],
  images: {
    unoptimized: true, // Required for static export
  },
};

export default nextConfig;
