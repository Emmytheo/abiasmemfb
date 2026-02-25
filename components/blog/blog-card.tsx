import Image from "next/image";
import Link from "next/link";
import { type BlogPost } from "@/lib/services/blog";
import { Clock, Tag } from "lucide-react";

export function BlogCard({ post }: { post: BlogPost }) {
    return (
        <article className="flex flex-col bg-card rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 border border-border group h-full">
            <div className="relative h-64 overflow-hidden">
                <Link href={`/blog/${post.slug}`}>
                    <img
                        src={post.coverImage}
                        alt={post.title}
                        className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </Link>
                <div className="absolute top-4 left-4">
                    <span className="px-3 py-1 bg-accent/90 backdrop-blur-sm text-primary text-xs font-bold rounded-full uppercase tracking-wider">
                        {post.category}
                    </span>
                </div>
            </div>
            <div className="flex-1 p-6 flex flex-col">
                <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                    <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {post.readTime}
                    </span>
                    <span>•</span>
                    <span>{post.date}</span>
                </div>
                <Link href={`/blog/${post.slug}`}>
                    <h3 className="text-xl font-bold text-card-foreground mb-3 group-hover:text-accent transition-colors line-clamp-2">
                        {post.title}
                    </h3>
                </Link>
                <p className="text-muted-foreground text-sm line-clamp-3 mb-6 flex-1">
                    {post.excerpt}
                </p>
                <div className="flex items-center justify-between pt-6 border-t border-border">
                    <div className="flex items-center gap-3">
                        <img
                            src={post.author.avatar}
                            alt={post.author.name}
                            className="w-8 h-8 rounded-full border border-border"
                        />
                        <div>
                            <p className="text-xs font-bold text-card-foreground">{post.author.name}</p>
                            <p className="text-[10px] text-muted-foreground">{post.author.role}</p>
                        </div>
                    </div>
                </div>
            </div>
        </article>
    );
}
