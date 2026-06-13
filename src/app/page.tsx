import Link from "next/link"
import { ArrowRight, MessageCircle, ShieldCheck, ShoppingBag, Star, Truck } from "lucide-react"

import { Button } from "@/components/ui/button"
import { ProductCard } from "@/components/product-card"
import { CartIndicator } from "@/components/cart-indicator"
import { CustomerNav } from "@/components/customer-nav"
import { createClient } from "@/lib/supabase/server"
import type { Category, Product } from "@/lib/types"

export const dynamic = "force-dynamic"

async function getLandingData(): Promise<{
  storeName: string
  whatsappNumber: string | null
  featuredProducts: Product[]
  categories: Pick<Category, "id" | "name" | "slug">[]
}> {
  try {
    const supabase = await createClient()
    const [settingsRes, productsRes, categoriesRes] = await Promise.all([
      supabase.from("store_settings").select("store_name, whatsapp_number").maybeSingle(),
      supabase
        .from("products")
        .select("*")
        .eq("is_active", true)
        .eq("is_featured", true)
        .order("sort_order", { ascending: true })
        .limit(8),
      supabase
        .from("categories")
        .select("id, name, slug")
        .eq("is_active", true)
        .order("sort_order", { ascending: true })
        .limit(8),
    ])
    return {
      storeName: settingsRes.data?.store_name?.trim() || "Toko Online",
      whatsappNumber: settingsRes.data?.whatsapp_number ?? null,
      featuredProducts: (productsRes.data as Product[] | null) ?? [],
      categories: (categoriesRes.data as Pick<Category, "id" | "name" | "slug">[] | null) ?? [],
    }
  } catch {
    return { storeName: "Toko Online", whatsappNumber: null, featuredProducts: [], categories: [] }
  }
}

export default async function Home() {
  const { storeName, whatsappNumber, featuredProducts, categories } = await getLandingData()

  return (
    <div className="flex flex-1 flex-col">
      {/* Sticky nav */}
      <header className="bg-background/95 supports-[backdrop-filter]:bg-background/80 sticky top-0 z-10 border-b backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
          <Link href="/" className="text-lg font-semibold tracking-tight">
            {storeName}
          </Link>
          <div className="flex items-center gap-3">
            <CustomerNav />
            <CartIndicator />
          </div>
        </div>
      </header>

      <main className="flex flex-1 flex-col">
        {/* Hero */}
        <section className="bg-muted/40 border-b">
          <div className="mx-auto flex max-w-5xl flex-col items-center gap-6 px-6 py-16 text-center sm:py-24">
            <span className="bg-primary/10 text-primary inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium">
              <ShoppingBag className="size-3.5" aria-hidden />
              Belanja mudah, langsung dari rumah
            </span>
            <div className="space-y-3">
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
                {storeName}
              </h1>
              <p className="text-muted-foreground mx-auto max-w-xl text-lg">
                Temukan produk terbaik kami. Pembayaran aman, pengiriman ke seluruh Indonesia.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/products">
                  <ShoppingBag className="size-4" aria-hidden />
                  Belanja Sekarang
                </Link>
              </Button>
              {whatsappNumber && (
                <Button asChild size="lg" variant="outline">
                  <a
                    href={`https://wa.me/${whatsappNumber}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <MessageCircle className="size-4" aria-hidden />
                    Tanya via WhatsApp
                  </a>
                </Button>
              )}
            </div>
          </div>
        </section>

        {/* Trust badges */}
        <section className="border-b">
          <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 px-6 py-10 sm:grid-cols-3">
            <div className="flex items-start gap-3">
              <ShieldCheck className="text-primary mt-0.5 size-5 shrink-0" aria-hidden />
              <div>
                <p className="text-sm font-medium">Pembayaran Aman</p>
                <p className="text-muted-foreground mt-0.5 text-xs">
                  Pilihan metode pembayaran yang mudah dan terpercaya
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Truck className="text-primary mt-0.5 size-5 shrink-0" aria-hidden />
              <div>
                <p className="text-sm font-medium">Kirim ke Seluruh Indonesia</p>
                <p className="text-muted-foreground mt-0.5 text-xs">
                  Pilih kurir favoritmu — pesanan diproses cepat
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MessageCircle className="text-primary mt-0.5 size-5 shrink-0" aria-hidden />
              <div>
                <p className="text-sm font-medium">Layanan via WhatsApp</p>
                <p className="text-muted-foreground mt-0.5 text-xs">
                  Ada pertanyaan? Chat langsung dengan kami kapan saja
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Categories */}
        {categories.length > 0 && (
          <section className="border-b">
            <div className="mx-auto max-w-5xl px-6 py-10">
              <h2 className="mb-4 text-xl font-semibold tracking-tight">Kategori</h2>
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <Button key={cat.id} asChild variant="outline" size="sm">
                    <Link href={`/categories/${cat.slug}`}>{cat.name}</Link>
                  </Button>
                ))}
                <Button asChild variant="ghost" size="sm">
                  <Link href="/products" className="text-muted-foreground">
                    Lihat semua
                    <ArrowRight className="size-3.5" aria-hidden />
                  </Link>
                </Button>
              </div>
            </div>
          </section>
        )}

        {/* Featured products */}
        {featuredProducts.length > 0 && (
          <section className="border-b">
            <div className="mx-auto max-w-5xl px-6 py-10">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-xl font-semibold tracking-tight">
                  <Star className="size-4" aria-hidden />
                  Produk Unggulan
                </h2>
                <Link
                  href="/products?sort=featured"
                  className="text-muted-foreground flex items-center gap-1 text-sm hover:underline"
                >
                  Lihat semua
                  <ArrowRight className="size-3.5" aria-hidden />
                </Link>
              </div>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {featuredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Bottom CTA */}
        <section className="mt-auto">
          <div className="mx-auto flex max-w-5xl flex-col items-center gap-4 px-6 py-14 text-center">
            <h2 className="text-2xl font-semibold tracking-tight">Siap belanja?</h2>
            <p className="text-muted-foreground max-w-sm text-sm">
              Temukan semua produk kami dan dapatkan penawaran terbaik.
            </p>
            <Button asChild size="lg">
              <Link href="/products">
                <ShoppingBag className="size-4" aria-hidden />
                Lihat Semua Produk
              </Link>
            </Button>
          </div>
        </section>
      </main>
    </div>
  )
}
