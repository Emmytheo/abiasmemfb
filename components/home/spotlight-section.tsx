"use client";

import { ArrowRight, Star, Shield, Zap } from "lucide-react";
import Link from "next/link";

export function SpotlightSection() {
    return (
        <section className="relative py-24 overflow-hidden bg-zinc-950">
            {/* Background Image with Parallax-like overlay */}
            <div 
                className="absolute inset-0 bg-cover bg-fixed bg-center opacity-40 grayscale"
                style={{ backgroundImage: "url('https://images.unsplash.com/photo-1556761175-5973dc0f32e7?q=80&w=2032&auto=format&fit=crop')" }}
            ></div>
            <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/80 to-transparent"></div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                    <div className="animate-in fade-in slide-in-from-left-10 duration-1000">
                        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-accent/30 bg-accent/10 text-accent text-xs font-bold uppercase tracking-widest backdrop-blur-sm mb-6">
                            <Star className="w-3 h-3 fill-accent" />
                            Community Impact
                        </span>
                        
                        <h2 className="text-4xl md:text-6xl lg:text-7xl font-display font-bold text-white mb-8 leading-[1.1] tracking-tight">
                            More than a bank, <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-yellow-200 italic">a partner in growth.</span>
                        </h2>
                        
                        <p className="text-xl text-zinc-400 mb-10 max-w-xl leading-relaxed font-light">
                            We've invested over ₦2 Billion into local Abia enterprises this year alone. Join the movement that's transforming our state's economy.
                        </p>
                        
                        <div className="flex flex-wrap gap-6 mb-12">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary border border-primary/20">
                                    <Shield className="w-5 h-5" />
                                </div>
                                <span className="text-zinc-300 font-medium">CBN Licensed</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center text-accent border border-accent/20">
                                    <Zap className="w-5 h-5" />
                                </div>
                                <span className="text-zinc-300 font-medium">Instant Disbursement</span>
                            </div>
                        </div>

                        <Link 
                            href="/company"
                            className="group inline-flex items-center gap-4 bg-primary text-primary-foreground px-8 py-4 rounded-full font-bold text-lg hover:bg-accent hover:text-primary transition-all duration-300 shadow-2xl shadow-primary/20"
                        >
                            Read Our Mission Story
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
                        </Link>
                    </div>

                    <div className="relative hidden lg:block">
                        <div className="relative z-10 bg-white/5 backdrop-blur-3xl border border-white/10 rounded-3xl p-8 shadow-2xl animate-in zoom-in duration-1000 delay-300">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center text-primary font-bold text-xl">“</div>
                                <div>
                                    <h4 className="text-white font-bold">State-of-the-Art Banking</h4>
                                    <p className="text-zinc-500 text-sm">Security you can trust</p>
                                </div>
                            </div>
                            <p className="text-zinc-300 text-lg italic leading-relaxed mb-8">
                                "Our goal is to ensure every micro-entrepreneur in Abia State has access to the digital tools and capital they need to compete globally."
                            </p>
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-zinc-800 border border-zinc-700"></div>
                                <div>
                                    <p className="text-white font-bold text-sm">Management Team</p>
                                    <p className="text-accent text-xs font-bold uppercase tracking-wider">AbiaSMEMFB</p>
                                </div>
                            </div>
                        </div>
                        {/* Decorative elements */}
                        <div className="absolute -top-20 -right-20 w-64 h-64 bg-primary/20 rounded-full blur-[100px] -z-10"></div>
                        <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-accent/10 rounded-full blur-[100px] -z-10"></div>
                    </div>
                </div>
            </div>
        </section>
    );
}
