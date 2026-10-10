import bundleAnalyzer from "@next/bundle-analyzer";
import path from "node:path";
import { fileURLToPath } from "node:url";

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
  openAnalyzer: false,
});

const rootDir = path.dirname(fileURLToPath(import.meta.url));
const blockedServerPackage = path.join(rootDir, "lib/blocked-server-package.ts");

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Output standalone for Docker deployment
  output: "standalone",
  images: {
    unoptimized: true,
  },
  // Keep the Mongo driver out of the server bundle, and alias it away from
  // the client bundle. Ids in the UI use lib/object-id.ts.
  serverExternalPackages: ["mongoose", "mongodb"],
  turbopack: {
    resolveAlias: {
      mongoose: "./lib/blocked-server-package.ts",
      mongodb: "./lib/blocked-server-package.ts",
    },
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        mongoose: blockedServerPackage,
        mongodb: blockedServerPackage,
      };
    }
    return config;
  },
};

export default withBundleAnalyzer(nextConfig);
