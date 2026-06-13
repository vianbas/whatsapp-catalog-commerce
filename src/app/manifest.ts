import type { MetadataRoute } from "next"
import { createClient } from "@/lib/supabase/server"

const DEFAULT_STORE_NAME = "Toko Online"

async function getStoreName(): Promise<string> {
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from("store_settings")
      .select("store_name")
      .maybeSingle()
    return data?.store_name?.trim() || DEFAULT_STORE_NAME
  } catch {
    return DEFAULT_STORE_NAME
  }
}

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const storeName = await getStoreName()
  return {
    name: storeName,
    short_name: storeName.split(" ").slice(0, 2).join(" "),
    description: "Belanja online mudah — produk lengkap, pembayaran aman via Midtrans.",
    start_url: "/products",
    display: "standalone",
    orientation: "portrait",
    background_color: "#ffffff",
    theme_color: "#18181b",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
    ],
  }
}
