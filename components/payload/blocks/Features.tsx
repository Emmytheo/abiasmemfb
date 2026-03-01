import React from 'react'
import * as LucideIcons from 'lucide-react'

export const Features = ({ tagline, headline, features }: any) => {
    return (
        <section className="py-20 bg-background pattern-dots flex-1" style={{ width: '100%' }}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    {tagline && <h2 className="text-accent font-semibold tracking-wide uppercase text-sm mb-3">{tagline}</h2>}
                    <h3 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-6">
                        {headline}
                    </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {features?.map((f: any, i: number) => {
                        const IconComponent = (LucideIcons as any)[f.icon || 'CheckCircle'] || LucideIcons.CheckCircle

                        return (
                            <div key={i} className="bg-card text-card-foreground p-8 rounded-2xl shadow-lg hover:-translate-y-1 transition-transform duration-300">
                                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-6">
                                    <IconComponent />
                                </div>
                                <h4 className="text-xl font-bold text-foreground mb-3">{f.title}</h4>
                                <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                                    {f.description}
                                </p>
                            </div>
                        )
                    })}
                </div>
            </div>
        </section>
    )
}
