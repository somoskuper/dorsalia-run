import type { NextConfig } from "next";

const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || "https://portal.dorsalia.run").replace(/\/$/, "");

const nextConfig: NextConfig = {
  output: "standalone",
  async rewrites() {
    if (process.env.NODE_ENV === "production") return [];
    return ["auth", "rest", "storage", "realtime"].map((service) => ({
      source: `/${service}/v1/:path*`,
      destination: `${supabaseUrl}/${service}/v1/:path*`,
    }));
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "**" },
    ],
  },
};

export default nextConfig;
