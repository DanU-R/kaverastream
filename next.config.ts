import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["playwright"],
  env: {
    DISPLAY: process.env.DISPLAY || ":99",
  },
};

export default nextConfig;
