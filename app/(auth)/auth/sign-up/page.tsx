import { SignUpForm } from "@/components/sign-up-form";
import { ThemeCustomizer } from "@/components/theme-customizer";
import { Logo } from "@/components/ui/logo";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

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
      <div className="relative hidden lg:flex flex-col items-center justify-center p-10 overflow-hidden bg-zinc-950 dark:bg-zinc-950">
        {/* Abstract animated background elements */}
        <div className="absolute inset-0 bg-gradient-to-bl from-accent/80 via-primary to-[#0f172a] opacity-90"></div>
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-accent/30 blur-[120px] mix-blend-screen animate-pulse"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/20 blur-[120px] mix-blend-screen animate-pulse delay-1000"></div>

        <div className="relative z-10 w-full max-w-lg text-center flex flex-col items-center">
            <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-md mb-8 ring-1 ring-white/20 shadow-2xl">
                <Logo className="h-16 w-auto drop-shadow-lg" />
            </div>
            <h2 className="text-4xl lg:text-5xl font-bold tracking-tight text-white mb-6 leading-tight font-display">
                Start Building Your Legacy
            </h2>
            <p className="text-lg text-blue-100/80 mb-10 leading-relaxed font-light">
                Join thousands of entrepreneurs and businesses who trust Abia Microfinance Bank with their growth and financial stability.
            </p>
            
            <div className="grid grid-cols-2 gap-4 w-full text-left">
                <div className="bg-white/5 backdrop-blur-sm rounded-xl p-5 border border-white/10 flex flex-col gap-2">
                    <h3 className="text-white font-medium text-lg">24/7 Access</h3>
                    <p className="text-sm text-blue-200/60 leading-relaxed">Manage your accounts, transfer funds, and pay bills anytime, anywhere.</p>
                </div>
                <div className="bg-white/5 backdrop-blur-sm rounded-xl p-5 border border-white/10 flex flex-col gap-2">
                    <h3 className="text-white font-medium text-lg">Fast Approvals</h3>
                    <p className="text-sm text-blue-200/60 leading-relaxed">Experience rapid processing for business and personal loan applications.</p>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
