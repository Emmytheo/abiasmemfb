"use client";

import { ArrowRight, Star, Shield, Zap } from "lucide-react";
import Link from "next/link";
import { useBankProfile } from "@/context/bank-profile-context";

export function SpotlightSection() {
    const { activeProfile } = useBankProfile();
    const s = activeProfile.spotlight;

    return (
        <section className="relative py-24 overflow-hidden bg-zinc-950">
            <div
                className="absolute inset-0 bg-cover bg-fixed bg-center opacity-30 grayscale"
                style={{ backgroundImage: "url('https://images.unsplash.com/photo-1556761175-5973dc0f32e7?q=80&w=2032&auto=format&fit=crop')" }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/85 to-transparent" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                    <div className="animate-in fade-in slide-in-from-left-10 duration-1000">
                        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-accent/30 bg-accent/10 text-accent text-xs font-bold uppercase tracking-widest backdrop-blur-sm mb-6">
                            <Star className="w-3 h-3 fill-accent" />
                            {s.badge}
                        </span>

                        <h2 className="text-4xl md:text-6xl font-display font-bold text-white mb-6 leading-[1.1] tracking-tight">
                            {s.headlineTop} <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-yellow-200 italic">
                                {s.headlineItalic}
                            </span>
                        </h2>

                        <p className="text-lg sm:text-xl text-zinc-300 mb-10 max-w-xl leading-relaxed font-light">
                            {s.description}
                        </p>

                        <div className="flex flex-wrap gap-6 mb-10">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-accent border border-primary/20">
                                    <Shield className="w-5 h-5" />
                                </div>
                                <span className="text-zinc-200 font-medium">CBN Licensed & NDIC Insured</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center text-accent border border-accent/20">
                                    <Zap className="w-5 h-5" />
                                </div>
                                <span className="text-zinc-200 font-medium">Instant Digital Settlement</span>
                            </div>
                        </div>

                        <Link
                            href={s.ctaHref}
                            className="group inline-flex items-center gap-4 bg-primary text-primary-foreground px-8 py-4 rounded-full font-bold text-base sm:text-lg hover:bg-accent hover:text-accent-foreground transition-all duration-300 shadow-2xl"
                        >
                            {s.ctaLabel}
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
                        </Link>
                    </div>

                    <div className="relative hidden lg:block">
                        <div className="relative z-10 bg-white/5 backdrop-blur-3xl border border-white/10 rounded-3xl p-8 shadow-2xl">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center text-accent-foreground font-bold text-xl">
                                    “
                                </div>
                                <div>
                                    <h4 className="text-white font-bold">{s.quoteHeading}</h4>
                                    <p className="text-zinc-400 text-sm">{s.quoteSub}</p>
                                </div>
                            </div>
                            <p className="text-zinc-200 text-lg italic leading-relaxed mb-8">
                                &ldquo;{s.quoteBody}&rdquo;
                            </p>
                            <div className="flex items-center gap-4">
                                <div className="w-11 h-11 rounded-full bg-primary border border-accent/40 flex items-center justify-center text-accent font-black text-xs">
                                    {activeProfile.shortName.slice(0, 3)}
                                </div>
                                <div>
                                    <p className="text-white font-bold text-sm">{s.attributionName}</p>
                                    <p className="text-accent text-xs font-bold uppercase tracking-wider">{s.attributionRole}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
