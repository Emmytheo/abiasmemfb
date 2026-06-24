"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, ShieldCheck, Zap, Globe, Smartphone, RefreshCw, Send, CheckCircle, Store, CreditCard, Banknote, Shield } from "lucide-react";

export default function InternetBankingPage() {
    return (
        <div className="animate-in fade-in duration-700 bg-background min-h-screen">
            {/* ── Dynamic Hero Header ── */}
            <header className="relative pt-32 pb-24 lg:pt-40 lg:pb-36 overflow-hidden">
                <div className="absolute inset-0 z-0 bg-slate-950">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/90 via-slate-950 to-slate-950"></div>
                    <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-primary/30 rounded-full blur-[120px] mix-blend-screen animate-pulse"></div>
                    <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-accent/20 rounded-full blur-[120px] mix-blend-screen animate-pulse delay-1000"></div>
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
                </div>

                <motion.div 
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8"
                >
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2, duration: 0.5 }}
                        className="inline-flex items-center gap-2 py-1.5 px-3.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md"
                    >
                        <Globe className="w-4 h-4 text-accent animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-white/90">ABIASMEMFB Digital Hub</span>
                    </motion.div>

                    <h1 className="text-4xl md:text-6xl lg:text-8xl font-display font-black text-white tracking-tight leading-[1.1] max-w-5xl mx-auto">
                        Your Bank, <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-accent to-amber-200">Beyond Boundaries.</span>
                    </h1>

                    <p className="max-w-2xl mx-auto text-lg md:text-xl text-slate-300 font-light leading-relaxed">
                        Experience the zenith of digital microfinance. Zero-rate intra-transfers, robust agency cashpoints, and instant merchant checkouts—all orchestrated from your pocket.
                    </p>

                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4, duration: 0.5 }}
                        className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
                    >
                        <Link href="/auth/login" className="w-full sm:w-auto px-8 py-4 bg-accent text-slate-950 font-bold rounded-2xl hover:bg-white transition-all duration-300 shadow-[0_0_40px_rgba(212,175,55,0.3)] flex items-center justify-center gap-2">
                            Access Portal <ArrowRight size={18} />
                        </Link>
                        <Link href="/business" className="w-full sm:w-auto px-8 py-4 bg-white/5 text-white border border-white/10 font-bold rounded-2xl hover:bg-white/10 backdrop-blur-md transition-all duration-300 flex items-center justify-center gap-2">
                            Open an Account
                        </Link>
                    </motion.div>
                </motion.div>
            </header>

            {/* ── Feature Grid ── */}
            <section className="py-24 relative z-20 bg-card">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center max-w-3xl mx-auto mb-16"
                    >
                        <h2 className="text-accent font-black tracking-widest uppercase text-xs mb-3">Enterprise Capabilities</h2>
                        <h3 className="text-3xl md:text-5xl font-display font-black text-foreground tracking-tight">
                            A Masterclass in Financial Technology
                        </h3>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Feature 1 */}
                        <motion.div 
                            whileHover={{ y: -8, scale: 1.02 }}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.4 }}
                            className="bg-background rounded-3xl p-8 border shadow-sm group hover:shadow-2xl transition-all duration-300 hover:border-primary/50 relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full -z-10 group-hover:bg-primary/10 transition-colors duration-500"></div>
                            <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-primary group-hover:shadow-[0_0_20px_rgba(var(--primary),0.4)] transition-all duration-300">
                                <Send className="w-6 h-6 text-primary group-hover:text-white transition-colors" />
                            </div>
                            <h4 className="text-xl font-bold text-foreground mb-3">Zero-Rate Intra Transfers</h4>
                            <p className="text-muted-foreground leading-relaxed text-sm">
                                Send and receive funds instantly between ABIASMEMFB accounts with absolutely zero hidden fees or deduction quotas.
                            </p>
                        </motion.div>

                        {/* Feature 2 */}
                        <motion.div 
                            whileHover={{ y: -8, scale: 1.02 }}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.4, delay: 0.1 }}
                            className="bg-background rounded-3xl p-8 border shadow-sm group hover:shadow-2xl transition-all duration-300 hover:border-accent/50 relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-bl-full -z-10 group-hover:bg-accent/10 transition-colors duration-500"></div>
                            <div className="w-14 h-14 bg-accent/10 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-accent group-hover:shadow-[0_0_20px_rgba(var(--accent),0.4)] transition-all duration-300">
                                <Store className="w-6 h-6 text-accent-foreground group-hover:text-slate-900 transition-colors" />
                            </div>
                            <h4 className="text-xl font-bold text-foreground mb-3">POS Agency Network</h4>
                            <p className="text-muted-foreground leading-relaxed text-sm">
                                Empower your neighborhood. Request a terminal, become an agent, and earn real-time commission splits directly to your float account.
                            </p>
                        </motion.div>

                        {/* Feature 3 */}
                        <motion.div 
                            whileHover={{ y: -8, scale: 1.02 }}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.4, delay: 0.2 }}
                            className="bg-background rounded-3xl p-8 border shadow-sm group hover:shadow-2xl transition-all duration-300 hover:border-emerald-500/50 relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-bl-full -z-10 group-hover:bg-emerald-500/10 transition-colors duration-500"></div>
                            <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-emerald-500 group-hover:shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all duration-300">
                                <CreditCard className="w-6 h-6 text-emerald-600 group-hover:text-white transition-colors" />
                            </div>
                            <h4 className="text-xl font-bold text-foreground mb-3">Merchant Payment Suite</h4>
                            <p className="text-muted-foreground leading-relaxed text-sm">
                                Generate secure API keys, listen to live Webhook events, and process online SME checkouts seamlessly.
                            </p>
                        </motion.div>

                        {/* Feature 4 */}
                        <motion.div 
                            whileHover={{ y: -8, scale: 1.02 }}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.4, delay: 0.3 }}
                            className="bg-background rounded-3xl p-8 border shadow-sm group hover:shadow-2xl transition-all duration-300 hover:border-blue-500/50 relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-bl-full -z-10 group-hover:bg-blue-500/10 transition-colors duration-500"></div>
                            <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-blue-500 group-hover:shadow-[0_0_20px_rgba(59,130,246,0.4)] transition-all duration-300">
                                <RefreshCw className="w-6 h-6 text-blue-600 group-hover:text-white transition-colors" />
                            </div>
                            <h4 className="text-xl font-bold text-foreground mb-3">Digital Esusu (Ajo)</h4>
                            <p className="text-muted-foreground leading-relaxed text-sm">
                                Join verified cooperative thrill cycles. Automate your daily/weekly contributions and receive bulk rotational payouts reliably.
                            </p>
                        </motion.div>

                        {/* Feature 5 */}
                        <motion.div 
                            whileHover={{ y: -8, scale: 1.02 }}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.4, delay: 0.4 }}
                            className="bg-background rounded-3xl p-8 border shadow-sm group hover:shadow-2xl transition-all duration-300 hover:border-rose-500/50 relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-bl-full -z-10 group-hover:bg-rose-500/10 transition-colors duration-500"></div>
                            <div className="w-14 h-14 bg-rose-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-rose-500 group-hover:shadow-[0_0_20px_rgba(244,63,94,0.4)] transition-all duration-300">
                                <Banknote className="w-6 h-6 text-rose-600 group-hover:text-white transition-colors" />
                            </div>
                            <h4 className="text-xl font-bold text-foreground mb-3">Core Loan Provisioning</h4>
                            <p className="text-muted-foreground leading-relaxed text-sm">
                                Apply for structured credit facilities online. Approved loans are auto-provisioned to your core ledger instantly.
                            </p>
                        </motion.div>

                        {/* Feature 6 */}
                        <motion.div 
                            whileHover={{ y: -8, scale: 1.02 }}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.4, delay: 0.5 }}
                            className="bg-background rounded-3xl p-8 border shadow-sm group hover:shadow-2xl transition-all duration-300 hover:border-slate-800/50 relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-slate-800/5 rounded-bl-full -z-10 group-hover:bg-slate-800/10 transition-colors duration-500"></div>
                            <div className="w-14 h-14 bg-slate-800/10 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-slate-800 group-hover:shadow-[0_0_20px_rgba(30,41,59,0.4)] transition-all duration-300">
                                <Shield className="w-6 h-6 text-slate-800 group-hover:text-white transition-colors" />
                            </div>
                            <h4 className="text-xl font-bold text-foreground mb-3">Bank-Grade Security</h4>
                            <p className="text-muted-foreground leading-relaxed text-sm">
                                Strict ledger transactional integrity ensures that your core balance represents absolute truth. CBN Licensed & NDIC Insured.
                            </p>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* ── Call To Action ── */}
            <section className="py-24 bg-primary text-primary-foreground relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('/img/pattern.svg')] opacity-10"></div>
                <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
                    <h2 className="text-3xl md:text-5xl font-display font-black mb-6">
                        Ready to transcend traditional banking?
                    </h2>
                    <p className="text-lg text-primary-foreground/80 mb-10 max-w-2xl mx-auto">
                        Sign up in minutes and access our suite of ultra-modern financial tools designed for ambitious individuals and growing enterprises.
                    </p>
                    <Link href="/auth/login" className="inline-flex items-center justify-center px-10 py-4 text-sm font-black uppercase tracking-widest rounded-full text-primary bg-white hover:bg-accent transition-all shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95">
                        Enter Internet Banking
                    </Link>
                </div>
            </section>
        </div>
    );
}
