"use client";

import Link from "next/link";
import { ArrowRight, ShieldCheck, Landmark, Users2, Sparkles, Building2 } from "lucide-react";
import Image from "next/image";

export function HeroExpository() {
    return (
        <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-background">
            {/* Ambient Background Effects */}
            <div className="absolute top-0 left-0 w-full h-full opacity-50 dark:opacity-100">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] animate-pulse"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/10 rounded-full blur-[120px]"></div>
            </div>

            {/* Pattern Overlay */}
            <div className="absolute inset-0 opacity-[0.05] pointer-events-none" style={{ backgroundImage: "url('/images/elephant-1.png')", backgroundSize: 'contain', backgroundRepeat: 'repeat' }}></div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 pt-24 pb-12 lg:pt-32 lg:pb-24">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
                    
                    {/* Left Column: The Story */}
                    <div className="lg:col-span-7 text-left animate-in fade-in slide-in-from-left-10 duration-1000">
                        <div className="inline-flex items-center gap-3 py-2 px-4 rounded-2xl bg-foreground/5 border border-foreground/10 backdrop-blur-xl mb-6 lg:mb-8">
                            <span className="flex h-2 w-2 rounded-full bg-primary animate-ping"></span>
                            <span className="text-foreground/80 text-[10px] sm:text-xs font-black uppercase tracking-[0.2em]">State-of-the-Art Banking</span>
                        </div>
                        
                        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-display font-black text-foreground mb-6 lg:mb-8 leading-[1.1] lg:leading-[1.05] tracking-tight">
                            Abia State&apos;s <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary/80 to-accent">Financial Pillar.</span>
                        </h1>
                        
                        <p className="text-lg sm:text-xl md:text-2xl text-muted-foreground font-medium mb-8 lg:mb-12 max-w-2xl leading-relaxed">
                            Since inception, we&apos;ve been the silent engine behind thousands of Abia entrepreneurs, providing secure, modern, and accessible financial infrastructure.
                        </p>

                        <div className="flex flex-wrap gap-4 sm:gap-6 mb-12 lg:mb-16">
                            <Link
                                href="/personal-banking"
                                className="px-6 sm:px-10 py-4 sm:py-5 bg-primary text-primary-foreground font-black rounded-2xl hover:bg-foreground hover:text-background transition-all duration-500 shadow-[0_20px_40px_-10px_rgba(var(--primary-rgb),0.5)] group flex items-center gap-3 text-sm sm:text-base"
                            >
                                Start Your Journey
                                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-2 transition-transform" />
                            </Link>
                            <Link
                                href="/about"
                                className="px-6 sm:px-10 py-4 sm:py-5 bg-foreground/5 text-foreground font-black rounded-2xl border border-foreground/10 hover:bg-foreground/10 transition-all duration-500 backdrop-blur-md text-sm sm:text-base"
                            >
                                Our Mission
                            </Link>
                        </div>

                        {/* Trust Badges */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-10 border-t border-foreground/5">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-foreground/5 flex items-center justify-center text-primary border border-foreground/10 shrink-0">
                                    <ShieldCheck className="w-5 h-5" />
                                </div>
                                <span className="text-[10px] text-muted-foreground font-black uppercase tracking-widest leading-tight">CBN <br /> Licensed</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-foreground/5 flex items-center justify-center text-primary border border-foreground/10 shrink-0">
                                    <Building2 className="w-5 h-5" />
                                </div>
                                <span className="text-[10px] text-muted-foreground font-black uppercase tracking-widest leading-tight">NDIC <br /> Insured</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-foreground/5 flex items-center justify-center text-primary border border-foreground/10 shrink-0">
                                    <Users2 className="w-5 h-5" />
                                </div>
                                <span className="text-[10px] text-muted-foreground font-black uppercase tracking-widest leading-tight">Community <br /> Driven</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-foreground/5 flex items-center justify-center text-primary border border-foreground/10 shrink-0">
                                    <Landmark className="w-5 h-5" />
                                </div>
                                <span className="text-[10px] text-muted-foreground font-black uppercase tracking-widest leading-tight">Modern <br /> Infrastructure</span>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Visual Showcase */}
                    <div className="lg:col-span-5 relative animate-in fade-in slide-in-from-right-10 duration-1000 delay-300">
                        <div className="relative z-10 rounded-[2rem] sm:rounded-[3rem] overflow-hidden border-[1px] border-foreground/10 shadow-2xl group bg-background">
                            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-10"></div>
                            <Image 
                                src="/images/elephant-1.png" 
                                alt="Modern Banking Building" 
                                width={600} 
                                height={800} 
                                className="w-full h-auto object-cover grayscale-[0.5] group-hover:grayscale-0 transition-all duration-1000 scale-105 group-hover:scale-100"
                            />
                            
                            <div className="absolute bottom-4 left-4 right-4 sm:bottom-8 sm:left-8 sm:right-8 z-20">
                                <div className="p-4 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] bg-background/20 backdrop-blur-2xl border border-foreground/20 shadow-2xl">
                                    <div className="flex items-center gap-3 sm:gap-4 mb-2 sm:mb-3">
                                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-primary flex items-center justify-center text-primary-foreground shrink-0">
                                            <Sparkles className="w-5 h-5 sm:w-6 sm:h-6" />
                                        </div>
                                        <div>
                                            <h4 className="text-foreground font-black text-base sm:text-lg leading-tight">Abia State Roots</h4>
                                            <p className="text-foreground/60 text-[10px] sm:text-xs font-bold uppercase">Umuahia Head Office</p>
                                        </div>
                                    </div>
                                    <p className="text-foreground/80 text-xs sm:text-sm leading-relaxed">
                                        Providing financial security and enterprise growth across the heart of Abia.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Decorative Floaties */}
                        <div className="absolute -top-10 -right-10 w-32 h-32 bg-accent/20 rounded-full blur-3xl -z-10 animate-bounce duration-[5000ms]"></div>
                        <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-primary/10 rounded-full blur-3xl -z-10"></div>
                    </div>

                </div>
            </div>

            {/* Scroll Indicator */}
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-30 animate-bounce">
                <span className="text-[10px] font-black uppercase tracking-widest text-foreground">Explore</span>
                <div className="w-[1px] h-10 bg-foreground"></div>
            </div>
        </section>
    );
}
