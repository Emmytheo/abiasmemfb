import React from 'react'
import Link from 'next/link'

export const Hero = ({
    headline,
    subheadline,
    badgeText,
    backgroundImage,
    primaryCta,
    secondaryCta
}: any) => {
    return (
        <section className="relative h-screen min-h-[600px] flex items-center justify-center overflow-hidden">
            <div
                className="absolute inset-0 bg-cover bg-center bg-no-repeat bg-fixed"
                style={{ backgroundImage: `url('${backgroundImage?.url || ''}')` }}
            ></div>
            <div
                className="absolute inset-0"
                style={{ background: "linear-gradient(color-mix(in srgb, hsl(var(--primary)), transparent 20%), color-mix(in srgb, hsl(var(--primary)), transparent 40%))" }}
            ></div>
            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center z-10">
                {badgeText && (
                    <span className="inline-block py-1 px-3 rounded-full bg-accent/20 border border-accent/40 text-accent text-sm font-semibold mb-6 animate-fade-in-up">
                        {badgeText}
                    </span>
                )}
                <h1 className="text-4xl md:text-6xl lg:text-7xl font-display font-bold text-white mb-6 leading-tight tracking-tight whitespace-pre-line">
                    {headline}
                </h1>
                {subheadline && (
                    <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-200 font-light mb-10 whitespace-pre-line">
                        {subheadline}
                    </p>
                )}
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    {primaryCta?.url && primaryCta?.label && (
                        <Link
                            className="inline-flex items-center justify-center px-8 py-4 text-base font-semibold rounded-full text-white bg-primary border-2 border-primary hover:bg-transparent hover:text-white transition-all duration-300 shadow-lg hover:shadow-xl"
                            href={primaryCta.url}
                        >
                            {primaryCta.label}
                        </Link>
                    )}
                    {secondaryCta?.url && secondaryCta?.label && (
                        <Link
                            className="inline-flex items-center justify-center px-8 py-4 text-base font-semibold rounded-full text-white border-2 border-white/30 bg-white/10 hover:bg-white hover:text-primary backdrop-blur-sm transition-all duration-300"
                            href={secondaryCta.url}
                        >
                            {secondaryCta.label}
                        </Link>
                    )}
                </div>
            </div>
        </section>
    )
}
