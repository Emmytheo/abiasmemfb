"use client";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ChevronDown, ChevronUp, ShieldCheck } from "lucide-react";

export function SignUpForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [adminSecret, setAdminSecret] = useState("");
  const [showStaffAccess, setShowStaffAccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    if (password !== repeatPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/confirm`,
          data: {
            role: "user",
            ...(adminSecret ? { admin_secret: adminSecret } : {}),
          },
        },
      });
      if (error) throw error;
      router.push("/auth/sign-up-success");
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("grid gap-6", className)} {...props}>
          <form onSubmit={handleSignUp}>
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
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="repeat-password">Repeat Password</Label>
                </div>
                <Input
                  id="repeat-password"
                  type="password"
                  required
                  value={repeatPassword}
                  className="bg-transparent"
                  onChange={(e) => setRepeatPassword(e.target.value)}
                />
              </div>

              {/* Staff Access Section */}
              <div className="border-t pt-3 mt-1">
                <button
                  type="button"
                  onClick={() => setShowStaffAccess(!showStaffAccess)}
                  className="flex items-center justify-between w-full text-sm text-muted-foreground hover:text-foreground transition-colors py-1"
                >
                  <span className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4" />
                    Staff Access
                  </span>
                  {showStaffAccess ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </button>
                {showStaffAccess && (
                  <div className="grid gap-2 mt-4 animate-in slide-in-from-top-2 duration-200">
                    <Label htmlFor="admin-secret" className="text-xs text-muted-foreground">
                      Admin Secret (provided by your administrator)
                    </Label>
                    <Input
                      id="admin-secret"
                      type="password"
                      placeholder="Enter admin secret..."
                      value={adminSecret}
                      className="bg-transparent"
                      onChange={(e) => setAdminSecret(e.target.value)}
                    />
                  </div>
                )}
              </div>

              {error && <p className="text-sm text-red-500">{error}</p>}
              <Button type="submit" className="w-full mt-2" disabled={isLoading}>
                {isLoading ? "Creating an account..." : "Sign up"}
              </Button>
            </div>
            <div className="mt-6 text-center text-sm text-balance text-muted-foreground">
              Already have an account?{" "}
              <Link href="/auth/login" className="underline underline-offset-4 hover:text-foreground text-foreground">
                Login
              </Link>
            </div>
          </form>
    </div>
  );
}
