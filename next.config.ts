import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // NEXT_PUBLIC_* vars are browser-visible by design — safe to commit.
  // This ensures they are baked into the client bundle at build time regardless
  // of whether the CI environment (Cloudflare Builds) exposes them via env.
  env: {
    NEXT_PUBLIC_SUPABASE_URL: "https://mgotkijtzksviuqrkbew.supabase.co",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "sb_publishable_VRIK_TUZdjwywmz2-P9RBw_o3sz0K-T",
    NEXT_PUBLIC_STORE_WHATSAPP_NUMBER: "6281234567890",
    // Midtrans client-side key — set via env at build time (e.g. Cloudflare Builds secret).
    // Leave empty to disable the "Pay Online" button entirely.
    NEXT_PUBLIC_MIDTRANS_CLIENT_KEY: process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY ?? "",
    NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION: process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION ?? "false",
  },
  images: {
    // Product images are served from Supabase Storage public URLs.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;

// Enables Cloudflare bindings (KV, R2, etc.) during `next dev` only.
if (process.env.NODE_ENV === "development") {
  import("@opennextjs/cloudflare").then((m) => m.initOpenNextCloudflareForDev());
}
