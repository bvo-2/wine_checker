import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Bottle shots come from WineAPI's image hosts, which we don't know in advance,
  // so images are plain <img> tags rather than next/image.
};

export default nextConfig;
