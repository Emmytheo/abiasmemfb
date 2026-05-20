"use client";

import { useEffect, useState } from "react";
import { Logo } from "@/components/ui/logo";
import {
    ShieldCheck, TrendingUp, Users, Store, CreditCard,
    Building2, Zap, Lock, CheckCircle, Globe
} from "lucide-react";

const CYCLES = [
    {
        headline: "Your Financial Future Starts Here.",
        sub: "We've been the silent engine behind thousands of Abia entrepreneurs — providing secure, modern, and accessible banking that turns ambition into legacy.",
        accent: "from-primary via-primary/80 to-blue-600",
        orbA: "bg-blue-500/30",
        orbB: "bg-primary/20",
        features: [
            { icon: <ShieldCheck className="w-4 h-4" />, text: "CBN Licensed & NDIC Insured" },
            { icon: <Lock className="w-4 h-4" />, text: "PCI-DSS Secure Transactions" },
        ],
    },
    {
        headline: "Empowering Aba Trade Unions.",
        sub: "From digital Esusu cycles to merchant checkout APIs — our cooperative banking suite modernizes traditional trade union finance for the digital age.",
        accent: "from-emerald-500 via-primary/80 to-primary",
        orbA: "bg-emerald-500/25",
        orbB: "bg-teal-500/15",
        features: [
            { icon: <Users className="w-4 h-4" />, text: "340+ Active Esusu Cooperatives" },
            { icon: <TrendingUp className="w-4 h-4" />, text: "₦4.2B in Total Loans Disbursed" },
        ],
    },
    {
        headline: "Bank From Your Neighborhood.",
        sub: "Our POS Agency network puts a licensed banking cashpoint steps from your door — deposits, withdrawals, bill payments, and Esusu collections, powered by 99.8% uptime rails.",
        accent: "from-amber-500 via-primary/70 to-primary",
        orbA: "bg-amber-500/25",
        orbB: "bg-orange-400/15",
        features: [
            { icon: <Store className="w-4 h-4" />, text: "500+ POS Agent Terminals" },
            { icon: <Zap className="w-4 h-4" />, text: "Real-Time Commission Settlement" },
        ],
    },
    {
        headline: "Your Smart Card. Your Rules.",
        sub: "Issue Visa, Mastercard, or Verve debit cards instantly. Set limits, freeze, and manage from your phone. Physical and virtual cards with enterprise-grade controls.",
        accent: "from-violet-500 via-primary/70 to-primary",
        orbA: "bg-violet-500/25",
        orbB: "bg-indigo-500/15",
        features: [
            { icon: <CreditCard className="w-4 h-4" />, text: "Physical & Virtual Smart Cards" },
            { icon: <Globe className="w-4 h-4" />, text: "3 International Card Networks" },
        ],
    },
];

const STATS = [
    { value: "12K+", label: "Members" },
    { value: "₦8.4B", label: "Deposits" },
    { value: "18yrs", label: "Of Trust" },
    { value: "340+", label: "Co-ops" },
];

interface AuthBrandingPanelProps {
    mode?: "login" | "signup";
}

export function AuthBrandingPanel({ mode = "login" }: AuthBrandingPanelProps) {
    const [idx, setIdx] = useState(0);
    const [transitioning, setTransitioning] = useState(false);

    useEffect(() => {
        const interval = setInterval(() => {
            setTransitioning(true);
            setTimeout(() => {
                setIdx(i => (i + 1) % CYCLES.length);
                setTransitioning(false);
            }, 400);
        }, 6000);
        return () => clearInterval(interval);
    }, []);

    const slide = CYCLES[idx];

    return (
        <div className="relative hidden lg:flex flex-col items-center justify-center p-10 overflow-hidden bg-zinc-950">
            {/* Animated background orbs */}
            <div className={`absolute top-[-15%] left-[-10%] w-[50%] h-[50%] ${slide.orbA} rounded-full blur-[130px] transition-all duration-1000 pointer-events-none`} />
            <div className={`absolute bottom-[-15%] right-[-10%] w-[45%] h-[45%] ${slide.orbB} rounded-full blur-[130px] transition-all duration-1000 pointer-events-none`} />
            <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/60 via-transparent to-zinc-950/80 pointer-events-none" />

            {/* Floating particles */}
            {[
                { top: "10%", left: "15%", size: "w-1 h-1" },
                { top: "30%", left: "85%", size: "w-1.5 h-1.5" },
                { top: "65%", left: "8%",  size: "w-1 h-1" },
                { top: "80%", left: "78%", size: "w-1 h-1" },
                { top: "50%", left: "92%", size: "w-0.5 h-0.5" },
            ].map((p, i) => (
                <div
                    key={i}
                    className={`absolute ${p.size} bg-white/30 rounded-full animate-bounce`}
                    style={{ top: p.top, left: p.left, animationDuration: `${3 + i}s`, animationDelay: `${i * 0.3}s` }}
                />
            ))}

            {/* Content */}
            <div className="relative z-10 w-full max-w-lg flex flex-col items-center text-center gap-8">
                {/* Logo */}
                <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-md ring-1 ring-white/20 shadow-2xl">
                    <Logo className="h-14 w-auto drop-shadow-lg" textClassName="text-white" />
                </div>

                {/* Cycling Text */}
                <div
                    className={`space-y-4 transition-all duration-400 ${transitioning ? "opacity-0 translate-y-3" : "opacity-100 translate-y-0"}`}
                >
                    <h2 className={`text-3xl lg:text-4xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r ${slide.accent} leading-tight`}>
                        {slide.headline}
                    </h2>
                    <p className="text-base text-white/70 leading-relaxed font-light max-w-md mx-auto">
                        {slide.sub}
                    </p>

                    {/* Features */}
                    <div className="flex flex-col gap-2 mt-4">
                        {slide.features.map((feat, i) => (
                            <div key={i} className="flex items-center gap-2.5 justify-center text-sm text-white/80 font-medium">
                                <span className="text-white/60">{feat.icon}</span>
                                <span>{feat.text}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Cycle dots */}
                <div className="flex gap-2">
                    {CYCLES.map((_, i) => (
                        <button
                            key={i}
                            onClick={() => setIdx(i)}
                            className={`h-1 rounded-full transition-all duration-300 ${i === idx ? "w-8 bg-white" : "w-2 bg-white/30"}`}
                        />
                    ))}
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-4 gap-3 w-full">
                    {STATS.map((s, i) => (
                        <div key={i} className="bg-white/5 backdrop-blur-sm rounded-2xl p-3 border border-white/10 text-center">
                            <p className="text-lg font-black text-white leading-none">{s.value}</p>
                            <p className="text-[9px] font-bold uppercase tracking-widest text-white/50 mt-1">{s.label}</p>
                        </div>
                    ))}
                </div>

                {/* Trust badge */}
                <div className="flex items-center gap-2 text-xs text-white/50 font-medium">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                    <span>CBN Licensed · NDIC Insured · PCI-DSS Compliant</span>
                </div>
            </div>
        </div>
    );
}
