import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin/",
        "/dashboard/",
        "/guest/",
        "/realtor/",
        "/settings/",
        "/api/",
        "/booking/",
        "/bookings/",
        "/auth/",
        "/verify-email",
        "/reset-password",
        "/forgot-password",
      ],
    },
    sitemap: "https://www.stayza.pro/sitemap.xml",
  };
}
