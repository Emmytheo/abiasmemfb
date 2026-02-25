"use client";

import React from "react";

interface NewsletterFormProps {
    className?: string;
    variant?: "default" | "minimal";
}

export function NewsletterForm({ className, variant = "default" }: NewsletterFormProps) {
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // In a real app, handle submission here
        console.log("Newsletter submitted");
    };

    if (variant === "minimal") {
        return (
            <form className={`space-y-5 relative z-10 ${className}`} onSubmit={handleSubmit}>
                <input
                    type="email"
                    placeholder="name@company.com"
                    className="block w-full px-4 py-4 border border-white/10 bg-[#05080f] text-white placeholder-gray-600 focus:outline-none focus:border-accent focus:ring-0 sm:text-sm transition-all rounded-none"
                />
                <button type="submit" className="w-full flex items-center justify-center px-6 py-4 border border-accent text-xs font-bold uppercase tracking-[0.15em] text-accent bg-transparent hover:bg-accent hover:text-black transition-all duration-300">
                    Subscribe
                </button>
            </form>
        );
    }

    return (
        <form className={`flex flex-col sm:flex-row gap-4 max-w-lg mx-auto ${className}`} onSubmit={handleSubmit}>
            <input
                type="email"
                placeholder="Your email address"
                className="flex-1 bg-gray-50 dark:bg-black border border-gray-300 dark:border-white/10 rounded-lg px-4 py-3 text-gray-900 dark:text-white placeholder:text-gray-500 focus:outline-none focus:border-accent focus:ring-1 focus:ring-primary transition-all"
            />
            <button type="submit" className="bg-accent hover:bg-accent-dark text-primary font-bold px-8 py-3 rounded-lg transition-colors shadow-lg">
                Subscribe
            </button>
        </form>
    );
}
