import type { MetadataRoute } from "next";
import { MARKETPLACE_HOST } from "@/lib/races";

export default function robots(): MetadataRoute.Robots {
  const base = `https://${MARKETPLACE_HOST}`;

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/auth/", "/cuenta", "/onboarding"],
    },
    sitemap: `${base}/sitemap.xml`,
    host: MARKETPLACE_HOST,
  };
}
