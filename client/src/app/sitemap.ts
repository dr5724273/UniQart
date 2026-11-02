import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  // Only the public homepage is a search landing page; account pages are omitted.
  return [{ url: "https://www.myuniqart.com/" }];
}
