"use server";

import { api } from "@/lib/api";
import Link from "next/link";
import { ExternalLink, Pencil, Trash2, Eye, FileText, Clock } from "lucide-react";

function StatusBadge({ status }: { status: string }) {
    const styles: Record<string, string> = {
        published: "bg-emerald-500/10 text-emerald-600 border-emerald-200",
        draft: "bg-amber-500/10 text-amber-600 border-amber-200",
        archived: "bg-muted text-muted-foreground border-border",
    };
    const s = (status || "draft").toLowerCase();
    return (
        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-xs font-semibold capitalize ${styles[s] || styles.draft}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
            {s}
        </span>
    );
}

export async function BlogManagementContent() {
    let posts: any[] = [];
    let error: string | null = null;

    try {
        posts = await api.getBlogPosts();
    } catch (e: any) {
        error = e?.message || "Failed to load blog posts";
    }

    if (error) {
        return (
            <div className="bg-destructive/5 border border-destructive/20 rounded-2xl p-8 text-center">
                <FileText className="h-10 w-10 text-destructive/50 mx-auto mb-3" />
                <p className="font-semibold text-destructive">Error loading posts</p>
                <p className="text-sm text-muted-foreground mt-1">{error}</p>
            </div>
        );
    }

    if (posts.length === 0) {
        return (
            <div className="bg-card border border-border rounded-2xl p-12 text-center">
                <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
                    <FileText className="h-8 w-8 text-muted-foreground/40" />
                </div>
                <h3 className="text-lg font-bold mb-2">No posts yet</h3>
                <p className="text-muted-foreground text-sm mb-6">Start growing your blog by creating your first post.</p>
                <Link
                    href="/blog-management/create"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl font-semibold text-sm shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all"
                >
                    Create First Post
                </Link>
            </div>
        );
    }

    return (
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
            {/* Header */}
            <div className="px-6 py-5 border-b border-border flex items-center justify-between bg-muted/10">
                <div>
                    <h2 className="text-lg font-bold">All Posts</h2>
                    <p className="text-sm text-muted-foreground">{posts.length} article{posts.length !== 1 ? "s" : ""} in total</p>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-border bg-muted/20">
                            <th className="px-6 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">Title</th>
                            <th className="px-4 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground hidden md:table-cell">Category</th>
                            <th className="px-4 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground hidden lg:table-cell">Author</th>
                            <th className="px-4 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground hidden sm:table-cell">Date</th>
                            <th className="px-4 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">Status</th>
                            <th className="px-4 py-3.5 text-right text-xs font-bold uppercase tracking-wider text-muted-foreground">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {posts.map((post, i) => (
                            <tr key={post.slug + i} className="hover:bg-muted/20 transition-colors group">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="h-10 w-16 rounded-lg object-cover bg-muted/50 flex-shrink-0 overflow-hidden"
                                            style={post.coverImage ? { backgroundImage: `url(${post.coverImage})`, backgroundSize: "cover" } : {}}
                                        />
                                        <div className="min-w-0">
                                            <p className="font-semibold text-foreground truncate max-w-[240px]">{post.title}</p>
                                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                                <Clock className="h-3 w-3" />
                                                {post.readTime}
                                            </p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-4 py-4 hidden md:table-cell">
                                    <span className="px-2.5 py-1 rounded-lg bg-primary/5 text-primary border border-primary/10 text-xs font-medium">
                                        {post.category}
                                    </span>
                                </td>
                                <td className="px-4 py-4 hidden lg:table-cell">
                                    <div className="flex items-center gap-2">
                                        <img src={post.author.avatar} alt={post.author.name} className="w-6 h-6 rounded-full object-cover" />
                                        <span className="text-sm text-muted-foreground">{post.author.name}</span>
                                    </div>
                                </td>
                                <td className="px-4 py-4 text-muted-foreground hidden sm:table-cell">{post.date}</td>
                                <td className="px-4 py-4">
                                    <StatusBadge status="published" />
                                </td>
                                <td className="px-4 py-4">
                                    <div className="flex items-center justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                                        <Link
                                            href={`/blog/${post.slug}`}
                                            className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                                            title="Preview"
                                        >
                                            <Eye className="h-4 w-4" />
                                        </Link>
                                        <Link
                                            href={`/blog-management/${post.id}/edit`}
                                            className="p-1.5 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
                                            title="Edit Post"
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </Link>
                                        <Link
                                            href={`/blog/${post.slug}`}
                                            target="_blank"
                                            className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                                            title="Open on site"
                                        >
                                            <ExternalLink className="h-4 w-4" />
                                        </Link>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-border bg-muted/10 flex items-center justify-between">
                <p className="text-xs text-muted-foreground">Manage your content lifecycle directly from the dashboard</p>
                <Link
                    href="/admin/collections/posts"
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
                >
                    Advanced CMS View <ExternalLink className="h-3 w-3" />
                </Link>
            </div>
        </div>
    );
}
