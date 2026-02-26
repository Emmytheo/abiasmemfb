
import { CategoryHeader } from "@/components/blog/category/category-header";
import { CategorySidebar } from "@/components/blog/category/category-sidebar";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { api } from "@/lib/api";
import { Suspense } from "react";

// Generate static params for categories
export async function generateStaticParams() {
    const posts = await api.getBlogPosts();
    // Unique categories
    const categories = Array.from(new Set(posts.map(post => post.category)));

    return categories.map((category) => ({
        slug: category.toLowerCase().replace(/\s+/g, '-'),
    }));
}

async function CategoryPageContent({ params }: { params: { slug: string } }) {
    const { slug } = await params;
    const decodedCategory = decodeURIComponent(slug).replace(/-/g, ' ');
    const posts = await api.getPostsByCategory(slug);

    return (
        <div className="bg-background min-h-screen">
            <CategoryHeader title={decodedCategory} />

            <main className="relative z-10 w-full py-20">
                <div className="max-w-7xl mx-auto px-6 lg:px-12">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 xl:gap-24">
                        {/* Main Content Area */}
                        <div className="lg:col-span-8 flex flex-col gap-16">
                            <div className="flex items-end justify-between border-b border-border pb-6">
                                <h2 className="text-3xl font-serif text-foreground">Latest <span className="italic text-accent">Intelligence</span></h2>
                                <div className="hidden sm:flex items-center gap-4 text-accent/80 text-xs tracking-widest uppercase">
                                    <span>Sort by:</span>
                                    <button className="font-bold text-foreground hover:text-accent transition-colors">Date</button>
                                    <span className="text-muted">|</span>
                                    <button className="text-muted-foreground hover:text-accent transition-colors">Popularity</button>
                                </div>
                            </div>

                            <div className="flex flex-col">
                                {posts.length > 0 ? (
                                    posts.map((post) => (
                                        <article key={post.slug} className="group cursor-pointer py-10 first:pt-4 border-b border-border hover:border-accent/40 transition-colors">
                                            <Link href={`/blog/${post.slug}`} className="flex flex-col md:flex-row gap-10 items-start">
                                                <div className="flex-1 space-y-5">
                                                    <div className="flex items-center gap-4 text-xs tracking-[0.15em] text-accent/60 uppercase font-semibold">
                                                        <span className="text-accent">{post.category}</span>
                                                        <span className="w-1 h-1 rounded-full bg-muted"></span>
                                                        <span>{post.date}</span>
                                                        <span className="w-1 h-1 rounded-full bg-muted"></span>
                                                        <span>{post.readTime}</span>
                                                    </div>
                                                    <h3 className="text-3xl md:text-4xl font-serif text-foreground leading-tight group-hover:text-accent group-hover:translate-x-3 transition-all duration-500">
                                                        {post.title}
                                                    </h3>
                                                    <p className="text-muted-foreground font-light leading-relaxed line-clamp-2 text-lg">
                                                        {post.excerpt}
                                                    </p>
                                                    <div className="pt-2 flex items-center gap-3 text-accent text-xs uppercase tracking-widest font-bold opacity-0 group-hover:opacity-100 transition-opacity duration-500 transform translate-y-2 group-hover:translate-y-0">
                                                        Read Analysis <ArrowRight className="w-4 h-4" />
                                                    </div>
                                                </div>
                                                <div className="hidden md:block w-48 h-32 shrink-0 rounded-sm overflow-hidden opacity-70 group-hover:opacity-100 transition-all duration-700 grayscale group-hover:grayscale-0 shadow-lg border border-border group-hover:border-accent/50">
                                                    <img src={post.coverImage} alt={post.title} className="w-full h-full object-cover" />
                                                </div>
                                            </Link>
                                        </article>
                                    ))
                                ) : (
                                    <div className="py-20 text-center text-muted-foreground">
                                        <p>No articles found in this category.</p>
                                        <Link href="/blog" className="text-accent hover:underline mt-4 inline-block">Browse all articles</Link>
                                    </div>
                                )}
                            </div>

                            {posts.length > 0 && (
                                <div className="flex justify-center mt-16">
                                    <button className="group flex items-center gap-3 px-10 py-4 rounded-none border border-border hover:border-accent/50 text-foreground transition-all hover:bg-accent/10">
                                        <span className="text-xs uppercase tracking-[0.2em] font-bold">Load More Insights</span>
                                    </button>
                                </div>
                            )}
                        </div>

                        <CategorySidebar />
                    </div>
                </div>
            </main>
        </div>
    );
}

export default function CategoryPage({ params }: { params: { slug: string } }) {
    return (
        <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center"><div className="text-foreground">Loading category...</div></div>}>
            <CategoryPageContent params={params} />
        </Suspense>
    );
}
