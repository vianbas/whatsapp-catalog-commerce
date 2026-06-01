import Link from "next/link";
import { redirect } from "next/navigation";

import { AdminSidebar } from "@/components/admin-sidebar";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Defense in depth: `proxy.ts` already gates `/admin`, but we re-check here
  // so the layout never renders for an unauthenticated request. Resolve auth
  // first, then redirect outside the try so the control-flow throw isn't caught.
  let authenticated = false;
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    authenticated = !!user;
  } catch {
    authenticated = false;
  }
  if (!authenticated) redirect("/login");

  return (
    <div className="flex min-h-screen flex-1">
      <aside className="bg-sidebar text-sidebar-foreground hidden w-60 shrink-0 flex-col border-r p-4 md:flex">
        <Link href="/admin" className="mb-6 px-3 text-sm font-semibold">
          Catalog Admin
        </Link>
        <AdminSidebar />
      </aside>
      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b px-6 py-3 md:hidden">
          <Link href="/admin" className="text-sm font-semibold">
            Catalog Admin
          </Link>
          <Link href="/products" className="text-muted-foreground text-sm">
            View store
          </Link>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
