import type { Metadata } from "next";
import { Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/server";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const DEFAULT_STORE_NAME = "Toko Online";

async function getStoreName(): Promise<string> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("store_settings")
      .select("store_name")
      .maybeSingle();
    return data?.store_name?.trim() || DEFAULT_STORE_NAME;
  } catch {
    return DEFAULT_STORE_NAME;
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const storeName = await getStoreName();
  return {
    // Makes OG/canonical URLs absolute when the site URL is configured.
    ...(process.env.NEXT_PUBLIC_SITE_URL
      ? { metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL) }
      : {}),
    title: {
      default: storeName,
      template: `%s · ${storeName}`,
    },
    description:
      "Belanja online mudah — produk lengkap, pembayaran aman via Midtrans.",
    manifest: "/manifest.webmanifest",
    appleWebApp: {
      capable: true,
      statusBarStyle: "default",
      title: storeName,
    },
    other: {
      "mobile-web-app-capable": "yes",
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn(
        "h-full antialiased font-sans",
        inter.variable,
        geistMono.variable
      )}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
