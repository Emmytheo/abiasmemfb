"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
    ArrowRight,
    ShieldCheck,
    Globe,
    Smartphone,
    Send,
    CheckCircle2,
    Store,
    CreditCard,
    Shield,
    Hash,
    Lock,
    Eye,
    EyeOff,
    GraduationCap,
    Wifi,
    BatteryFull,
    Fingerprint,
    Sparkles,
    ArrowDownLeft,
    ArrowUpRight,
} from "lucide-react";
import { useBankProfile } from "@/context/bank-profile-context";
import { TestimonialsBand } from "@/components/home/nnmfb-sections";
import { Logo } from "@/components/ui/logo";

export default function InternetBankingPage() {
    const { activeProfile } = useBankProfile();
    const [hideBalance, setHideBalance] = useState(false);
    const [phoneView, setPhoneView] = useState<"dashboard" | "schoolpay" | "ussd">("dashboard");
    const [ussdPreset, setUssdPreset] = useState<"balance" | "transfer" | "airtime" | "school">("balance");

    const heroBg = activeProfile.themeStyle.heroBgHex || "#070D59";
    const topBarBg = activeProfile.themeStyle.topBarBgHex || "#040836";
    const accentHex = activeProfile.themeStyle.accentHex || "#F4C414";

    const ussdResponses: Record<typeof ussdPreset, { code: string; title: string; screen: string }> = {
        balance: {
            code: `${activeProfile.ussdCode.replace("#", "")}*00#`,
            title: "Instant Balance Check",
            screen: `${activeProfile.shortName} Balance\nAcct: ${activeProfile.demoAccountNumber}\nAvail: NGN 2,485,320.00\nLedger: NGN 2,510,320.00`,
        },
        transfer: {
            code: `${activeProfile.ussdCode.replace("#", "")}*50000*0123456789#`,
            title: "Instant NIP / Internal Transfer",
            screen: `Send NGN 50,000.00 to\nCdr. I. Musa (NIBSS)\nFee: NGN 0.00 (Same-Bank)\nEnter 4-digit PIN to confirm:`,
        },
        airtime: {
            code: `${activeProfile.ussdCode.replace("#", "")}*1000#`,
            title: "Self & Family Airtime",
            screen: `Top up NGN 1,000.00\nLine: 0803 *** 0910\nInstant zero-fee vend.\nReply 1 to Confirm`,
        },
        school: {
            code: `${activeProfile.ussdCode.replace("#", "")}*4*88201#`,
            title: "School Fee Quick Pay",
            screen: `${activeProfile.internalPayBrand}\nPay NGN 85,000.00\nTuition: Term 2 Invoice\nReply 1 for E-Receipt`,
        },
    };

    const solutions = [
        {
            icon: Store,
            tag: "Merchant & Agent",
            title: `${activeProfile.posBrandName}`,
            desc: `Accept card and transfer payments anywhere with smart Android ${activeProfile.shortName} POS terminals engineered for zero-downtime settlement.`,
            bullets: [
                "Instant T+0 merchant wallet settlement",
                "Card, QR & Pay-with-Transfer support",
                "Real-time branch & agent reconciliation",
            ],
            ctaLabel: "Request POS Terminal",
            ctaHref: "/business#agency",
        },
        {
            icon: CreditCard,
            tag: "Contactless EMV",
            title: "Verge & Debit Cards",
            desc: "Transact securely across ATMs, POS terminals, and global e-commerce checkouts with instant in-app card freeze and spend controls.",
            bullets: [
                "Nationwide ATM, POS & Web acceptance",
                "Contactless tap-to-pay ready",
                "Self-service PIN & channel limits",
            ],
            ctaLabel: "Apply for a Card",
            ctaHref: "/business#cards",
        },
        {
            icon: Hash,
            tag: "Zero Data Required",
            title: `USSD Code ${activeProfile.ussdCode}`,
            desc: `Bank offline from any feature or smartphone via ${activeProfile.ussdCode}. Check balances, transfer funds, and pay tuition in seconds.`,
            bullets: [
                "Works seamlessly without internet data",
                "PIN-protected offline settlement",
                "24/7 airtime, bills & school levy payments",
            ],
            ctaLabel: "Activate USSD",
            ctaHref: "/auth/register",
        },
        {
            icon: Smartphone,
            tag: "iOS & Android",
            title: `${activeProfile.shortName} Mobile App`,
            desc: "Self-onboard with BVN in under 3 minutes, set automated salary sweeps, track cooperative shares, and download verified PDF receipts.",
            bullets: [
                "Available on Google Play & App Store",
                "Biometric FaceID & Fingerprint sign-in",
                "Standing orders & Esusu circle tracker",
            ],
            ctaLabel: "Launch Mobile Banking",
            ctaHref: "/auth/register",
        },
        {
            icon: Globe,
            tag: "Retail & Treasury",
            title: "iBank Internet Portal",
            desc: "Full-screen web command center for individuals and corporate finance teams managing bulk payroll, vendor invoices, and approvals.",
            bullets: [
                "Multi-user maker/checker approvals",
                "CSV batch payroll & statutory schedules",
                "Live audit logs & statement exports",
            ],
            ctaLabel: "iBank Login",
            ctaHref: "/auth/login",
        },
        {
            icon: Shield,
            tag: "CBN & NDIC Compliant",
            title: "Digital Security Architecture",
            desc: "End-to-end TLS encryption, hardware security tokens, real-time anomaly blocking, and instant SMS/email debit alerts on every move.",
            bullets: [
                "Multi-factor authentication & device lock",
                "Automated velocity & fraud shielding",
                "Instant suspicious-session revocation",
            ],
            ctaLabel: "Security Center",
            ctaHref: "/support",
        },
    ];

    return (
        <div className="bg-background text-foreground">
            {/* 1. Dual Overlapping Smartphone Studio Hero */}
            <section
                className="relative overflow-hidden pt-28 sm:pt-36 pb-20 lg:pb-28 text-white"
                style={{
                    background: `radial-gradient(circle at 82% 24%, rgba(244, 196, 20, 0.18), transparent 45%), linear-gradient(155deg, ${heroBg} 0%, ${topBarBg} 100%)`,
                }}
            >
                <div
                    className="pointer-events-none absolute inset-0 opacity-[0.07]"
                    style={{
                        backgroundImage:
                            "linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)",
                        backgroundSize: "56px 56px",
                    }}
                />

                <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-14 lg:gap-10 items-center">
                    {/* Left Copy & Telemetry */}
                    <div className="lg:col-span-6 space-y-6">
                        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/15 backdrop-blur-md text-xs font-mono uppercase tracking-[0.18em]">
                            <Sparkles className="w-3.5 h-3.5" style={{ color: accentHex }} />
                            <span style={{ color: accentHex }}>Omnichannel Digital Banking</span>
                        </div>

                        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-black tracking-tight leading-[1.06]">
                            Every Rail.{" "}
                            <span style={{ color: accentHex }}>Zero Friction.</span>
                        </h1>

                        <p className="text-base sm:text-lg text-slate-200 leading-relaxed max-w-xl">
                            Bank effortlessly across mobile app, iBank web treasury, offline{" "}
                            <strong className="text-white">{activeProfile.ussdCode}</strong> USSD, contactless debit cards, and smart{" "}
                            <strong className="text-white">{activeProfile.posBrandName}</strong> terminals on {activeProfile.shortName}.
                        </p>

                        <div className="flex flex-wrap gap-3.5 pt-2">
                            <Link
                                href="/auth/login"
                                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold text-sm text-slate-950 shadow-lg hover:brightness-105 transition-all"
                                style={{ backgroundColor: accentHex }}
                            >
                                Access iBank Portal <ArrowRight className="w-4 h-4" />
                            </Link>
                            <Link
                                href="/auth/register"
                                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold text-sm text-white bg-white/10 hover:bg-white/15 border border-white/20 backdrop-blur-md transition-all"
                            >
                                Self-Onboard with BVN
                            </Link>
                        </div>

                        {/* Channel Status Strip */}
                        <div className="pt-4 grid grid-cols-3 gap-3 max-w-lg">
                            {[
                                { label: "USSD Dial", value: activeProfile.ussdCode },
                                { label: "Onboarding", value: "3-Min BVN" },
                                { label: "Core SLA", value: "99.98% Up" },
                            ].map((item, idx) => (
                                <div
                                    key={idx}
                                    className="rounded-xl p-3 bg-white/[0.06] border border-white/10"
                                >
                                    <div className="text-[10px] font-mono uppercase text-slate-400">
                                        {item.label}
                                    </div>
                                    <div className="text-xs sm:text-sm font-display font-bold text-white mt-0.5">
                                        {item.value}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right Interactive Dual Smartphone Studio */}
                    <div className="lg:col-span-6 relative flex items-center justify-center min-h-[500px] sm:min-h-[540px]">
                        {/* Background Phone: BVN Self-Registration Studio */}
                        <motion.div
                            initial={{ opacity: 0, x: 24, rotate: 4 }}
                            animate={{ opacity: 1, x: 0, rotate: 6 }}
                            transition={{ duration: 0.6, delay: 0.1 }}
                            className="hidden sm:flex flex-col w-[265px] h-[470px] rounded-[2.4rem] bg-white text-slate-900 p-4 shadow-2xl border-[6px] border-slate-900/90 absolute right-2 lg:right-0 top-6 opacity-95"
                        >
                            <div className="flex items-center justify-between px-2 pb-3 text-[10px] font-mono font-bold text-slate-400">
                                <span>9:41</span>
                                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                                    BVN KYC
                                </span>
                            </div>

                            <div className="space-y-3 flex-1">
                                <div className="flex items-center gap-2">
                                    <Logo iconOnly iconClassName="w-7 h-7 shrink-0" />
                                    <div>
                                        <div className="text-xs font-black text-slate-900">
                                            Self-Registration
                                        </div>
                                        <div className="text-[10px] text-slate-500">
                                            Instant Tier-3 Activation
                                        </div>
                                    </div>
                                </div>

                                <div className="rounded-2xl p-3 bg-slate-50 border border-slate-200 space-y-2">
                                    <div className="text-[10px] font-mono uppercase text-slate-400">
                                        11-Digit BVN Verified
                                    </div>
                                    <div className="font-mono text-xs font-bold tracking-widest text-slate-800">
                                        223 •••• 8914
                                    </div>
                                    <div className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600">
                                        <CheckCircle2 className="w-3 h-3" /> Identity Matched
                                    </div>
                                </div>

                                <div className="rounded-2xl p-3 bg-slate-50 border border-slate-200 space-y-1.5">
                                    <div className="text-[10px] font-mono uppercase text-slate-400">
                                        Assigned NUBAN Account
                                    </div>
                                    <div className="font-mono text-sm font-black text-primary">
                                        {activeProfile.demoAccountNumber}
                                    </div>
                                    <div className="text-[10px] text-slate-500">
                                        Instant NIP &amp; {activeProfile.internalPayBrand} enabled
                                    </div>
                                </div>

                                <div className="rounded-2xl p-3 border border-dashed border-slate-300 flex items-center gap-2.5">
                                    <Fingerprint className="w-5 h-5 text-primary shrink-0" />
                                    <div className="text-[11px] font-semibold text-slate-700 leading-tight">
                                        Biometric Device Binding Active
                                    </div>
                                </div>
                            </div>

                            <div
                                className="w-full py-2.5 rounded-xl text-center text-[11px] font-bold text-white"
                                style={{ backgroundColor: heroBg }}
                            >
                                Continue to Dashboard
                            </div>
                        </motion.div>

                        {/* Foreground Interactive Phone: Live Mobile App */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                            className="relative z-20 w-[300px] sm:w-[310px] rounded-[2.6rem] bg-slate-950 p-3 shadow-[0_32px_90px_-12px_rgba(0,0,0,0.7)] border border-white/20"
                        >
                            {/* Hardware Notch Bar */}
                            <div className="flex items-center justify-between px-4 pt-1 pb-2.5 text-[10px] font-mono text-slate-300">
                                <span>9:41</span>
                                <div className="w-16 h-3.5 rounded-full bg-black border border-white/10" />
                                <div className="flex items-center gap-1.5">
                                    <Wifi className="w-3 h-3" />
                                    <BatteryFull className="w-3.5 h-3.5" />
                                </div>
                            </div>

                            {/* Inner App Screen */}
                            <div className="rounded-[2rem] bg-slate-900 border border-white/10 overflow-hidden p-4 space-y-4">
                                {/* App Header */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Logo iconOnly iconClassName="w-6 h-6 shrink-0" />
                                        <span className="text-xs font-display font-bold text-white">
                                            {activeProfile.shortName} Mobile
                                        </span>
                                    </div>
                                    <span
                                        className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold text-slate-950"
                                        style={{ backgroundColor: accentHex }}
                                    >
                                        TIER 3
                                    </span>
                                </div>

                                {/* Account Balance Card */}
                                <div
                                    className="rounded-2xl p-4 space-y-2 border border-white/15"
                                    style={{
                                        background: `linear-gradient(145deg, ${heroBg} 0%, ${topBarBg} 100%)`,
                                    }}
                                >
                                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-300">
                                        <span>SAVINGS • {activeProfile.demoAccountNumber}</span>
                                        <button
                                            type="button"
                                            onClick={() => setHideBalance((v) => !v)}
                                            className="p-1 rounded-md hover:bg-white/10 transition-colors"
                                            aria-label="Toggle balance visibility"
                                        >
                                            {hideBalance ? (
                                                <EyeOff className="w-3.5 h-3.5" />
                                            ) : (
                                                <Eye className="w-3.5 h-3.5" />
                                            )}
                                        </button>
                                    </div>
                                    <div className="text-xl font-display font-black tracking-tight text-white">
                                        {hideBalance ? "₦ •••,•••.••" : "₦2,485,320.00"}
                                    </div>
                                </div>

                                {/* Interactive Phone View Tabs */}
                                <div className="grid grid-cols-3 gap-1.5 bg-slate-950 p-1 rounded-xl border border-white/10">
                                    {[
                                        { key: "dashboard" as const, icon: Send, label: "Activity" },
                                        { key: "schoolpay" as const, icon: GraduationCap, label: "School" },
                                        { key: "ussd" as const, icon: Hash, label: "USSD" },
                                    ].map((tab) => {
                                        const Icon = tab.icon;
                                        const active = phoneView === tab.key;
                                        return (
                                            <button
                                                key={tab.key}
                                                type="button"
                                                onClick={() => setPhoneView(tab.key)}
                                                className={`py-2 rounded-lg text-[10px] font-bold flex flex-col items-center gap-1 transition-all ${
                                                    active
                                                        ? "bg-white text-slate-950 shadow-sm"
                                                        : "text-slate-400 hover:text-white"
                                                }`}
                                            >
                                                <Icon className="w-3.5 h-3.5" />
                                                <span>{tab.label}</span>
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* Dynamic Inner Screen Body */}
                                {phoneView === "dashboard" && (
                                    <div className="space-y-2.5">
                                        <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                                            Recent Instant Clearing
                                        </div>
                                        {[
                                            {
                                                title: "Salary NIP Credit",
                                                sub: "09:12 AM • NIBSS Instant",
                                                amt: "+₦420,000",
                                                inflow: true,
                                            },
                                            {
                                                title: activeProfile.id === "nnmfb" ? "Navy Sec. School Levy" : `${activeProfile.shortName} Tuition Pay`,
                                                sub: "Yesterday • E-Receipt",
                                                amt: "-₦85,000",
                                                inflow: false,
                                            },
                                            {
                                                title: "Esusu Circle Dividend",
                                                sub: "Automated Cooperative",
                                                amt: "+₦64,500",
                                                inflow: true,
                                            },
                                        ].map((tx, idx) => (
                                            <div
                                                key={idx}
                                                className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.04] border border-white/5"
                                            >
                                                <div className="flex items-center gap-2.5 min-w-0">
                                                    <div
                                                        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                                                            tx.inflow
                                                                ? "bg-emerald-500/15 text-emerald-400"
                                                                : "bg-amber-500/15 text-amber-400"
                                                        }`}
                                                    >
                                                        {tx.inflow ? (
                                                            <ArrowDownLeft className="w-3.5 h-3.5" />
                                                        ) : (
                                                            <ArrowUpRight className="w-3.5 h-3.5" />
                                                        )}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="text-[11px] font-bold text-white truncate">
                                                            {tx.title}
                                                        </div>
                                                        <div className="text-[9px] text-slate-400 truncate">
                                                            {tx.sub}
                                                        </div>
                                                    </div>
                                                </div>
                                                <span
                                                    className={`text-[11px] font-mono font-bold shrink-0 ${
                                                        tx.inflow ? "text-emerald-400" : "text-slate-200"
                                                    }`}
                                                >
                                                    {tx.amt}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {phoneView === "schoolpay" && (
                                    <div className="rounded-2xl p-3.5 bg-white/[0.05] border border-white/10 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold text-white">
                                                {activeProfile.internalPayBrand}
                                            </span>
                                            <span className="text-[10px] font-mono text-emerald-400">
                                                LIVE BURSARY
                                            </span>
                                        </div>
                                        <div className="text-[11px] text-slate-300 space-y-1">
                                            <div>Student ID: NNS/2026/0419</div>
                                            <div>Session: Term 2 Tuition &amp; Boarding</div>
                                            <div className="font-mono font-bold text-white pt-1">
                                                Total: ₦85,000.00
                                            </div>
                                        </div>
                                        <Link
                                            href="/business#collections"
                                            className="block w-full py-2 rounded-lg text-center text-[11px] font-bold text-slate-950"
                                            style={{ backgroundColor: accentHex }}
                                        >
                                            Open Receipt Simulator
                                        </Link>
                                    </div>
                                )}

                                {phoneView === "ussd" && (
                                    <div className="rounded-2xl p-3.5 bg-white/[0.05] border border-white/10 space-y-2.5 font-mono">
                                        <div className="text-[10px] text-slate-400 uppercase">
                                            Offline GSM String
                                        </div>
                                        <div
                                            className="text-lg font-black"
                                            style={{ color: accentHex }}
                                        >
                                            {activeProfile.ussdCode}
                                        </div>
                                        <p className="text-[11px] text-slate-300 font-sans leading-relaxed">
                                            Works with zero mobile data on MTN, Airtel, Glo &amp; 9mobile across Nigeria.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* 2. Interactive USSD Simulator Strip */}
            <section className="py-12 bg-slate-950 text-white border-y border-white/10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                    <div className="lg:col-span-5 space-y-3">
                        <div className="inline-flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.2em]" style={{ color: accentHex }}>
                            <Hash className="w-3.5 h-3.5" />
                            <span>Interactive USSD Preview</span>
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-display font-black">
                            Bank Anywhere with{" "}
                            <span style={{ color: accentHex }}>{activeProfile.ussdCode}</span>
                        </h2>
                        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                            Tap any action below to preview real-time GSM banking without internet connectivity.
                        </p>
                        <div className="flex flex-wrap gap-2 pt-1">
                            {(
                                [
                                    { key: "balance", label: "Check Balance" },
                                    { key: "transfer", label: "Transfer Funds" },
                                    { key: "airtime", label: "Buy Airtime" },
                                    { key: "school", label: "Pay School Fees" },
                                ] as const
                            ).map((btn) => (
                                <button
                                    key={btn.key}
                                    type="button"
                                    onClick={() => setUssdPreset(btn.key)}
                                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                                        ussdPreset === btn.key
                                            ? "text-slate-950"
                                            : "bg-white/10 text-slate-200 hover:bg-white/15"
                                    }`}
                                    style={
                                        ussdPreset === btn.key
                                            ? { backgroundColor: accentHex }
                                            : undefined
                                    }
                                >
                                    {btn.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="lg:col-span-7">
                        <div className="rounded-2xl p-6 bg-white/[0.04] border border-white/12 font-mono space-y-3">
                            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400 border-b border-white/10 pb-3">
                                <span>DIALED: <strong className="text-white">{ussdResponses[ussdPreset].code}</strong></span>
                                <span style={{ color: accentHex }}>{ussdResponses[ussdPreset].title}</span>
                            </div>
                            <pre className="text-xs sm:text-sm text-emerald-300 whitespace-pre-wrap leading-relaxed font-mono">
                                {ussdResponses[ussdPreset].screen}
                            </pre>
                        </div>
                    </div>
                </div>
            </section>

            {/* 3. 6-Channel Digital Banking Bento Grid */}
            <section className="py-20 lg:py-28 bg-white dark:bg-background">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-14">
                    <div className="text-center max-w-2xl mx-auto space-y-3">
                        <span className="inline-block text-[11px] font-mono font-bold uppercase tracking-[0.2em] text-primary dark:text-accent">
                            Full Omnichannel Suite
                        </span>
                        <h2 className="text-3xl sm:text-4xl font-display font-black text-foreground tracking-tight">
                            Six Integrated Digital Channels
                        </h2>
                        <p className="text-sm sm:text-base text-muted-foreground">
                            Built for speed, reliability, and effortless inclusion across {activeProfile.legalName}.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {solutions.map((item, idx) => {
                            const Icon = item.icon;
                            return (
                                <div
                                    key={idx}
                                    className="group rounded-3xl p-7 sm:p-8 bg-slate-50/80 dark:bg-card border border-border/80 hover:border-primary/40 dark:hover:border-accent/40 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between gap-6"
                                >
                                    <div className="space-y-5">
                                        <div className="flex items-center justify-between">
                                            <div
                                                className="w-12 h-12 rounded-2xl flex items-center justify-center transition-transform duration-300 group-hover:scale-105"
                                                style={{
                                                    backgroundColor: `${heroBg}12`,
                                                    color: heroBg,
                                                }}
                                            >
                                                <Icon className="w-6 h-6 dark:text-accent" />
                                            </div>
                                            <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-white dark:bg-background border border-border text-muted-foreground">
                                                {item.tag}
                                            </span>
                                        </div>

                                        <div className="space-y-2">
                                            <h3 className="text-xl font-display font-black text-foreground">
                                                {item.title}
                                            </h3>
                                            <p className="text-sm text-muted-foreground leading-relaxed">
                                                {item.desc}
                                            </p>
                                        </div>

                                        <ul className="space-y-2 pt-1">
                                            {item.bullets.map((bullet, b) => (
                                                <li
                                                    key={b}
                                                    className="flex items-start gap-2.5 text-xs font-medium text-foreground/90"
                                                >
                                                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                                                    <span>{bullet}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    <div className="pt-5 border-t border-border/60">
                                        <Link
                                            href={item.ctaHref}
                                            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary dark:text-accent hover:gap-3 transition-all"
                                        >
                                            <span>{item.ctaLabel}</span>
                                            <ArrowRight className="w-3.5 h-3.5" />
                                        </Link>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Security Guarantee Callout */}
                    <div className="rounded-3xl p-8 bg-slate-900 dark:bg-slate-950 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border border-white/10">
                        <div className="flex items-start gap-4">
                            <div
                                className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center shrink-0"
                                style={{ color: accentHex }}
                            >
                                <Lock className="w-6 h-6" />
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-lg font-display font-bold">
                                    Protected by Multi-Layered Prudential &amp; Cyber Safeguards
                                </h3>
                                <p className="text-xs sm:text-sm text-slate-300">
                                    Need help locking a card or verifying an account? Call our 24/7 digital desk on{" "}
                                    <strong className="text-white">{activeProfile.supportPhones[0]}</strong>.
                                </p>
                            </div>
                        </div>
                        <Link
                            href="/support"
                            className="px-5 py-3 rounded-xl font-bold text-xs uppercase tracking-wider text-slate-950 shrink-0"
                            style={{ backgroundColor: accentHex }}
                        >
                            24/7 Support Desk
                        </Link>
                    </div>
                </div>
            </section>

            {/* 4. Dark Glassmorphic Customer Voices */}
            <TestimonialsBand />
        </div>
    );
}
