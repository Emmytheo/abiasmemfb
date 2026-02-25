import { Download } from "lucide-react";

export function FinancialJournal() {
    return (
        <section className="w-full bg-gray-50 dark:bg-[#0f1629] py-24 px-6 lg:px-12 border-t border-gray-200 dark:border-white/5 transition-colors duration-300">
            <div className="max-w-7xl mx-auto">
                <div className="text-center max-w-2xl mx-auto mb-16">
                    <h2 className="text-3xl md:text-5xl text-gray-900 dark:text-white font-display mb-4">The Financial Journal</h2>
                    <p className="text-gray-600 dark:text-gray-400 font-light">Deep dives into the fiscal landscape. Download premium whitepapers and annual reports.</p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10 lg:gap-16 max-w-5xl mx-auto">
                    {/* Book 1 */}
                    <div className="group flex flex-col items-center">
                        <div className="relative w-[280px] h-[380px] bg-gradient-to-br from-[#1a2540] to-[#0B1121] rounded-r-lg border-l-4 border-l-gray-700 shadow-2xl transform transition-all duration-500 group-hover:-translate-y-4 group-hover:rotate-1 flex flex-col justify-between overflow-hidden">
                            {/* Spine Effect */}
                            <div className="absolute top-0 left-0 w-8 h-full bg-gradient-to-r from-transparent to-black/20 pointer-events-none z-10"></div>
                            <div className="p-8 relative z-0">
                                <div className="w-12 h-1 bg-accent mb-6"></div>
                                <h3 className="text-3xl font-display text-white leading-tight">Fiscal<br />Year<br /><span className="text-accent italic">2023</span></h3>
                                <p className="text-gray-500 text-xs uppercase tracking-widest mt-4">Annual Report</p>
                            </div>
                            <div className="p-8 bg-black/20 backdrop-blur-sm border-t border-white/5">
                                <p className="text-gray-400 text-xs mb-2">Released: Jan 2024</p>
                                <span className="text-white font-bold text-sm flex items-center gap-2 group-hover:text-accent transition-colors">
                                    Download PDF <Download className="w-4 h-4" />
                                </span>
                            </div>
                        </div>
                        <div className="mt-8 text-center opacity-0 group-hover:opacity-100 transition-opacity duration-500 transform translate-y-2 group-hover:translate-y-0">
                            <p className="text-gray-500 dark:text-gray-400 text-sm max-w-xs">Comprehensive breakdown of AbiaSMEMFB's yearly performance and community impact.</p>
                        </div>
                    </div>

                    {/* Book 2 */}
                    <div className="group flex flex-col items-center">
                        <div className="relative w-[280px] h-[380px] bg-gradient-to-br from-accent/10 to-[#0B1121] rounded-r-lg border-l-4 border-l-gray-700 shadow-2xl transform transition-all duration-500 group-hover:-translate-y-4 group-hover:-rotate-1 flex flex-col justify-between overflow-hidden">
                            <div className="absolute top-0 left-0 w-8 h-full bg-gradient-to-r from-transparent to-black/20 pointer-events-none z-10"></div>
                            <div className="p-8 relative z-0">
                                <div className="w-12 h-1 bg-white mb-6"></div>
                                <h3 className="text-3xl font-display text-white leading-tight">SME<br />Growth<br /><span className="italic text-gray-400">Tactics</span></h3>
                                <p className="text-gray-500 text-xs uppercase tracking-widest mt-4">Whitepaper</p>
                            </div>
                            <div className="p-8 bg-black/20 backdrop-blur-sm border-t border-white/5">
                                <p className="text-gray-400 text-xs mb-2">Released: Mar 2024</p>
                                <span className="text-white font-bold text-sm flex items-center gap-2 group-hover:text-accent transition-colors">
                                    Download PDF <Download className="w-4 h-4" />
                                </span>
                            </div>
                        </div>
                        <div className="mt-8 text-center opacity-0 group-hover:opacity-100 transition-opacity duration-500 transform translate-y-2 group-hover:translate-y-0">
                            <p className="text-gray-500 dark:text-gray-400 text-sm max-w-xs">Expert strategies for scaling small businesses in emerging markets.</p>
                        </div>
                    </div>

                    {/* Book 3 */}
                    <div className="group flex flex-col items-center">
                        <div className="relative w-[280px] h-[380px] bg-gradient-to-br from-[#2a2a2a] to-[#000] rounded-r-lg border-l-4 border-l-gray-600 shadow-2xl transform transition-all duration-500 group-hover:-translate-y-4 group-hover:rotate-1 flex flex-col justify-between overflow-hidden">
                            <div className="absolute top-0 left-0 w-8 h-full bg-gradient-to-r from-transparent to-black/20 pointer-events-none z-10"></div>
                            <div className="p-8 relative z-0">
                                <div className="w-12 h-1 bg-accent mb-6"></div>
                                <h3 className="text-3xl font-display text-white leading-tight">The<br />Export<br /><span className="text-accent italic">Guide</span></h3>
                                <p className="text-gray-500 text-xs uppercase tracking-widest mt-4">Special Edition</p>
                            </div>
                            <div className="p-8 bg-black/20 backdrop-blur-sm border-t border-white/5">
                                <p className="text-gray-400 text-xs mb-2">Released: May 2024</p>
                                <span className="text-white font-bold text-sm flex items-center gap-2 group-hover:text-accent transition-colors">
                                    Download PDF <Download className="w-4 h-4" />
                                </span>
                            </div>
                        </div>
                        <div className="mt-8 text-center opacity-0 group-hover:opacity-100 transition-opacity duration-500 transform translate-y-2 group-hover:translate-y-0">
                            <p className="text-gray-500 dark:text-gray-400 text-sm max-w-xs">Navigating international trade regulations for Nigerian manufacturers.</p>
                        </div>
                    </div>

                </div>
            </div>
        </section>
    );
}
