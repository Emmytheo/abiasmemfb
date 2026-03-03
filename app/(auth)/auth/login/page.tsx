import { LoginForm } from "@/components/login-form";
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
              <h1 className="text-2xl font-semibold tracking-tight">Welcome Back</h1>
              <p className="text-sm text-muted-foreground">Log in to your account to continue</p>
            </div>
            <LoginForm />
          </div>
        </div>
      </div>

      {/* Hero/Branding Side */}
      <div className="relative hidden lg:flex flex-col items-center justify-center p-10 overflow-hidden bg-zinc-950 dark:bg-zinc-950">
        {/* Abstract animated background elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/80 via-primary to-[#0f172a] opacity-90"></div>
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-500/30 blur-[120px] mix-blend-screen animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-emerald-500/20 blur-[120px] mix-blend-screen animate-pulse delay-1000"></div>

        <div className="relative z-10 w-full max-w-lg text-center flex flex-col items-center">
            <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-md mb-8 ring-1 ring-white/20 shadow-2xl">
                <Logo className="h-16 w-auto drop-shadow-lg" />
            </div>
            <h2 className="text-4xl lg:text-5xl font-bold tracking-tight text-white mb-6 leading-tight font-display">
                Empowering Your Financial Future
            </h2>
            <p className="text-lg text-blue-100/80 mb-10 leading-relaxed font-light">
                We create financial giants by providing bespoke microfinance solutions for entrepreneurs and small business owners across Abia State.
            </p>
            
            <div className="grid grid-cols-2 gap-4 w-full">
                <div className="bg-white/5 backdrop-blur-sm rounded-xl p-5 border border-white/10 text-left">
                    <div className="h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center mb-4">
                        <svg className="h-5 w-5 text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                    </div>
                    <h3 className="text-white font-medium">Secure Banking</h3>
                    <p className="text-sm text-blue-200/60 mt-1">Bank with confidence using our state-of-the-art security systems.</p>
                </div>
                <div className="bg-white/5 backdrop-blur-sm rounded-xl p-5 border border-white/10 text-left">
                    <div className="h-10 w-10 rounded-full bg-emerald-500/20 flex items-center justify-center mb-4">
                        <svg className="h-5 w-5 text-emerald-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                    </div>
                    <h3 className="text-white font-medium">Growth Focused</h3>
                    <p className="text-sm text-blue-200/60 mt-1">Tailored solutions designed to scale alongside your business.</p>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
