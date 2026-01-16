import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin/",
        "/guest/",
        "/realtor/",
        "/api/",
        "/auth/",
        "/verify-email",
        "/reset-password",
        "/forgot-password",
      ],
    },
    sitemap: "https://stayza.pro/sitemap.xml",
  };
}
