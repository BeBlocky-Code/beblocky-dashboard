/** @type {import('next').NextConfig} */
const nextConfig = {
  // Output standalone for Docker deployment
  output: "standalone",
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
