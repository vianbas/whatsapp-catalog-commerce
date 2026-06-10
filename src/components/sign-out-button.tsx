"use client"

import { signOut } from "@/app/actions"

export function SignOutButton({ className }: { className?: string }) {
  return (
    <form action={signOut}>
      <button type="submit" className={className}>
        Sign out
      </button>
    </form>
  )
}
