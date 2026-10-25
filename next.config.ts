import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static concept landings live in public/projetos/<name>/index.html.
  async rewrites() {
    return [{ source: "/projetos/:name", destination: "/projetos/:name/index.html" }];
  },
};

export default nextConfig;
