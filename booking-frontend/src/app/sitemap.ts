import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://www.stayza.pro";
  const now = new Date();

  const routes = [
    // High priority marketing pages
    { path: "/en", priority: 1, changeFrequency: "weekly" as const },
    {
      path: "/join-waitlist",
      priority: 0.9,
      changeFrequency: "weekly" as const,
    },
    {
      path: "/booking-website-for-realtors",
      priority: 0.9,
      changeFrequency: "weekly" as const,
    },
    {
      path: "/how-it-works",
      priority: 0.85,
      changeFrequency: "weekly" as const,
    },
    {
      path: "/get-started",
      priority: 0.85,
      changeFrequency: "weekly" as const,
    },

    // Secondary pages
    {
      path: "/guest-landing",
      priority: 0.7,
      changeFrequency: "weekly" as const,
    },
    {
      path: "/guest/browse",
      priority: 0.7,
      changeFrequency: "daily" as const,
    },

    // Support pages
    { path: "/help", priority: 0.6, changeFrequency: "monthly" as const },

    // Legal pages
    {
      path: "/legal/privacy",
      priority: 0.5,
      changeFrequency: "monthly" as const,
    },
    {
      path: "/legal/terms",
      priority: 0.5,
      changeFrequency: "monthly" as const,
    },
  ];

  return routes.map((route) => ({
    url: `${baseUrl}${route.path}`,
    lastModified: now,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
