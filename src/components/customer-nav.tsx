import Link from "next/link"

import { createClient } from "@/lib/supabase/server"
import { SignOutButton } from "@/components/sign-out-button"

export async function CustomerNav() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return (
      <>
        <Link href="/login" className="text-muted-foreground text-sm hover:underline">
          Sign in
        </Link>
        <Link href="/register" className="text-muted-foreground text-sm hover:underline">
          Register
        </Link>
      </>
    )
  }

  return (
    <>
      <Link href="/orders" className="text-muted-foreground text-sm hover:underline">
        My Orders
      </Link>
      <SignOutButton className="text-muted-foreground text-sm hover:underline" />
    </>
  )
}
