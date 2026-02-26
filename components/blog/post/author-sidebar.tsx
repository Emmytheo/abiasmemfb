"use client";

import Link from "next/link";
import { BlogPost } from "@/lib/api";
import { useState, useEffect } from "react";

interface BlogPostAuthorSidebarProps {
    post: BlogPost;
}

export function BlogPostAuthorSidebar({ post }: BlogPostAuthorSidebarProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [activeSection, setActiveSection] = useState("");
    const [headings, setHeadings] = useState<{ id: string; text: string; level: string }[]>([]);

    useEffect(() => {
        // Function to find headings and set up TOC
        const initTOC = () => {
            // We need to wait for the content to be rendered. 
            // In a real app with SSG/SSR, it should be there, but good to be safe.
            const headingElements = document.querySelectorAll('.prose h2, .prose h3');
            const extractedHeadings: { id: string; text: string; level: string }[] = [];

            headingElements.forEach((el) => {
                if (el.id && el.textContent) {
                    extractedHeadings.push({
                        id: el.id,
                        text: el.textContent,
                        level: el.tagName.toLowerCase()
                    });
                }
            });

            setHeadings(extractedHeadings);
        };

        // Run initially
        initTOC();

        // Also run on a small delay to ensure hydration/render
        const timeoutId = setTimeout(initTOC, 500);

        const handleScroll = () => {
            const sections = document.querySelectorAll('h2[id], h3[id]');
            // Default to nothing if at top
            if (window.scrollY < 200) {
                setActiveSection("");
                return;
            }

            let current = "";
            sections.forEach((section) => {
                const sectionTop = (section as HTMLElement).offsetTop;
                // Offset of 250px feels natural for "reading" the section
                if (window.scrollY >= sectionTop - 250) {
                    current = section.getAttribute('id') || "";
                }
            });

            setActiveSection(current);
        };

        window.addEventListener("scroll", handleScroll);

        return () => {
            window.removeEventListener("scroll", handleScroll);
            clearTimeout(timeoutId);
        };
    }, []);

    return (
        <aside className="hidden lg:block w-[320px] shrink-0">
            <div className="sticky top-24 space-y-12">
                <div className="bg-card border border-border p-6 rounded-lg backdrop-blur-sm shadow-sm">
                    <div className="flex items-center gap-4 mb-4">
                        <img
                            alt={post.author.name}
                            className="w-16 h-16 rounded-full object-cover border-2 border-accent/20"
                            src={post.author.avatar}
                        />
                        <div>
                            <h4 className="text-card-foreground font-serif text-lg font-medium">{post.author.name}</h4>
                            <p className="text-accent text-xs uppercase tracking-wider">{post.author.role}</p>
                        </div>
                    </div>
                    <div className="relative">
                        <p className={`text-muted-foreground text-sm leading-relaxed mb-2 transition-all duration-300 ${isExpanded ? '' : 'line-clamp-2'}`}>
                            Former macro-economist at Global Bank turned micro-finance advocate. Helping communities
                            build resilience through strategic lending.
                        </p>
                        <button
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="text-xs text-accent font-bold hover:underline focus:outline-none"
                        >
                            {isExpanded ? "Read less" : "Read more"}
                        </button>
                    </div>

                    <div className="flex gap-4 mt-6">
                        <Link href="#" className="text-gray-400 hover:text-accent transition-colors">
                            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm3 8h-1.35c-.538 0-.65.221-.65.778v1.222h2l-.209 2h-1.791v7h-3v-7h-2v-2h2v-2.308c0-1.769.931-2.692 3.029-2.692.844 0 1.887.044 1.887.044v2.073z"></path></svg>
                        </Link>
                        <Link href="#" className="text-gray-400 hover:text-accent transition-colors">
                            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path></svg>
                        </Link>
                        <Link href="#" className="text-gray-400 hover:text-accent transition-colors">
                            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"></path></svg>
                        </Link>
                    </div>
                </div>

                {headings.length > 0 && (
                    <div className="border-l border-border pl-6">
                        <h5 className="text-foreground font-medium text-sm mb-6 flex items-center gap-2">
                            <span className="material-symbols-outlined text-base text-accent">format_list_bulleted</span>
                            On this page
                        </h5>
                        <ul className="space-y-4 text-sm">
                            {headings.map((heading) => (
                                <li key={heading.id}>
                                    <Link
                                        href={`#${heading.id}`}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            document.getElementById(heading.id)?.scrollIntoView({ behavior: 'smooth' });
                                        }}
                                        className={`transition-colors block pl-6 border-l-2 -ml-[25px] ${activeSection === heading.id
                                            ? 'text-accent border-accent font-medium'
                                            : 'text-muted-foreground border-transparent hover:text-foreground hover:border-border'
                                            } ${heading.level === 'h3' ? 'ml-4' : ''}`}
                                    >
                                        {heading.text}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                <div className="p-6 bg-gradient-to-br from-primary/5 to-transparent border border-accent/20 rounded-lg">
                    <h5 className="text-foreground font-serif mb-2">Abia Daily</h5>
                    <p className="text-xs text-muted-foreground mb-4">Financial clarity in a chaotic world. Subscribe to our daily briefing.</p>
                    <button className="w-full py-2 bg-background text-foreground text-xs font-bold uppercase tracking-wider border border-border hover:border-accent hover:text-accent transition-all rounded-sm">
                        Subscribe
                    </button>
                </div>
            </div>
        </aside>
    );
}
