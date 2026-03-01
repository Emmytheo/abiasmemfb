import { Suspense } from "react";
import { BlogManagementContent } from "@/components/dashboard/blog/blog-management-content";
import { FileText, PlusCircle, TrendingUp, Star } from "lucide-react";
import { api } from "@/lib/api";
import Link from "next/link";

async function BlogStats() {
    const posts = await api.getBlogPosts();
    const featured = posts.filter((p) => p.featured).length;

    return (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-card border border-border rounded-2xl p-5 flex items-center gap-4 shadow-sm hover:border-primary/30 transition-all group">
                <div className="p-3 rounded-xl bg-primary/10 text-primary group-hover:scale-110 transition-transform shrink-0">
                    <FileText className="h-5 w-5" />
                </div>
                <div>
                    <p className="text-2xl font-bold tracking-tight">{posts.length}</p>
                    <p className="text-sm text-muted-foreground font-medium">Total Posts</p>
                </div>
            </div>
            <div className="bg-card border border-border rounded-2xl p-5 flex items-center gap-4 shadow-sm hover:border-primary/30 transition-all group">
                <div className="p-3 rounded-xl bg-amber-500/10 text-amber-500 group-hover:scale-110 transition-transform shrink-0">
                    <Star className="h-5 w-5" />
                </div>
                <div>
                    <p className="text-2xl font-bold tracking-tight">{featured}</p>
                    <p className="text-sm text-muted-foreground font-medium">Featured</p>
                </div>
            </div>
            <div className="bg-card border border-border rounded-2xl p-5 flex items-center gap-4 shadow-sm hover:border-primary/30 transition-all group">
                <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-500 group-hover:scale-110 transition-transform shrink-0">
                    <TrendingUp className="h-5 w-5" />
                </div>
                <div>
                    <p className="text-2xl font-bold tracking-tight">{posts.length > 0 ? Math.ceil(posts.length / 4) : 0}</p>
                    <p className="text-sm text-muted-foreground font-medium">Categories</p>
                </div>
            </div>
        </div>
    );
}

export default function BlogManagementPage() {
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 p-4 sm:p-4 md:p-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-primary/70 mb-1">Content Hub</p>
                    <h1 className="text-3xl font-black tracking-tight">Blog Management</h1>
                    <p className="text-muted-foreground mt-1 max-w-xl">
                        Author-grade post lifecycle management — draft, publish, and surface insights to your community.
                    </p>
                </div>
                <Link
                    href="/admin/collections/posts/create"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl font-semibold text-sm shadow-lg shadow-primary/20 hover:bg-primary/90 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 shrink-0"
                >
                    <PlusCircle className="h-4 w-4" />
                    New Post
                </Link>
            </div>

            {/* Stats */}
            <Suspense fallback={
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="bg-muted/30 animate-pulse rounded-2xl h-24" />
                    ))}
                </div>
            }>
                <BlogStats />
            </Suspense>

            {/* Main Table */}
            <Suspense fallback={
                <div className="bg-card border rounded-2xl overflow-hidden">
                    <div className="p-6 border-b">
                        <div className="h-7 w-48 bg-muted/50 rounded-lg animate-pulse mb-2" />
                        <div className="h-4 w-72 bg-muted/30 rounded-lg animate-pulse" />
                    </div>
                    <div className="p-6 space-y-4">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="h-16 bg-muted/20 rounded-xl animate-pulse" />
                        ))}
                    </div>
                </div>
            }>
                <BlogManagementContent />
            </Suspense>
        </div>
    );
}
