import type { MetadataRoute } from "next";

import { createClient } from "@/lib/supabase/server";

export const revalidate = 3600;

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient();
  const { data: products } = await supabase
    .from("products")
    .select("slug, updated_at")
    .eq("is_active", true)
    .order("sort_order");

  const productUrls: MetadataRoute.Sitemap = (products ?? []).map((p) => ({
    url: `${BASE}/products/${p.slug}`,
    lastModified: p.updated_at,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [
    { url: BASE, changeFrequency: "monthly", priority: 1 },
    { url: `${BASE}/products`, changeFrequency: "daily", priority: 0.9 },
    ...productUrls,
  ];
}
