import { ArrowUpRight, Filter, LayoutGrid } from "lucide-react";

export function LatestPerspectives() {
    return (
        <section className="w-full bg-primary/5 dark:bg-background py-20 px-6 lg:px-12 transition-colors duration-300">
            <div className="max-w-7xl mx-auto flex flex-col gap-12">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-border pb-6">
                    <div>
                        <h2 className="text-foreground text-3xl md:text-4xl font-display font-normal">Latest Perspectives</h2>
                        <p className="text-muted-foreground mt-2 font-light">Curated insights for the modern investor.</p>
                    </div>
                    <div className="flex gap-2">
                        <button className="p-2 rounded-full border border-border hover:border-accent text-foreground hover:text-accent transition-colors">
                            <Filter className="w-5 h-5" />
                        </button>
                        <button className="p-2 rounded-full border border-border hover:border-accent text-foreground hover:text-accent transition-colors">
                            <LayoutGrid className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Grid Layout matches the HTML structure exactly */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-8">
                    {/* Main Featured Article (Left Large) */}
                    <article className="col-span-1 md:col-span-12 lg:col-span-8 relative group overflow-hidden rounded-xl h-[500px] cursor-pointer">
                        <div
                            className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                            style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuAjqMwfUvbem6NmeIxaW9_lzLJ4MMeT4PYeI1NvwIalBppypNd0LpJ2qd8Lz1xD0DVRMvCOuuTJi72VyEoUxEYkRUWsYjPR4HNyQQehy7DwYh_hWXvlPIps8nArYt0KWlKKNlXMBFHeqfnVttBI0NMzN2ynx5byk0bh7hzqr3p7Y1DvcVfM1B9yx6hp6iUn6xYWzo4M3o_9yT47oQ91Z0SVJ1corz0C7O7mpDGRGDQkQva6I9XurJaYqUpHxEaWXg7POgOm-ddUVBW2')" }}
                        ></div>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent"></div>
                        <div className="absolute bottom-0 left-0 w-full p-8 flex flex-col gap-3">
                            <div className="flex items-center gap-4 text-xs font-bold tracking-widest uppercase text-accent mb-2">
                                <span>Industry</span>
                                <span className="w-1 h-1 bg-white rounded-full"></span>
                                <span>6 Min Read</span>
                            </div>
                            <h3 className="text-3xl md:text-5xl font-display text-white leading-tight max-w-3xl group-hover:text-accent transition-colors duration-300">
                                The Rise of Aba's Shoe Industry: A Global Perspective
                            </h3>
                            <p className="text-gray-300 line-clamp-2 max-w-2xl mt-2 font-light">
                                How local craftsmanship is meeting international standards and redefining the export market for leather goods.
                            </p>
                        </div>
                    </article>

                    {/* Sidebar Column (Right) */}
                    <div className="col-span-1 md:col-span-12 lg:col-span-4 flex flex-col gap-6">
                        {/* Text Article Card */}
                        <article className="flex-1 bg-card rounded-xl p-6 border border-border hover:border-accent/30 transition-colors group cursor-pointer flex flex-col justify-between shadow-sm">
                            <div>
                                <div className="flex justify-between items-start mb-4">
                                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Wealth</span>
                                    <ArrowUpRight className="w-5 h-5 text-muted-foreground group-hover:text-accent transition-colors" />
                                </div>
                                <h4 className="text-xl font-medium text-foreground group-hover:text-accent transition-colors mb-2">
                                    5 Saving Habits for SME Owners
                                </h4>
                                <p className="text-muted-foreground text-sm leading-relaxed">
                                    Practical steps to separate personal finances from business capital.
                                </p>
                            </div>
                            <div className="flex items-center gap-3 mt-6">
                                <div className="w-8 h-8 rounded-full bg-muted ring-2 ring-background overflow-hidden">
                                    <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuA7vjK0jgumMRstat4Bbf8PF1UIF2zrHXTi8bHy5mf84txLaBli2CWGkrtwRNbBA709rgUZT7wvpy99X0sCyUN_jOyve4Ly1NYRhatrsgJFAae4sHuCZvNxoHRrprswKE44YVVergKNPpIx102dpdT2cYrGs8utBI_Y6sHTaso1TQogXQRVViDeIbSvLGTora6M_AhgAf2B936HKvOPqrQvrxLYe-FxlzxkV4gd7t3aqlYmNQ4uh_0SBI9OLt58mnKZIZ_A8YaYAlCq" alt="Author" className="w-full h-full object-cover" />
                                </div>
                                <span className="text-xs text-muted-foreground">By Chinedu Okeke</span>
                            </div>
                        </article>

                        {/* Quote Card */}
                        <article className="flex-1 bg-accent rounded-xl p-8 flex flex-col justify-center items-center text-center relative overflow-hidden">
                            <span className="text-6xl text-primary/10 absolute top-4 left-4 font-serif">"</span>
                            <blockquote className="relative z-10 text-primary font-display text-xl md:text-2xl italic leading-snug">
                                "Wealth is not about having a lot of money; it's about having a lot of options."
                            </blockquote>
                            <cite className="relative z-10 mt-4 text-primary/70 text-sm font-bold not-italic tracking-wide">— DAILY MANTRA</cite>
                        </article>
                    </div>

                    {/* Bottom Row Articles */}
                    <article className="col-span-1 md:col-span-6 relative group rounded-xl overflow-hidden aspect-[4/3] cursor-pointer">
                        <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                            style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuAlTRmx7Cf4tpwc2uid4-RAbljqYFrwbmRxXkjWWIt4WCBpipzOsdCsw4mR-ThvMlwLdW4yqi5p8QZiW0CRJGX-YQUKX3rA22_pwZEnm3xxl8gpboQKpbnKmDjel3FqGC5YW3Yo4q4v681GTpbwnK3SSRmX1Lmtb0QaeXALlVzr8IPP1LOeWYNNDswAMVFMikY8UaHQgGmtDQdGKe1PB5THZvN5OL-4aZIfLtkepDcsMltrrIqnQJKKUAM87oTdHiPjFWtl5koDW9Q5')" }}></div>
                        <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors"></div>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent opacity-90"></div>
                        <div className="absolute bottom-0 left-0 p-6 w-full">
                            <span className="text-accent text-xs font-bold uppercase tracking-widest mb-2 block">Technology</span>
                            <h3 className="text-2xl font-display text-white mb-1 group-hover:text-accent transition-colors">Digital Banking Trends 2024</h3>
                        </div>
                    </article>

                    <article className="col-span-1 md:col-span-6 relative group rounded-xl overflow-hidden aspect-[4/3] cursor-pointer">
                        <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                            style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuAIMy_3NYaJcxVTiD1xRxWGsstjjtRhm2Qoc-ikjB7srEz5ZP7lFuf7BkCz3lmROEipm2iABYUNPmIMoms7l0PdjHXCzGTtKBFvzffmVqPdsIZ4WVWLs_bpB1m8rSfRtzBiUBLxTpDsWfDzhaAAxDt_-N-X9Ll3Db7iJuRgj-IhVOWx-r4BVK2LFFUC66gTiKbNVc2tjib7P1DdA8NcbYtua-Y235dNc9did0m2M6AWBw6J6T5Yl-QtH7XOVxqX5Hg9p9poyrBvJR55')" }}></div>
                        <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors"></div>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent opacity-90"></div>
                        <div className="absolute bottom-0 left-0 p-6 w-full">
                            <span className="text-accent text-xs font-bold uppercase tracking-widest mb-2 block">Community</span>
                            <h3 className="text-2xl font-display text-white mb-1 group-hover:text-accent transition-colors">Women in Business</h3>
                        </div>
                    </article>

                </div>

                <div className="flex justify-center pt-8">
                    <button className="px-8 py-3 rounded-full border border-border text-foreground hover:bg-accent/10 hover:text-accent transition-all text-sm font-medium tracking-wide uppercase">
                        Load More Articles
                    </button>
                </div>

            </div>
        </section>
    );
}
