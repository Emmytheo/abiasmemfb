import Link from "next/link";
import { api, BlogPost } from "@/lib/api";

export async function NewsInsights() {
    // Fetch posts and take the latest 3
    const posts = await api.getBlogPosts();
    const latestPosts = posts.slice(0, 3);

    return (
        <section className="py-24 bg-card transition-colors duration-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
                    <div className="max-w-2xl">
                        <h2 className="text-accent font-bold tracking-wider uppercase text-sm mb-3">News & Insights</h2>
                        <h3 className="text-3xl md:text-4xl font-display font-bold text-card-foreground">
                            Latest Updates from AbiaSMEMFB
                        </h3>
                    </div>
                    <Link
                        className="inline-flex items-center text-primary dark:text-accent font-semibold hover:underline group"
                        href="/blog"
                    >
                        View All Articles
                        <svg
                            className="ml-2 w-4 h-4 transform group-hover:translate-x-1 transition-transform"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
                        </svg>
                    </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {latestPosts.map((post) => (
                        <Link href={`/blog/${post.slug}`} key={post.slug} className="group cursor-pointer">
                            <article>
                                <div className="relative h-64 rounded-2xl overflow-hidden mb-6">
                                    <img
                                        alt={post.title}
                                        className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                                        src={post.coverImage}
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                </div>
                                <div className="flex items-center gap-4 text-xs font-semibold text-muted-foreground mb-3">
                                    <span className="text-primary tracking-wider">{post.category}</span>
                                    <span>•</span>
                                    <span>{post.date}</span>
                                </div>
                                <h4 className="text-xl font-bold text-card-foreground mb-2 group-hover:text-primary transition-colors">
                                    {post.title}
                                </h4>
                                <p className="text-muted-foreground line-clamp-2">
                                    {post.excerpt}
                                </p>
                            </article>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
}

