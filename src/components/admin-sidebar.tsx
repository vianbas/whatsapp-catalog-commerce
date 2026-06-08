"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  LayoutDashboard,
  LogOut,
  Package,
  ShoppingBag,
  Star,
  Store,
  Tag,
  Tags,
  Users,
  type LucideIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"

const NAV: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/categories", label: "Categories", icon: Tags },
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { href: "/admin/discounts", label: "Discounts", icon: Tag },
  { href: "/admin/reviews", label: "Reviews", icon: Star },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/settings", label: "Settings", icon: Store },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }

  return (
    <nav className="flex h-full flex-col gap-1" aria-label="Admin navigation">
      {NAV.map(({ href, label, icon: Icon }) => {
        // Exact match for the dashboard root, prefix match for sections.
        const isActive =
          href === "/admin"
            ? pathname === "/admin"
            : pathname.startsWith(href)

        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
            )}
          >
            <Icon className="size-4" aria-hidden />
            {label}
          </Link>
        )
      })}

      <Button
        type="button"
        variant="ghost"
        onClick={handleSignOut}
        className="text-sidebar-foreground/70 hover:text-sidebar-foreground mt-auto justify-start gap-3 px-3"
      >
        <LogOut className="size-4" aria-hidden />
        Sign out
      </Button>
    </nav>
  )
}
