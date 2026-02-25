import { getBlogPostBySlug, getBlogPosts } from "@/lib/services/blog";
import { Suspense } from "react";
import { Clock, Calendar, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BlogPostSocialSidebar } from "@/components/blog/post/social-sidebar";
import { BlogPostAuthorSidebar } from "@/components/blog/post/author-sidebar";
import { BlogPostMobileActions } from "@/components/blog/post/mobile-actions";
import { ReadingProgress } from "@/components/blog/post/reading-progress";

// Generate static params for basic SSG behavior (optional but good for known slugs)
export async function generateStaticParams() {
    const posts = await getBlogPosts();
    return posts.map((post) => ({
        slug: post.slug,
    }));
}

async function BlogPostPageContent({ params }: { params: { slug: string } }) {
    const { slug } = await params;
    const post = await getBlogPostBySlug(slug);

    if (!post) {
        notFound();
    }

    return (
        <article className="min-h-screen bg-background transition-colors duration-300 pb-20">
            <ReadingProgress />
            {/* Hero Header */}
            <div className="relative h-[60vh] min-h-[500px] w-full overflow-hidden">
                <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: `url('${post.coverImage}')` }}
                ></div>
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent"></div>

                <div className="absolute bottom-0 left-0 w-full p-8 md:p-16 lg:p-20">
                    <div className="max-w-4xl mx-auto">
                        <Link href="/blog" className="inline-flex items-center text-gray-300 hover:text-white mb-6 transition-colors group">
                            <ChevronLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" />
                            Back to Blog
                        </Link>
                        <div className="flex items-center gap-4 mb-4">
                            <span className="px-3 py-1 bg-accent text-primary text-xs font-bold rounded-full uppercase tracking-wider">
                                {post.category}
                            </span>
                            <span className="flex items-center gap-1 text-sm text-gray-300">
                                <Clock className="w-4 h-4" /> {post.readTime}
                            </span>
                        </div>
                        <h1 className="text-3xl md:text-5xl lg:text-6xl font-display font-bold text-white leading-tight mb-8">
                            {post.title}
                        </h1>
                        <div className="flex items-center gap-4">
                            <img src={post.author.avatar} alt={post.author.name} className="w-12 h-12 rounded-full border-2 border-white/20" />
                            <div>
                                <p className="text-white font-bold text-lg">{post.author.name}</p>
                                <p className="text-gray-400 text-sm">{post.author.role}</p>
                            </div>
                            <span className="text-gray-500 mx-2">|</span>
                            <span className="flex items-center gap-2 text-gray-300">
                                <Calendar className="w-4 h-4" /> {post.date}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="layout-container flex flex-col lg:flex-row justify-center px-4 sm:px-6 lg:px-8 py-16 lg:py-16 relative bg-background gap-16 max-w-[1440px] mx-auto">
                <BlogPostSocialSidebar />

                <article className="max-w-[720px] w-full text-lg leading-loose text-foreground font-light mx-auto lg:mx-0">
                    <div className="prose prose-lg dark:prose-invert max-w-none prose-headings:font-display prose-headings:font-bold prose-headings:text-foreground prose-a:text-accent hover:prose-a:text-primary transition-colors">
                        <div dangerouslySetInnerHTML={{ __html: post.content }} />
                    </div>
                </article>

                <BlogPostAuthorSidebar post={post} />
                <BlogPostMobileActions />
            </div>
        </article>
    );
}

export default function BlogPostPage({ params }: { params: { slug: string } }) {
    return (
        <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center">Loading article...</div>}>
            <BlogPostPageContent params={params} />
        </Suspense>
    );
}
