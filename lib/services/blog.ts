export interface BlogPost {
    slug: string;
    title: string;
    excerpt: string;
    content: string; // HTML or Markdown
    coverImage: string;
    author: {
        name: string;
        role: string;
        avatar: string;
    };
    date: string;
    category: string;
    tags: string[];
    featured: boolean;
    readTime: string;
}

export const MOCK_POSTS: BlogPost[] = [
    {
        slug: "navigating-micro-lending",
        title: "Navigating Micro-Lending in a Macro-Economic Shift",
        excerpt: "In the grand theater of global economics, the spotlight rarely lingers on the micro. Yet, as tectonic plates shift beneath the financial world...",
        content: `
            <div class="drop-cap mb-10 text-xl text-white/90">
                <p>
                    In the grand theater of global economics, the spotlight rarely lingers on the micro. Yet, as
                    tectonic plates shift beneath the financial world—driven by inflationary pressures, digital
                    transformation, and changing consumer behaviors—it is the micro-lending sector that finds itself
                    at the epicenter of a quiet revolution. Financial inclusion isn't just a metric; it's the
                    bedrock of sustainable community growth, and today, it faces its most significant test in
                    decades.
                </p>
            </div>
            <p class="mb-10 text-white/90">
                The traditional models of micro-financing were built on interpersonal trust and physical proximity.
                Loan officers walked the streets, knew the families, and collected repayments in cash. Today, that
                intimacy is being digitized, not erased. The challenge lies in translating the nuance of a handshake
                into the binary of an algorithm without losing the humanity that makes micro-finance effective.
            </p>
            <div class="my-10 p-6 border border-accent/20 bg-gradient-gold rounded-sm relative group overflow-hidden">
                <div class="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <span class="material-symbols-outlined text-6xl text-accent">mark_email_read</span>
                </div>
                <h4 class="text-accent font-serif text-xl font-bold mb-2">Weekly Market Intelligence</h4>
                <p class="text-sm text-white/80 mb-4 max-w-md">Get exclusive financial insights and micro-economic
                    trend analysis delivered directly to your inbox every Monday.</p>
                <div class="flex gap-2">
                    <input
                        class="bg-surface-dark border-white/10 text-white text-sm py-2 px-3 rounded-sm w-full focus:ring-1 focus:ring-accent focus:border-accent"
                        placeholder="Email address" type="email" />
                    <button
                        class="bg-accent text-background-dark text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-sm hover:bg-white transition-colors">Subscribe</button>
                </div>
            </div>
            <h2 class="text-2xl md:text-3xl font-serif font-semibold text-accent mt-16 mb-8" id="digital-paradox">
                The Digital Paradox</h2>
            <p class="mb-10 text-white/90">
                While digital adoption accelerates access, it also introduces a new layer of risk. We are witnessing
                a bifurcation in the market: institutions that leverage data to empower their clients, and those
                that use it merely to insulate themselves from risk. At AbiaSMEMFB, we believe the former is the only
                sustainable path forward.
            </p>
            <figure className="my-14 relative pl-8 py-2">
                <blockquote class="text-2xl md:text-4xl font-serif italic text-white/95 leading-relaxed">
                    "True financial resilience isn't about avoiding risk entirely; it's about building the capacity
                    to weather the storm when it inevitably arrives."
                </blockquote>
            </figure>
            <p class="mb-10 text-white/90">
                When we look at the data from the past fiscal quarter, the resilience of small-scale entrepreneurs
                is evident. Despite rising interest rates, repayment rates in the micro-segment have remained
                surprisingly robust compared to mid-market corporate loans. This counter-intuitive trend suggests
                that for the micro-entrepreneur, credit is not a leverage tool for expansion, but a lifeline for
                survival and operational continuity.
            </p>
            <div
                class="my-14 rounded-sm bg-surface-dark overflow-hidden border border-white/10 shadow-2xl shadow-black/50">
                <div class="relative w-full aspect-video">
                    <img alt="Chart"
                        class="object-cover w-full h-full opacity-80 hover:opacity-100 transition-opacity duration-500"
                        data-alt="Data visualization showing upward trend of micro-finance repayment rates"
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuCh_wEYxrRFl9EmNRKvC317gfqh-o63uFlxmmoBjmouI9WB4ZAEXtdpJZu3XcKIYOyXmh6Vp1sXOv4IQuxluLHXPWP_YxNs5V4AD8mH_9fSbAyZP3ygqDd4mIxI7EX9sYyy061qKpVyenyLG4EYuS1ko0DUDQj3uzB17RFAxHF4MlVlDSNi4xKuPQwsN74Z4T6Bf5bOpME-A_v5ErC-Yjk1L6KLiOK3Am4z1zgMYRrbZ-E2WTvQlcizVg5YK532ScIOG_OrcXQvs62m" />
                    <div
                        class="absolute bottom-0 left-0 w-full bg-gradient-to-t from-background-dark to-transparent p-8 pt-24">
                        <div
                            class="flex items-center gap-2 text-accent text-xs font-bold tracking-widest uppercase mb-2">
                            <span class="material-symbols-outlined text-sm">bar_chart_4_bars</span>
                            <span>Market Analysis</span>
                        </div>
                        <p class="text-white font-serif text-lg">Q3 2023 Repayment Resilience Index</p>
                    </div>
                </div>
                <div
                    class="p-4 bg-surface-dark text-sm text-text-muted border-t border-white/5 flex justify-between items-center">
                    <span>Source: AbiaSMEMFB internal data & Global Findex</span>
                    <button
                        class="text-accent hover:text-white transition-colors flex items-center gap-1 text-xs font-bold uppercase tracking-wider">
                        Expand <span class="material-symbols-outlined text-sm">open_in_full</span>
                    </button>
                </div>
            </div>
            <h3 class="text-xl md:text-2xl font-serif font-medium text-accent mt-16 mb-6" id="strategic-adaptation">
                Strategic Adaptation</h3>
            <p class="mb-10 text-white/90">
                Adaptation requires a two-pronged approach. First, <a
                    class="text-accent hover:text-white transition-colors underline underline-offset-4 decoration-accent/50"
                    href="#">product flexibility</a> must become the norm. Rigid repayment schedules that ignore the
                seasonality of agricultural or trade-based incomes are destined to fail. Second, financial literacy
                education must move from a "nice-to-have" add-on to a core component of the lending process.
            </p>
            <div class="my-12 p-1 border-y border-white/10 bg-surface-dark/30">
                <div class="flex items-center gap-4 py-4">
                    <div
                        class="flex-shrink-0 size-12 bg-accent/10 rounded-full flex items-center justify-center text-accent">
                        <span class="material-symbols-outlined">diamond</span>
                    </div>
                    <div>
                        <h5 class="text-white font-serif font-medium text-lg">Abia Private Wealth</h5>
                        <p class="text-sm text-text-muted">Explore our bespoke investment vehicles for
                            high-net-worth individuals.</p>
                    </div>
                    <div class="ml-auto">
                        <span
                            class="material-symbols-outlined text-accent group-hover:translate-x-1 transition-transform">arrow_forward</span>
                    </div>
                </div>
            </div>
            <p class="mb-10 text-white/90">
                We are piloting new programs that integrate gamified learning modules directly into our mobile
                banking app. Early results show a 15% increase in on-time repayments among users who engage with
                these modules. This data reinforces our hypothesis: an informed borrower is a better borrower.
            </p>
            <div class="my-14">
                <div
                    class="relative w-full aspect-video rounded-sm overflow-hidden group cursor-pointer bg-surface-dark border border-white/10 shadow-2xl">
                    <img alt="Video Thumb"
                        class="object-cover w-full h-full opacity-50 group-hover:opacity-30 transition-all duration-500 scale-100 group-hover:scale-105"
                        data-alt="Meeting room with diverse team discussing financial strategies"
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuACqOM0xTjzPJyH4O8zLoljZREJByG-6fWmnBnaB-TpZFLb5QCpoaPe-gMlNgp2lnXIOCdRpTJRjubfoLr8HWkUF5KKt3izbiwgVCKR1SrWsMmieRtZMA6I6pmWzvft3qnL38wIh6HtK-TcQg-qFJ6f5olRkez1KkI9GA6AWpRCFzo1PN4JgMPbrh56FKSTYUjLzF5h0hrDRWsvNDJikN59ZbRBohNJvqPEPTZOcTY44K3atXaSOBBp5695naxoiyPDobXHen01-ruk" />
                    <div class="absolute inset-0 flex items-center justify-center">
                        <div
                            class="size-20 rounded-full border border-accent/50 bg-accent/20 backdrop-blur-md text-accent flex items-center justify-center shadow-[0_0_40px_rgba(212,175,55,0.3)] group-hover:scale-110 group-hover:bg-accent group-hover:text-background-dark transition-all duration-300">
                            <span class="material-symbols-outlined text-[40px] ml-1">play_arrow</span>
                        </div>
                    </div>
                    <div class="absolute bottom-8 left-8 right-8">
                        <p class="text-white font-serif text-xl font-medium">Watch: The Future of Community Banking
                        </p>
                        <p class="text-gray-400 text-sm mt-2">Interview with AbiaSMEMFB CEO, 4:20</p>
                    </div>
                </div>
            </div>
            <h3 class="text-xl md:text-2xl font-serif font-medium text-accent mt-16 mb-6" id="future-outlook">
                Future Outlook</h3>
            <p class="mb-14 text-white/90">
                As we look toward the next fiscal year, the path is clear. We must double down on technology that
                enables human connection rather than replacing it. The macroeconomic shifts are undeniable, but so
                is the potential of the micro-economy to drive recovery. It is a delicate balance, but one we are
                committed to striking.
            </p>
            <div class="flex items-center gap-2 mb-12">
                <div class="h-px bg-white/10 flex-1"></div>
                <span class="text-accent material-symbols-outlined">more_horiz</span>
                <div class="h-px bg-white/10 flex-1"></div>
            </div>
            <div class="flex flex-wrap gap-3 mb-16">
                <span
                    class="px-5 py-2.5 rounded-full bg-surface-dark text-text-muted text-xs font-medium uppercase tracking-wider border border-white/10 hover:border-accent/50 hover:text-white transition-all cursor-pointer">#MicroFinance</span>
                <span
                    class="px-5 py-2.5 rounded-full bg-surface-dark text-text-muted text-xs font-medium uppercase tracking-wider border border-white/10 hover:border-accent/50 hover:text-white transition-all cursor-pointer">#Economics</span>
                <span
                    class="px-5 py-2.5 rounded-full bg-surface-dark text-text-muted text-xs font-medium uppercase tracking-wider border border-white/10 hover:border-accent/50 hover:text-white transition-all cursor-pointer">#FinTech</span>
                <span
                    class="px-5 py-2.5 rounded-full bg-surface-dark text-text-muted text-xs font-medium uppercase tracking-wider border border-white/10 hover:border-accent/50 hover:text-white transition-all cursor-pointer">#GrowthStrategy</span>
            </div>
        `,
        coverImage: "https://lh3.googleusercontent.com/aida-public/AB6AXuAdnp4e1xsBAexwXj32BjwtDvuspIxpyYXJ5UqJUpB1xoj63NzWSWBTZ6slpVuYBrX1o47wfBbTWukMm8dNVbU4wYoP15koTE3pU7GzwSF3zYTdxPVOVOVM9tkkNOLckFPPkYS4XaLJRLGP9mRdwRkX0GFAUk9LdERB07I2Rtrfl9wlAAzI3wfuwHYOHLggxPuLrYGHoVy70kDfaHQ54j5cflan4fsHrXdtJLtVu0z29tVEiysxq2W6DakIdaOku6N04E85Q5_JKrW0",
        author: {
            name: "Sarah Jenkins",
            role: "Chief Financial Strategist",
            avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuB2uPGRNpBHfcMPcE-Z_BVM_Ci4AhCvT-DGwNZa6HxFuvs_fDU6WTPxFQ71prG2EMBBCi7Y2BgXJsgM0jgBB58dOk8xA1J081o_BGdKDQC8o_WsMVVuBQZO3t6XKQmwdBjfZxuPSoEzoWIPExFVByJRk22IKRBpabAazMZ7fjdJh5ZO5bhUWE_u_uhiwRLk4g8chlIdZLYyTFJQ8tL7BuGCcTGdIrsxY4ngs7x6u2dKFOEQw6xfDQSuQmYtuo_x8J6gqHC_TDv5rqYr",
        },
        date: "Oct 24, 2023",
        category: "Wealth Management",
        tags: ["MicroFinance", "Economics", "FinTech"],
        featured: true,
        readTime: "8 min read",
    },
    {
        slug: "driving-financial-inclusion",
        title: "Driving Financial Inclusion: The AbiaSMEMFB Impact",
        excerpt: "Exploring how microfinance is transforming lives in rural communities across Abia State through accessible credit and financial literacy.",
        content: "<p>Full content would go here...</p>",
        coverImage: "https://images.unsplash.com/photo-1579621970588-a35d0e7ab9b6?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
        author: {
            name: "Dr. Ngozi Okonjo",
            role: "Chief Economist",
            avatar: "https://i.pravatar.cc/150?u=ngozi",
        },
        date: "Mar 15, 2024",
        category: "Impact",
        tags: ["Financial Inclusion", "Community", "Development"],
        featured: true,
        readTime: "5 min read",
    },
    {
        slug: "small-business-guide-2024",
        title: "The Ultimate Guide to Scaling Your SME in 2024",
        excerpt: "Practical strategies for small business owners to leverage digital banking tools and optimize cash flow in a challenging economy.",
        content: "<p>Full content would go here...</p>",
        coverImage: "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?ixlib=rb-4.0.3&auto=format&fit=crop&w=2064&q=80",
        author: {
            name: "Chinedu Ibe",
            role: "SME Consultant",
            avatar: "https://i.pravatar.cc/150?u=chinedu",
        },
        date: "Mar 10, 2024",
        category: "Business Advice",
        tags: ["SME", "Growth", "Strategy"],
        featured: false,
        readTime: "8 min read",
    },
    {
        slug: "digital-banking-security",
        title: "Staying Safe: Advanced Security Features in Our New App",
        excerpt: "A deep dive into the biometric and encryption technologies securing your transactions on the new AbiaSMEMFB mobile platform.",
        content: "<p>Full content would go here...</p>",
        coverImage: "https://images.unsplash.com/photo-1563986768609-322da13575f3?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80",
        author: {
            name: "Tech Team",
            role: "Security Division",
            avatar: "https://i.pravatar.cc/150?u=tech",
        },
        date: "Feb 28, 2024",
        category: "Technology",
        tags: ["Security", "Digital Banking", "Mobile App"],
        featured: false,
        readTime: "4 min read",
    },
];

