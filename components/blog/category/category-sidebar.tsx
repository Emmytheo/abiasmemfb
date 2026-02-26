import { ArrowRight } from "lucide-react";
import { NewsletterForm } from "@/components/blog/newsletter-form";
import { api } from "@/lib/api";
import Link from "next/link";

export async function CategorySidebar() {
    const popularPosts = await api.getPopularPosts();
    const tags = await api.getAllTags();

    return (
        <aside className="lg:col-span-4 space-y-16">
            {/* Curated List */}
            <div className="bg-card border border-border p-10 relative">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent"></div>
                <div className="flex items-center gap-3 mb-10">
                    <span className="text-accent text-xl">✦</span>
                    <h3 className="text-lg font-serif font-bold text-foreground tracking-wide">Curated For You</h3>
                </div>
                <div className="space-y-8">
                    {popularPosts.map((item, idx) => (
                        <div key={item.slug}>
                            <Link href={`/blog/${item.slug}`} className="group flex gap-5 items-baseline cursor-pointer">
                                <span className="text-xl font-serif text-accent/30 group-hover:text-accent transition-colors italic">0{idx + 1}</span>
                                <div>
                                    <h4 className="text-foreground text-lg font-serif leading-snug group-hover:text-accent transition-colors">{item.title}</h4>
                                    <p className="text-[10px] uppercase tracking-widest text-accent/80 mt-2">{item.author.role} • {item.readTime}</p>
                                </div>
                            </Link>
                            {idx < popularPosts.length - 1 && <div className="h-px w-full bg-border mt-8"></div>}
                        </div>
                    ))}
                </div>
            </div>

            {/* Subscribe Widget */}
            <div className="bg-card border border-border p-10 relative overflow-hidden group">
                <div className="absolute -top-20 -right-20 w-64 h-64 bg-accent/5 blur-[80px] rounded-full pointer-events-none"></div>
                <h3 className="text-2xl font-serif text-foreground mb-3 relative z-10 italic">Join the <span className="text-accent not-italic">Inner Circle</span></h3>
                <p className="text-muted-foreground text-sm mb-8 relative z-10 leading-relaxed font-light">
                    Receive exclusive market intelligence and strategic insights directly to your inbox. Weekly.
                </p>
                <NewsletterForm variant="minimal" />
                <p className="mt-6 text-[10px] text-gray-600 text-center tracking-wide">
                    By subscribing, you agree to our <Link href="/legal/privacy" className="text-accent hover:underline">Privacy Policy</Link>. No spam, ever.
                </p>
            </div>

            {/* Tags */}
            <div>
                <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-accent/80 mb-6">Trending Topics</h4>
                <div className="flex flex-wrap gap-3">
                    {tags.map(tag => (
                        <span key={tag} className="px-4 py-2 border border-border text-[11px] uppercase tracking-wider text-muted-foreground hover:text-foreground hover:border-accent/50 transition-colors bg-card cursor-default">
                            #{tag}
                        </span>
                    ))}
                </div>
            </div>
        </aside>
    );
}
