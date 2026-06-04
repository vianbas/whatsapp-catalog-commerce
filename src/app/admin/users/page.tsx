import type { Metadata } from "next";

import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { UserRoleSelect } from "@/components/user-role-select";
import { createClient } from "@/lib/supabase/server";
import type { AdminUser } from "@/lib/types";

export const metadata: Metadata = { title: "Users" };
export const dynamic = "force-dynamic";

const dateFormatter = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" });

async function getUsers(): Promise<{ users: AdminUser[]; currentUserId: string | null }> {
  try {
    const supabase = await createClient();
    const [{ data }, { data: auth }] = await Promise.all([
      supabase.rpc("list_users"),
      supabase.auth.getUser(),
    ]);
    return {
      users: (data as AdminUser[] | null) ?? [],
      currentUserId: auth.user?.id ?? null,
    };
  } catch {
    return { users: [], currentUserId: null };
  }
}

export default async function AdminUsersPage() {
  const { users, currentUserId } = await getUsers();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
        <p className="text-muted-foreground text-sm">
          Manage who can access the admin. Admins can manage the catalog,
          settings, and orders.
        </p>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="w-40 text-right">Role</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-muted-foreground py-10 text-center text-sm"
                >
                  No users found.
                </TableCell>
              </TableRow>
            ) : (
              users.map((u) => {
                const isSelf = u.id === currentUserId;
                return (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">
                      {u.email}
                      {isSelf && (
                        <Badge variant="secondary" className="ml-2">
                          You
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {u.full_name ?? "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {dateFormatter.format(new Date(u.created_at))}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end">
                        <UserRoleSelect
                          id={u.id}
                          role={u.role}
                          disabled={isSelf}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
