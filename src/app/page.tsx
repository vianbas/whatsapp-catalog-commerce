import Link from "next/link";
import { ArrowRight, MessageCircle, ShoppingBag } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col">
      <section className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center gap-8 px-6 py-24 text-center">
        <span className="bg-muted text-muted-foreground inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium">
          <MessageCircle className="size-3.5" aria-hidden />
          Chat & confirm via WhatsApp
        </span>

        <div className="space-y-4">
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            A simple catalog storefront for WhatsApp sellers
          </h1>
          <p className="text-muted-foreground mx-auto max-w-xl text-lg">
            Browse the catalog, pick what you want, and pay online via Midtrans
            — card, GoPay, QRIS, or bank transfer. Have a question? Chat with
            us on WhatsApp anytime.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button asChild size="lg">
            <Link href="/products">
              <ShoppingBag className="size-4" aria-hidden />
              Browse products
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/admin">
              Admin dashboard
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