export async function getBlogPosts(): Promise<BlogPost[]> {
    return new Promise((resolve) => setTimeout(() => resolve(MOCK_POSTS), 300));
}

export async function getBlogPostBySlug(slug: string): Promise<BlogPost | undefined> {
    return MOCK_POSTS.find((p) => p.slug === slug);
}


export async function getFeaturedPosts(): Promise<BlogPost[]> {
    return MOCK_POSTS.filter((p) => p.featured);
}

export async function getPostsByCategory(categorySlug: string): Promise<BlogPost[]> {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 300));

    // Normalize functionality: slugify the category string for comparison if needed, 
    // or just match loose string equality for this mock. 
    // For better matching, we might want to normalize both side.
    // For now, simple case-insensitive partial match or exact match on "Category" field 
    // which is free text in the mock.

    const normalizedSlug = categorySlug.toLowerCase().replace(/-/g, ' ');

    return MOCK_POSTS.filter((p) =>
        p.category.toLowerCase().includes(normalizedSlug) ||
        normalizedSlug.includes(p.category.toLowerCase())
    );
}

export async function getPopularPosts(): Promise<BlogPost[]> {
    return MOCK_POSTS.slice(0, 3);
}

export async function getAllTags(): Promise<string[]> {
    const tags = new Set<string>();
    MOCK_POSTS.forEach(post => {
        post.tags.forEach(tag => tags.add(tag));
    });
    return Array.from(tags);
}
