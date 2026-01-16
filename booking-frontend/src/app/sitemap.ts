import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    { path: "", priority: 1, changeFrequency: "daily" as const },
    {
      path: "/booking-website-for-realtors",
      priority: 0.95,
      changeFrequency: "weekly" as const,
    },
    { path: "/get-started", priority: 0.9, changeFrequency: "weekly" as const },
    {
      path: "/how-it-works",
      priority: 0.9,
      changeFrequency: "weekly" as const,
    },
    {
      path: "/join-waitlist",
      priority: 0.8,
      changeFrequency: "weekly" as const,
    },
    { path: "/become-host", priority: 0.9, changeFrequency: "weekly" as const },
    {
      path: "/guest-landing",
      priority: 0.8,
      changeFrequency: "weekly" as const,
    },
    { path: "/browse", priority: 0.8, changeFrequency: "daily" as const },
    { path: "/help", priority: 0.6, changeFrequency: "monthly" as const },
    { path: "/privacy", priority: 0.5, changeFrequency: "monthly" as const },
    { path: "/terms", priority: 0.5, changeFrequency: "monthly" as const },
  ];

  return routes.map((route) => ({
    url: `https://stayza.pro${route.path}`,
    lastModified: new Date(),
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
