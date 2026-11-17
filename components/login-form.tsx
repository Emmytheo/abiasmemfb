"use client";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useState } from "react";

export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [adminSecret, setAdminSecret] = useState("");
  const [showAdminSecret, setShowAdminSecret] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;

      // Call set-role with a strict timeout so cold starts never hang login
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 7000);
      let response: Response | null = null;
      try {
        response = await fetch("/api/auth/set-role", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: showAdminSecret && adminSecret ? JSON.stringify({ admin_secret: adminSecret }) : "{}",
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timer);
      }

      const params = new URLSearchParams(window.location.search);
      const requestedRedirect = params.get("redirect");
      const safeRedirect =
        requestedRedirect && requestedRedirect.startsWith("/") && !requestedRedirect.startsWith("//")
          ? requestedRedirect
          : null;

      if (response && response.status === 403) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Invalid staff secret.");
      }

      if (response && response.ok) {
        const data = await response.json();
        if (data.roleChanged) {
          await supabase.auth.refreshSession().catch(() => null);
        }
        const target =
          data.role === "admin"
            ? safeRedirect || "/dashboard"
            : safeRedirect && !safeRedirect.startsWith("/dashboard")
              ? safeRedirect
              : data.redirect || "/client-dashboard";
        window.location.assign(target);
        return;
      }

      window.location.assign(safeRedirect || "/client-dashboard");
    } catch (error: unknown) {
      if (error instanceof Error && error.name === "AbortError") {
        window.location.assign("/client-dashboard");
        return;
      }
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("grid gap-6", className)} {...props}>
          <form onSubmit={handleLogin}>
            <div className="flex flex-col gap-5">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  value={email}
                  className="bg-transparent"
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">Password</Label>
                  <Link
                    href="/auth/forgot-password"
                    className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                  >
                    Forgot your password?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  className="bg-transparent"
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              
              <div className="flex items-center gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setShowAdminSecret(!showAdminSecret)}
                  className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                >
                  <span className="w-3 h-3 flex items-center justify-center border rounded-sm">
                    {showAdminSecret && <span className="w-1.5 h-1.5 bg-current rounded-sm" />}
                  </span>
                  Staff Access (Optional)
                </button>
              </div>

              <div 
                className={cn(
                  "grid gap-2 overflow-hidden transition-all duration-300 ease-in-out",
                  showAdminSecret ? "grid-rows-[1fr] opacity-100 mt-2" : "grid-rows-[0fr] opacity-0 mt-0"
                )}
              >
                <div className="min-h-0">
                  <Label htmlFor="adminSecret" className="text-xs">Admin Secret</Label>
                  <Input
                    id="adminSecret"
                    type="password"
                    placeholder="Enter staff secret..."
                    value={adminSecret}
                    className="bg-transparent mt-1"
                    onChange={(e) => setAdminSecret(e.target.value)}
                  />
                  <p className="text-[10px] text-muted-foreground mt-1.5">
                    Only required for bank personnel seeking dashboard access.
                  </p>
                </div>
              </div>

              {error && <p className="text-sm text-red-500">{error}</p>}
              <Button type="submit" className="w-full mt-2" disabled={isLoading}>
                {isLoading ? "Logging in..." : "Login"}
              </Button>
            </div>
            <div className="mt-6 text-center text-sm text-muted-foreground text-balance">
              Don&apos;t have an account?{" "}
              <Link
                href="/auth/sign-up"
                className="underline underline-offset-4 hover:text-foreground text-foreground"
              >
                Sign up
              </Link>
            </div>
          </form>
    </div>
  );
}
