"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Mail } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { createClient } from "@/lib/supabase/client";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  // Seed from ?error=auth bounced back by /auth/callback; cleared on next action.
  const [error, setError] = React.useState<string | null>(() =>
    searchParams.get("error") === "auth"
      ? "That sign-in link was invalid or has expired. Try again."
      : null
  );
  const [info, setInfo] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [linkLoading, setLinkLoading] = React.useState(false);
  const [resetLoading, setResetLoading] = React.useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);
    try {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInError) {
        setError(signInError.message);
        return;
      }
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user!.id)
        .maybeSingle();
      const isStaff = profile?.role === "admin" || profile?.role === "staff";
      const dest = isStaff
        ? "/admin"
        : (searchParams.get("redirectedFrom") ?? "/orders");
      router.push(dest);
      router.refresh();
    } catch {
      setError("Unable to sign in. Check your Supabase configuration.");
    } finally {
      setLoading(false);
    }
  }

  async function handleMagicLink() {
    setError(null);
    setInfo(null);
    if (!email) {
      setError("Enter your email first, then request a link.");
      return;
    }
    setLinkLoading(true);
    try {
      const supabase = createClient();
      const nextPath = searchParams.get("redirectedFrom") ?? "/orders";
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${nextPath}`,
        },
      });
      if (otpError) {
        setError(otpError.message);
        return;
      }
      setInfo("Check your email for a login link.");
    } catch {
      setError("Unable to send the link. Check your Supabase configuration.");
    } finally {
      setLinkLoading(false);
    }
  }

  async function handleResetPassword() {
    setError(null);
    setInfo(null);
    if (!email) {
      setError("Enter your email first, then request a reset.");
      return;
    }
    setResetLoading(true);
    try {
      const supabase = createClient();
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email,
        {
          redirectTo: `${window.location.origin}/auth/callback?next=/auth/update-password`,
        }
      );
      if (resetError) {
        setError(resetError.message);
        return;
      }
      setInfo("Check your email to reset your password.");
    } catch {
      setError("Unable to send the reset email. Check your Supabase configuration.");
    } finally {
      setResetLoading(false);
    }
  }

  return (
    <main className="flex flex-1 items-center justify-center px-6 py-12">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Sign in</CardTitle>
          <CardDescription>
            Sign in to track your orders or manage the store.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <button
                  type="button"
                  onClick={handleResetPassword}
                  disabled={resetLoading}
                  className="text-muted-foreground text-xs hover:text-foreground hover:underline disabled:opacity-50"
                >
                  {resetLoading ? "Sending…" : "Forgot password?"}
                </button>
              </div>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {info && (
              <Alert>
                <AlertDescription>{info}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="size-4 animate-spin" />}
              Sign in
            </Button>
          </form>

          <div className="flex items-center gap-3">
            <Separator className="flex-1" />
            <span className="text-muted-foreground text-xs">or</span>
            <Separator className="flex-1" />
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={handleMagicLink}
            disabled={linkLoading}
          >
            {linkLoading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Mail className="size-4" aria-hidden />
            )}
            Email me a login link
          </Button>

          <p className="text-muted-foreground text-center text-sm">
            New here?{" "}
            <Link href="/register" className="underline hover:text-foreground">
              Create an account
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}

export default function LoginPage() {
  return (
    <React.Suspense>
      <LoginForm />
    </React.Suspense>
  );
}
