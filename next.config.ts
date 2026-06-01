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
