"use client";

import { useEffect, useState } from "react";
import { api, type BlogPost } from "@/lib/api";
import { BlogCard } from "@/components/blog/blog-card";
import { Search } from "lucide-react";

export default function BlogListingPage() {
    const [posts, setPosts] = useState<BlogPost[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchPosts() {
            try {
                const data = await api.getBlogPosts();
                setPosts(data);
            } finally {
                setLoading(false);
            }
        }
        fetchPosts();
    }, []);

    return (
        <div className="bg-background min-h-screen transition-colors duration-300">
            {/* Blog Hero */}
            <section className="relative bg-primary py-20 lg:py-28 pt-32 overflow-hidden">
                <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(#334155 1px, transparent 1px)", backgroundSize: "32px 32px" }}></div>
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-primary/90"></div>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
                    <span className="text-accent font-bold tracking-wider text-sm mb-4 uppercase inline-block">Insights & News</span>
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-white mb-6">
                        Latest Updates from <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-yellow-200">AbiaSMEMFB</span>
                    </h1>
                    <p className="text-lg text-gray-300 max-w-2xl mx-auto mb-10">
                        Discover financial tips, company news, and stories of impact from our community.
                    </p>

                    {/* Search Bar */}
                    <div className="max-w-2xl mx-auto relative">
                        <input
                            type="text"
                            placeholder="Search articles..."
                            className="w-full h-14 pl-14 pr-6 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:bg-white/20 focus:border-accent transition-all"
                        />
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    </div>
                </div>
            </section>

            {/* Main Content */}
            <section className="py-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Categories (Simple tabs for now) */}
                    <div className="flex justify-center gap-4 mb-16 flex-wrap">
                        {['All Posts', 'Company News', 'Financial Tips', 'Impact', 'Technology'].map((cat, idx) => (
                            <button key={cat} className={`px-5 py-2 rounded-full text-sm font-medium transition-colors border ${idx === 0 ? 'bg-primary text-primary-foreground border-primary' : 'bg-background text-muted-foreground border-border hover:bg-accent/50 hover:text-foreground'}`}>
                                {cat}
                            </button>
                        ))}
                    </div>

                    {/* Grid */}
                    {loading ? (
                        <div className="text-center py-20 text-gray-500">Loading articles...</div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {posts.map(post => (
                                <BlogCard key={post.slug} post={post} />
                            ))}
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}
