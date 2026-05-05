"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { api } from "@/lib/api";
import { Promotion } from "@/lib/api/types";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";

export function PromotionsShowcase() {
    const [promotions, setPromotions] = useState<Promotion[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        async function fetchPromotions() {
            try {
                // Fetch only active promotions for the hero/banner
                const data = await api.getPromotions('hero');
                setPromotions(data);
            } catch (error) {
                console.error("Failed to load promotions", error);
            } finally {
                setLoading(false);
            }
        }
        fetchPromotions();
    }, []);

    useEffect(() => {
        if (promotions.length <= 1) return;
        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % promotions.length);
        }, 5000);
        return () => clearInterval(interval);
    }, [promotions]);

    if (loading || promotions.length === 0) return null;

    const nextSlide = () => setCurrentIndex((prev) => (prev + 1) % promotions.length);
    const prevSlide = () => setCurrentIndex((prev) => (prev - 1 + promotions.length) % promotions.length);

    const currentPromo = promotions[currentIndex];

    return (
        <section className="relative w-full overflow-hidden bg-slate-900 group">
            {/* Background Image / Overlay */}
            <div className="absolute inset-0 z-0">
                {currentPromo.image?.url ? (
                    <Image
                        src={currentPromo.image.url}
                        alt={currentPromo.title}
                        fill
                        className="object-cover opacity-40 transition-opacity duration-1000 ease-in-out"
                        priority
                    />
                ) : (
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/80 to-accent/80 mix-blend-multiply" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent" />
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32 flex flex-col md:flex-row items-center justify-between min-h-[600px]">
                <div className="max-w-3xl animate-in fade-in slide-in-from-left-8 duration-1000">
                    <div className="inline-flex items-center gap-2 py-1 px-3 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-widest mb-8 backdrop-blur-md">
                        <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                        Exclusive Offers
                    </div>
                    <h2 className="text-5xl md:text-7xl font-display font-black text-white mb-8 leading-[1.1] tracking-tight transition-all duration-700 drop-shadow-2xl">
                        {currentPromo.title}
                    </h2>
                    {currentPromo.description && (
                        <p className="text-xl md:text-2xl text-gray-200/90 font-medium mb-12 transition-all duration-500 delay-100 max-w-xl leading-relaxed">
                            {currentPromo.description}
                        </p>
                    )}
                    
                    {currentPromo.link && (
                        <div className="flex flex-wrap gap-4">
                            <Link
                                href={currentPromo.link}
                                className="inline-flex items-center justify-center px-10 py-5 text-base font-black rounded-2xl text-white bg-primary hover:bg-white hover:text-primary transition-all duration-500 shadow-2xl shadow-primary/40 group/btn"
                            >
                                Get Started Now
                                <ArrowRight className="ml-3 w-5 h-5 group-hover/btn:translate-x-2 transition-transform duration-500" />
                            </Link>
                        </div>
                    )}
                </div>

                {promotions.length > 1 && (
                    <div className="absolute bottom-8 right-8 flex items-center gap-4">
                        <button 
                            onClick={prevSlide}
                            className="w-12 h-12 rounded-full border border-white/20 bg-black/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/10 hover:border-white/40 transition-all"
                        >
                            <ChevronLeft className="w-6 h-6" />
                        </button>
                        <button 
                            onClick={nextSlide}
                            className="w-12 h-12 rounded-full border border-white/20 bg-black/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/10 hover:border-white/40 transition-all"
                        >
                            <ChevronRight className="w-6 h-6" />
                        </button>
                    </div>
                )}
            </div>
            
            {promotions.length > 1 && (
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                    {promotions.map((_, idx) => (
                        <button
                            key={idx}
                            onClick={() => setCurrentIndex(idx)}
                            className={`w-2 h-2 rounded-full transition-all duration-300 ${idx === currentIndex ? 'w-8 bg-primary' : 'bg-white/30 hover:bg-white/50'}`}
                            aria-label={`Go to slide ${idx + 1}`}
                        />
                    ))}
                </div>
            )}
        </section>
    );
}
