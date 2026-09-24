import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Migration SQL files are read at runtime to bootstrap the database.
  outputFileTracingIncludes: {
    "/**": ["./drizzle/**/*"],
  },
  serverExternalPackages: ["@libsql/client", "libsql"],
  images: {
    formats: ["image/avif", "image/webp"],
    qualities: [70, 80, 90],
    localPatterns: [{ pathname: "/renders/**" }, { pathname: "/media/**" }],
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "@react-three/drei"],
  },
};

export default nextConfig;
