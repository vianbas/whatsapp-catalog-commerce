import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
