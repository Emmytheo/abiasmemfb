import { SignUpForm } from "@/components/sign-up-form";
import { ThemeCustomizer } from "@/components/theme-customizer";
import { Logo } from "@/components/ui/logo";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AuthBrandingPanel } from "@/components/auth/auth-branding-panel";

export default function Page() {
  return (
    <div className="grid min-h-svh grid-cols-1 lg:grid-cols-2 bg-background">
      {/* Form Side */}
      <div className="flex flex-col p-6 md:p-10">
        <div className="flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
          <ThemeCustomizer />
        </div>
        
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-sm xl:max-w-md animate-in fade-in zoom-in-95 duration-500">
            <div className="mb-8 flex flex-col items-center text-center">
              <Logo className="h-10 w-auto mb-4" />
              <h1 className="text-2xl font-semibold tracking-tight">Create an Account</h1>
              <p className="text-sm text-muted-foreground">Join us and start your financial journey</p>
            </div>
            <SignUpForm />
          </div>
        </div>
      </div>

      {/* Hero/Branding Side */}
      <AuthBrandingPanel mode="signup" />
    </div>
  );
}
