"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { createClient } from "@/lib/supabase/server"
import type { UserRole } from "@/lib/types"

export type ActionResult = { error: string } | void

const ROLES: UserRole[] = ["admin", "staff"]

export async function updateUserRole(
  id: string,
  role: UserRole
): Promise<ActionResult> {
  if (!ROLES.includes(role)) return { error: "Invalid role" }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  // Guard against self-lockout: an admin can't change their own role here.
  if (user.id === id) {
    return { error: "You can't change your own role." }
  }

  // RLS (profiles_admin_update) is the real gate; this just gives a clean error.
  const { error } = await supabase
    .from("profiles")
    .update({ role })
    .eq("id", id)
  if (error) return { error: error.message }

  revalidatePath("/admin/users")
}
