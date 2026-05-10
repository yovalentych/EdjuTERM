import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@svar-ui/react-gantt", "@svar-ui/react-core", "@svar-ui/gantt-store"],
};

export default nextConfig;
