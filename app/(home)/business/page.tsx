"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import {
    CheckCircle, ArrowRight, HeartHandshake, Store, Users, Bike, Rocket,
    Banknote, Sprout, ScrollText, Building, Loader2, CreditCard, ShieldCheck,
    Sparkles, Landmark, Phone, MapPin, Briefcase, Code, Smartphone, Zap,
    QrCode, Lock, Unlock, Check, Calculator, Building2, GraduationCap, Receipt
} from "lucide-react";
import { api } from "@/lib/api";
import { ProductType } from "@/lib/api/types";
import { useBankProfile } from "@/context/bank-profile-context";

// Helper to map dynamic icons for Database Loans
function getIconForLoan(name: string) {
    const l = name.toLowerCase();
    if (l.includes('poverty') || l.includes('women')) return <HeartHandshake size={24} />;
    if (l.includes('group') || l.includes('team')) return <Users size={24} />;
    if (l.includes('ride') || l.includes('bike')) return <Bike size={24} />;
    if (l.includes('start') || l.includes('nysc')) return <Rocket size={24} />;
    if (l.includes('salary') || l.includes('advance')) return <Banknote size={24} />;
    if (l.includes('agric') || l.includes('farm')) return <Sprout size={24} />;
    if (l.includes('lpo') || l.includes('contract')) return <ScrollText size={24} />;
    return <Store size={24} />;
}

type TabType = "business" | "collections" | "esusu" | "agency" | "merchant" | "cards" | "credit";

export default function Business() {
    const { activeProfile } = useBankProfile();
    // Tab Control State
    const [activeTab, setActiveTab] = useState<TabType>("business");
    const [schoolTier, setSchoolTier] = useState<"primary" | "secondary" | "tertiary">("secondary");
    const [studentRef, setStudentRef] = useState("NNSS-2026-0418");
    const [feePaid, setFeePaid] = useState(false);

    // Dynamic Database Loan Products
    const [products, setProducts] = useState<ProductType[]>([]);
    const [loadingLoans, setLoadingLoans] = useState(true);

    useEffect(() => {
        api.getAllProductTypes()
            .then(types => {
                const isLoanCategory = (catName: string) => {
                    const name = catName.toLowerCase();
                    return name.includes("loan") || name.includes("credit") || name.includes("mortgage");
                };
                setProducts(types.filter(t => isLoanCategory(t.category) && t.status === 'active'));
                setLoadingLoans(false);
            })
            .catch(() => {
                setLoadingLoans(false);
            });
    }, []);

    // Interactive States: Business Suite Savings Yield
    const [savingsDeposit, setSavingsDeposit] = useState<number>(500000);
    const [savingsTenure, setSavingsTenure] = useState<number>(12); // months

    const calculateSmeYield = (deposit: number, tenure: number) => {
        // High yield premium of 12.5% per annum
        const rate = 0.125;
        const interest = deposit * rate * (tenure / 12);
        return interest;
    };

    // Interactive States: Cooperative Thrift Esusu
    const [esusuMembers, setEsusuMembers] = useState<number>(10);
    const [esusuContribution, setEsusuContribution] = useState<number>(50000);

    const esusuPoolSize = esusuMembers * esusuContribution;
    const esusuPlatformFee = esusuPoolSize * 0.01; // 1% platform commission
    const esusuNetPayout = esusuPoolSize - esusuPlatformFee;

    // Interactive States: Agency Banking Calculator
    const [agencyTxCount, setAgencyTxCount] = useState<number>(65);
    const [agencyAvgTxSize, setAgencyAvgTxSize] = useState<number>(10000);

    const calculateAgentCommission = (count: number, avg: number) => {
        // Flat average commission is ₦120 per transaction
        const dailyComm = count * 120;
        const monthlyComm = dailyComm * 30;
        // Agency bonus triggers above 50 transactions daily
        const bonus = count > 50 ? 15000 : 0;
        return {
            daily: dailyComm,
            monthly: monthlyComm,
            bonus: bonus,
            total: monthlyComm + bonus
        };
    };

    const agentCommResult = calculateAgentCommission(agencyTxCount, agencyAvgTxSize);

    // Interactive States: Agent Lead Signup Form
    const [agentForm, setAgentForm] = useState({
        fullName: "",
        businessName: "",
        phone: "",
        location: "Aba North",
        hasPOS: "no"
    });
    const [agentSubmitting, setAgentSubmitting] = useState(false);
    const [agentSuccess, setAgentSuccess] = useState(false);

    const handleAgentSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setAgentSubmitting(true);
        setTimeout(() => {
            setAgentSubmitting(false);
            setAgentSuccess(true);
            setAgentForm({
                fullName: "",
                businessName: "",
                phone: "",
                location: "Aba North",
                hasPOS: "no"
            });
        }, 1200);
    };

    // Interactive States: Merchant checkout simulator
    const [checkoutState, setCheckoutState] = useState<"idle" | "processing" | "success">("idle");
    const checkoutAmount = 18500;

    const triggerCheckoutSim = () => {
        setCheckoutState("processing");
        setTimeout(() => {
            setCheckoutState("success");
        }, 1500);
    };

    // Interactive States: Custom Card Styling Widget
    const [cardName, setCardName] = useState("SARAH JOHNSON");
    const [cardBrand, setCardBrand] = useState<"Visa" | "Mastercard" | "Verve">("Verve");
    const [cardType, setCardType] = useState<"physical" | "virtual">("physical");
    const [cardFrozen, setCardFrozen] = useState(false);
    const [cardLimit, setCardLimit] = useState<number>(1500000);

    // Dynamic Navigation Hash handler (autofocuses sections)
    useEffect(() => {
        if (typeof window !== "undefined" && window.location.hash) {
            const hash = window.location.hash.toLowerCase();
            if (hash.includes("collection") || hash.includes("school")) {
                setActiveTab("collections");
            } else if (hash.includes("esusu") || hash.includes("cooperative")) {
                setActiveTab("esusu");
            } else if (hash.includes("agency") || hash.includes("agent")) {
                setActiveTab("agency");
            } else if (hash.includes("merchant") || hash.includes("checkout")) {
                setActiveTab("merchant");
            } else if (hash.includes("card")) {
                setActiveTab("cards");
            } else if (hash.includes("credit") || hash.includes("loan")) {
                setActiveTab("credit");
            }
        }
    }, []);

    return (
        <div className="min-h-screen bg-background relative overflow-hidden pt-20">
            {/* Elegant Background Gradients */}
            <div className="absolute top-[-10%] left-[-15%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-[140px] pointer-events-none"></div>
            <div className="absolute bottom-[20%] right-[-10%] w-[45%] h-[45%] bg-accent/10 rounded-full blur-[140px] pointer-events-none"></div>

            {/* Premium Header / Expository Banner */}
            <section className="relative py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto z-10">
                <div className="text-center max-w-4xl mx-auto space-y-6">
                    <div className="inline-flex items-center gap-2.5 py-2 px-4 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-md mb-2">
                        <Sparkles size={14} className="text-primary animate-pulse" />
                        <span className="text-primary text-[10px] sm:text-xs font-black uppercase tracking-[0.2em]">Unions & Corporate Banking Portal</span>
                    </div>

                    <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-display font-black text-foreground tracking-tight leading-[1.1]">
                        Tailored Enterprise <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">& Cooperative Systems</span>
                    </h1>

                    <p className="text-lg sm:text-xl text-muted-foreground font-medium max-w-3xl mx-auto leading-relaxed">
                        Deploy state-of-the-art retail checkouts, digitize your thrift cooperative cycles, command customizable smart debit cards, or power your neighborhood agency cashpoint network.
                    </p>
                </div>
            </section>

            {/* Highly Responsive Segmented Tab Control */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16 relative z-20">
                <div className="bg-card/80 backdrop-blur-xl border border-border/80 p-2 rounded-[2rem] shadow-xl overflow-x-auto scrollbar-none flex whitespace-nowrap gap-1">
                    {[
                        { id: "business", label: "Business & Payroll", icon: <Building size={16} /> },
                        { id: "collections", label: "School Collections", icon: <GraduationCap size={16} /> },
                        { id: "esusu", label: "Cooperative & Thrift", icon: <Users size={16} /> },
                        { id: "agency", label: "Agency Banking", icon: <Store size={16} /> },
                        { id: "merchant", label: "Merchant Solutions", icon: <QrCode size={16} /> },
                        { id: "cards", label: "Smart Debit Cards", icon: <CreditCard size={16} /> },
                        { id: "credit", label: "Financing & Credit", icon: <Banknote size={16} /> }
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as TabType)}
                            className={`flex items-center gap-2.5 px-6 py-3.5 rounded-2xl font-black text-sm transition-all duration-300 ${activeTab === tab.id
                                    ? "bg-primary text-primary-foreground shadow-md scale-[1.02]"
                                    : "text-muted-foreground hover:text-foreground hover:bg-foreground/5"
                                }`}
                        >
                            {tab.icon}
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </div>
            </section>

            {/* Content Hub Panels */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-32 relative z-10">
                <div className="bg-card text-card-foreground border border-border/60 rounded-[3rem] p-6 md:p-12 shadow-2xl backdrop-blur-sm relative overflow-hidden">
                    {/* Inner glowing badge style header */}
                    <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px] pointer-events-none"></div>

                    {/* TAB 1: BUSINESS SUITE */}
                    {activeTab === "business" && (
                        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-500">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                                <div className="space-y-6">
                                    <div className="inline-flex items-center gap-2">
                                        <Building2 className="text-primary w-5 h-5" />
                                        <span className="text-primary font-black uppercase text-xs tracking-widest">SMEs & Corporates</span>
                                    </div>
                                    <h2 className="text-3xl md:text-5xl font-display font-black text-foreground leading-none">
                                        SME Growth Suite
                                    </h2>
                                    <p className="text-muted-foreground text-lg leading-relaxed">
                                        Scale your organization with zero maintenance fees, streamlined bulk salary payroll disbursement, and dedicated corporate settlements tailored for {activeProfile.regionLabel}.
                                    </p>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {[
                                            "Zero account opening maintenance fees",
                                            "Instant salary bulk payroll disburse",
                                            "Invoice discounting & factoring",
                                            "Contract & supply LPO credit lines"
                                        ].map((feat, idx) => (
                                            <div key={idx} className="flex items-center gap-2 text-sm font-semibold">
                                                <CheckCircle size={16} className="text-primary shrink-0" />
                                                <span>{feat}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Dynamic Savings Yield Calculator */}
                                <div className="bg-background/80 border border-border/80 p-8 rounded-3xl shadow-xl space-y-6 relative">
                                    <div className="absolute top-4 right-4 bg-primary/10 text-primary border border-primary/20 text-[9px] uppercase font-black px-2 py-0.5 rounded">High Yield</div>

                                    <h3 className="text-lg font-black text-foreground flex items-center gap-2">
                                        <Calculator size={18} className="text-primary" />
                                        <span>Corporate Yield Estimator</span>
                                    </h3>
                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                        Invest your company reserves or cooperative balances with the most competitive micro-savings yields in the state.
                                    </p>

                                    <div className="space-y-4">
                                        <div className="space-y-1">
                                            <div className="flex justify-between text-xs font-bold">
                                                <span className="text-muted-foreground">Fixed Deposit Principal:</span>
                                                <span className="text-primary font-mono text-sm">₦{savingsDeposit.toLocaleString()}</span>
                                            </div>
                                            <input
                                                type="range"
                                                min="100000"
                                                max="10000000"
                                                step="100000"
                                                value={savingsDeposit}
                                                onChange={(e) => setSavingsDeposit(Number(e.target.value))}
                                                className="w-full accent-primary h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg cursor-pointer"
                                            />
                                        </div>

                                        <div className="space-y-1">
                                            <div className="flex justify-between text-xs font-bold">
                                                <span className="text-muted-foreground">Tenure (Investment Lock):</span>
                                                <span className="text-primary font-mono text-sm">{savingsTenure} Months</span>
                                            </div>
                                            <input
                                                type="range"
                                                min="3"
                                                max="24"
                                                step="3"
                                                value={savingsTenure}
                                                onChange={(e) => setSavingsTenure(Number(e.target.value))}
                                                className="w-full accent-primary h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg cursor-pointer"
                                            />
                                        </div>
                                    </div>

                                    <div className="bg-primary/5 dark:bg-primary/10 p-5 rounded-2xl border border-primary/20 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                                        <div>
                                            <p className="text-[9px] uppercase tracking-wider text-slate-400 font-extrabold mb-1">Interest Earnings (12.5% p.a.)</p>
                                            <p className="text-3xl font-black text-primary tracking-tight">₦{Math.round(calculateSmeYield(savingsDeposit, savingsTenure)).toLocaleString()}</p>
                                        </div>
                                        <div className="text-right sm:border-l border-border/60 pl-0 sm:pl-4">
                                            <p className="text-[9px] uppercase tracking-wider text-slate-400 font-extrabold mb-1">Total Payback Maturity</p>
                                            <p className="text-sm font-bold text-foreground font-mono">₦{Math.round(savingsDeposit + calculateSmeYield(savingsDeposit, savingsTenure)).toLocaleString()}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB 1B: SCHOOL & INSTITUTIONAL COLLECTIONS */}
                    {activeTab === "collections" && (
                        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-500" id="collections">
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
                                <div className="lg:col-span-6 space-y-6">
                                    <div className="inline-flex items-center gap-2">
                                        <GraduationCap className="text-primary w-5 h-5" />
                                        <span className="text-primary font-black uppercase text-xs tracking-widest">
                                            {activeProfile.shortName} School Collection Service
                                        </span>
                                    </div>
                                    <h2 className="text-3xl md:text-5xl font-display font-black text-foreground leading-tight">
                                        Automated School Fee Collections &amp; E-Receipts
                                    </h2>
                                    <p className="text-muted-foreground text-base sm:text-lg leading-relaxed">
                                        Built for primary, secondary, and higher institutions — parents settle tuition via web, mobile app, or USSD ({activeProfile.ussdCode}) while bursars receive live class-by-class reconciliation inside {activeProfile.shortName}.
                                    </p>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {[
                                            "Instant verified digital receipt per student ID",
                                            "Zero bank-hall queues or unverified teller slips",
                                            "Real-time bursar reporting & term fee splits",
                                            "Multi-campus school & welfare settlement accounts",
                                        ].map((feat, idx) => (
                                            <div key={idx} className="flex items-start gap-2 text-sm font-semibold">
                                                <CheckCircle size={16} className="text-primary shrink-0 mt-0.5" />
                                                <span>{feat}</span>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="flex flex-wrap gap-3 pt-2">
                                        <Link
                                            href="/auth/login"
                                            className="px-6 py-3.5 rounded-2xl bg-primary text-primary-foreground font-black text-xs uppercase tracking-wider hover:opacity-90 transition-all inline-flex items-center gap-2"
                                        >
                                            Open Bursar &amp; Parent Portal <ArrowRight size={15} />
                                        </Link>
                                    </div>
                                </div>

                                <div className="lg:col-span-6 bg-background/80 border border-border rounded-3xl p-6 sm:p-8 shadow-xl space-y-5">
                                    <div className="flex items-center justify-between border-b border-border pb-4">
                                        <div className="flex items-center gap-2.5">
                                            <Receipt className="w-5 h-5 text-primary" />
                                            <div>
                                                <h3 className="text-sm font-black">School Collection Simulator</h3>
                                                <p className="text-[11px] text-muted-foreground">Preview instant tuition clearing &amp; parent receipt</p>
                                            </div>
                                        </div>
                                        <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600">
                                            {activeProfile.shortName} Clearing
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-3 gap-2">
                                        {([
                                            { id: "primary", label: "Primary School", amt: "₦45,000" },
                                            { id: "secondary", label: "Secondary / Command", amt: "₦82,500" },
                                            { id: "tertiary", label: "Poly / Academy", amt: "₦120,000" },
                                        ] as const).map((tier) => (
                                            <button
                                                key={tier.id}
                                                type="button"
                                                onClick={() => {
                                                    setSchoolTier(tier.id);
                                                    setFeePaid(false);
                                                }}
                                                className={`p-3 rounded-2xl border text-left transition-all ${
                                                    schoolTier === tier.id
                                                        ? "border-primary bg-primary/10"
                                                        : "border-border hover:border-primary/40"
                                                }`}
                                            >
                                                <p className="text-[10px] font-bold text-muted-foreground uppercase">{tier.label}</p>
                                                <p className="text-sm font-black mt-0.5">{tier.amt}</p>
                                            </button>
                                        ))}
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black uppercase text-muted-foreground">Student Admission / Reference ID</label>
                                        <input
                                            type="text"
                                            value={studentRef}
                                            onChange={(e) => setStudentRef(e.target.value.toUpperCase())}
                                            className="w-full h-10 px-3 rounded-xl border border-border bg-card text-xs font-mono font-bold"
                                        />
                                    </div>

                                    <div className="bg-slate-950 text-white rounded-2xl p-4 space-y-2 text-xs">
                                        <div className="flex justify-between text-slate-400">
                                            <span>Collecting Bank</span>
                                            <span className="font-bold text-white">{activeProfile.shortName}</span>
                                        </div>
                                        <div className="flex justify-between text-slate-400">
                                            <span>Student Ref</span>
                                            <span className="font-mono font-bold text-accent">{studentRef || "STU-2026-001"}</span>
                                        </div>
                                        <div className="flex justify-between text-slate-400">
                                            <span>Term Billing Total</span>
                                            <span className="font-black text-emerald-400">
                                                {schoolTier === "primary" ? "₦45,000.00" : schoolTier === "secondary" ? "₦82,500.00" : "₦120,000.00"}
                                            </span>
                                        </div>
                                        {feePaid && (
                                            <div className="mt-2 pt-2 border-t border-slate-800 flex items-center justify-between text-emerald-400 font-bold">
                                                <span>E-Receipt Issued · Synced to Bursar</span>
                                                <CheckCircle size={15} />
                                            </div>
                                        )}
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => setFeePaid(true)}
                                        className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-black text-xs uppercase tracking-wider hover:opacity-90 transition-all"
                                    >
                                        {feePaid ? "Verified E-Receipt Generated" : "Simulate Instant Tuition Payment"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB 2: COOPERATIVE & THRIFT */}
                    {activeTab === "esusu" && (
                        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-500" id="cooperative-thrift">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                                <div className="space-y-6">
                                    <div className="inline-flex items-center gap-2">
                                        <Users className="text-primary w-5 h-5" />
                                        <span className="text-primary font-black uppercase text-xs tracking-widest">Co-ops & Esusu Unions</span>
                                    </div>
                                    <h2 className="text-3xl md:text-5xl font-display font-black text-foreground leading-none">
                                        Digital Esusu / Ajo Savings
                                    </h2>
                                    <p className="text-muted-foreground text-lg leading-relaxed">
                                        Digitize your local trade association thrift and Esusu savings wheels. We provide transparent automated cycle disbursements, secure group trust wallets, and multi-signature security for executives.
                                    </p>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {[
                                            "Automated contributions collection",
                                            "Algorithmic payout cycle scheduler",
                                            "Multi-sig wallets for trust boards",
                                            "Auditable trade union collections"
                                        ].map((feat, idx) => (
                                            <div key={idx} className="flex items-center gap-2 text-sm font-semibold">
                                                <CheckCircle size={16} className="text-primary shrink-0" />
                                                <span>{feat}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Interactive Esusu Calculator */}
                                <div className="bg-background/80 border border-border/80 p-8 rounded-3xl shadow-xl space-y-6">
                                    <div className="flex justify-between items-center">
                                        <h3 className="text-lg font-black text-foreground flex items-center gap-2">
                                            <Calculator size={18} className="text-primary" />
                                            <span>Thrift Cycle Calculator</span>
                                        </h3>
                                        <span className="text-[9px] bg-primary/10 text-primary border border-primary/20 uppercase font-black px-2 py-0.5 rounded-full">Esusu Digital</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                        Enter your cooperative size and periodic target collections. See payout sizes and low automated clearing commissions.
                                    </p>

                                    <div className="space-y-4">
                                        <div className="space-y-1">
                                            <div className="flex justify-between text-xs font-bold">
                                                <span className="text-muted-foreground">Union Size (Contributors):</span>
                                                <span className="text-primary font-mono text-sm">{esusuMembers} Active Members</span>
                                            </div>
                                            <input
                                                type="range"
                                                min="5"
                                                max="50"
                                                step="1"
                                                value={esusuMembers}
                                                onChange={(e) => setEsusuMembers(Number(e.target.value))}
                                                className="w-full accent-primary h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg cursor-pointer"
                                            />
                                        </div>

                                        <div className="space-y-1">
                                            <div className="flex justify-between text-xs font-bold">
                                                <span className="text-muted-foreground">Contribution (Per Hand/Cycle):</span>
                                                <span className="text-primary font-mono text-sm">₦{esusuContribution.toLocaleString()}</span>
                                            </div>
                                            <input
                                                type="range"
                                                min="5000"
                                                max="250000"
                                                step="5000"
                                                value={esusuContribution}
                                                onChange={(e) => setEsusuContribution(Number(e.target.value))}
                                                className="w-full accent-primary h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg cursor-pointer"
                                            />
                                        </div>
                                    </div>

                                    <div className="bg-primary/5 dark:bg-primary/10 p-5 rounded-2xl border border-primary/20 grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <div>
                                            <p className="text-[8px] uppercase tracking-wider text-slate-400 font-extrabold mb-1">Total Hand Pool</p>
                                            <p className="text-lg font-black text-foreground tracking-tight">₦{esusuPoolSize.toLocaleString()}</p>
                                        </div>
                                        <div>
                                            <p className="text-[8px] uppercase tracking-wider text-slate-400 font-extrabold mb-1">Platform Commission (1%)</p>
                                            <p className="text-lg font-black text-rose-500 tracking-tight">₦{esusuPlatformFee.toLocaleString()}</p>
                                        </div>
                                        <div>
                                            <p className="text-[8px] uppercase tracking-wider text-slate-400 font-extrabold mb-1">Net Member Payout</p>
                                            <p className="text-lg font-black text-primary tracking-tight">₦{esusuNetPayout.toLocaleString()}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB 3: AGENCY BANKING */}
                    {activeTab === "agency" && (
                        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-500" id="agency-banking">
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                                {/* Left Side Copy & Form */}
                                <div className="lg:col-span-7 space-y-6">
                                    <div className="inline-flex items-center gap-2">
                                        <Store className="text-primary w-5 h-5" />
                                        <span className="text-primary font-black uppercase text-xs tracking-widest">Neighborhood Cashpoints</span>
                                    </div>
                                    <h2 className="text-3xl md:text-5xl font-display font-black text-foreground leading-none">
                                        POS Agency Banking
                                    </h2>
                                    <p className="text-muted-foreground text-base leading-relaxed">
                                        Become an authorized Abia MFB Agency partner. Empower your neighborhood with swift withdrawal points, cash deposits, utility bills clearance, and secure Esusu deposits collection payouts.
                                    </p>

                                    {/* Interactive Lead Sheet Form */}
                                    <div className="bg-background/80 border border-border/80 p-6 rounded-3xl shadow-lg relative overflow-hidden">
                                        <h3 className="text-sm font-black text-foreground mb-4 uppercase tracking-wider">POS Agent Terminal Application</h3>

                                        {agentSuccess ? (
                                            <div className="flex flex-col items-center justify-center p-6 text-center space-y-3 animate-in fade-in">
                                                <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center">
                                                    <Check size={24} />
                                                </div>
                                                <h4 className="font-extrabold text-foreground">Application Received!</h4>
                                                <p className="text-xs text-muted-foreground max-w-md">
                                                    Our Onboarding Operations Officer in Umuahia/Aba will contact you via phone within 24 business hours to finalize your terminal collection.
                                                </p>
                                                <button
                                                    onClick={() => setAgentSuccess(false)}
                                                    className="mt-2 text-xs font-bold text-primary hover:underline"
                                                >
                                                    Submit another response
                                                </button>
                                            </div>
                                        ) : (
                                            <form onSubmit={handleAgentSubmit} className="space-y-4">
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                    <div className="space-y-1">
                                                        <label className="text-[10px] uppercase font-extrabold text-slate-500">Full Name</label>
                                                        <input
                                                            type="text"
                                                            required
                                                            placeholder="Sarah Johnson"
                                                            value={agentForm.fullName}
                                                            onChange={(e) => setAgentForm({ ...agentForm, fullName: e.target.value })}
                                                            className="w-full bg-card border border-border/80 px-3 py-2 rounded-xl text-xs font-semibold focus:outline-none focus:border-primary"
                                                        />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-[10px] uppercase font-extrabold text-slate-500">Business Name</label>
                                                        <input
                                                            type="text"
                                                            required
                                                            placeholder="Ariaria Fashion Hub"
                                                            value={agentForm.businessName}
                                                            onChange={(e) => setAgentForm({ ...agentForm, businessName: e.target.value })}
                                                            className="w-full bg-card border border-border/80 px-3 py-2 rounded-xl text-xs font-semibold focus:outline-none focus:border-primary"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                                    <div className="space-y-1">
                                                        <label className="text-[10px] uppercase font-extrabold text-slate-500">Mobile Phone</label>
                                                        <input
                                                            type="tel"
                                                            required
                                                            placeholder="080 1234 5678"
                                                            value={agentForm.phone}
                                                            onChange={(e) => setAgentForm({ ...agentForm, phone: e.target.value })}
                                                            className="w-full bg-card border border-border/80 px-3 py-2 rounded-xl text-xs font-semibold focus:outline-none focus:border-primary"
                                                        />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-[10px] uppercase font-extrabold text-slate-500">Location (Abia LGA)</label>
                                                        <select
                                                            value={agentForm.location}
                                                            onChange={(e) => setAgentForm({ ...agentForm, location: e.target.value })}
                                                            className="w-full bg-card border border-border/80 px-3 py-2.5 rounded-xl text-xs font-bold focus:outline-none focus:border-primary"
                                                        >
                                                            <option>Aba North</option>
                                                            <option>Aba South</option>
                                                            <option>Umuahia North</option>
                                                            <option>Umuahia South</option>
                                                            <option>Ohafia</option>
                                                            <option>Osisioma Ngwa</option>
                                                        </select>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-[10px] uppercase font-extrabold text-slate-500">Do you currently have a POS?</label>
                                                        <select
                                                            value={agentForm.hasPOS}
                                                            onChange={(e) => setAgentForm({ ...agentForm, hasPOS: e.target.value })}
                                                            className="w-full bg-card border border-border/80 px-3 py-2.5 rounded-xl text-xs font-bold focus:outline-none focus:border-primary"
                                                        >
                                                            <option value="no">No, need new terminal</option>
                                                            <option value="yes">Yes, want to swap</option>
                                                        </select>
                                                    </div>
                                                </div>

                                                <button
                                                    type="submit"
                                                    disabled={agentSubmitting}
                                                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-black py-3 rounded-xl flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-95 transition-all shadow-md shadow-primary/20"
                                                >
                                                    {agentSubmitting ? (
                                                        <>
                                                            <Loader2 size={14} className="animate-spin" />
                                                            <span>SUBMITTING REGISTRATION LEAD...</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <span>Submit Partner Application</span>
                                                            <ArrowRight size={14} />
                                                        </>
                                                    )}
                                                </button>
                                            </form>
                                        )}
                                    </div>
                                </div>

                                {/* Right Side Commissions Estimator */}
                                <div className="lg:col-span-5 bg-background/80 border border-border/80 p-8 rounded-3xl shadow-xl flex flex-col justify-between">
                                    <div className="space-y-6">
                                        <div className="flex justify-between items-center">
                                            <h3 className="text-lg font-black text-foreground flex items-center gap-2">
                                                <Calculator size={18} className="text-primary" />
                                                <span>Agent Commission Calculator</span>
                                            </h3>
                                        </div>
                                        <p className="text-xs text-muted-foreground leading-relaxed">
                                            Slide the indicator to specify your expected neighborhood daily transacting footprint and see your monthly commissions.
                                        </p>

                                        <div className="space-y-4">
                                            <div className="space-y-1">
                                                <div className="flex justify-between text-xs font-bold">
                                                    <span className="text-muted-foreground">Expected Daily Transactions:</span>
                                                    <span className="text-primary font-mono text-sm">{agencyTxCount} Transactions</span>
                                                </div>
                                                <input
                                                    type="range"
                                                    min="10"
                                                    max="300"
                                                    step="5"
                                                    value={agencyTxCount}
                                                    onChange={(e) => setAgencyTxCount(Number(e.target.value))}
                                                    className="w-full accent-primary h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg cursor-pointer"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-3 pt-4 border-t border-border/60">
                                            <div className="flex justify-between text-xs font-semibold text-muted-foreground">
                                                <span>Flat Agent Fee (Commission per Tx):</span>
                                                <span className="text-foreground">₦120.00</span>
                                            </div>
                                            <div className="flex justify-between text-xs font-semibold text-muted-foreground">
                                                <span>Estimated Daily Commissions:</span>
                                                <span className="text-foreground">₦{agentCommResult.daily.toLocaleString()}</span>
                                            </div>
                                            <div className="flex justify-between text-xs font-semibold text-muted-foreground">
                                                <span>Active Volume Partner Bonus:</span>
                                                <span className={`${agentCommResult.bonus > 0 ? "text-emerald-500 font-extrabold" : "text-slate-400 font-bold"}`}>
                                                    {agentCommResult.bonus > 0 ? "+₦15,000.00" : "₦0.00"}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-primary/5 dark:bg-primary/10 p-5 rounded-2xl border border-primary/20 flex justify-between items-center mt-6">
                                        <div>
                                            <p className="text-[9px] uppercase tracking-wider text-slate-400 font-extrabold mb-1">Estimated Monthly Payout</p>
                                            <p className="text-2xl font-black text-primary tracking-tight">₦{agentCommResult.total.toLocaleString()}</p>
                                        </div>
                                        <span className="bg-emerald-500 text-black text-[9px] font-black px-2.5 py-1 rounded-md shadow">
                                            NET PROFIT
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB 4: MERCHANT PAYMENT SOLUTIONS */}
                    {activeTab === "merchant" && (
                        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-500" id="merchant-solutions">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                                <div className="space-y-6">
                                    <div className="inline-flex items-center gap-2">
                                        <QrCode className="text-primary w-5 h-5" />
                                        <span className="text-primary font-black uppercase text-xs tracking-widest">Global Checkouts API</span>
                                    </div>
                                    <h2 className="text-3xl md:text-5xl font-display font-black text-foreground leading-none">
                                        Merchant Solutions
                                    </h2>
                                    <p className="text-muted-foreground text-lg leading-relaxed">
                                        Accept digital transfers seamlessly inside your online store, checkout website, or mobile app. Integrate our robust developer APIs, print custom dynamic QR codes for physical registers, or dispatch dynamic payment checkout links.
                                    </p>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {[
                                            "Developer-friendly Webhook APIs",
                                            "Dynamic QR codes at checkout counter",
                                            "Secure digital transaction routing",
                                            "Instant local settlement payout splits"
                                        ].map((feat, idx) => (
                                            <div key={idx} className="flex items-center gap-2 text-sm font-semibold">
                                                <CheckCircle size={16} className="text-primary shrink-0" />
                                                <span>{feat}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Developer Checkout API Showcase */}
                                <div className="bg-slate-950 border border-slate-800 p-8 rounded-3xl shadow-2xl space-y-6 font-mono text-xs text-slate-300">
                                    <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                                        <div className="flex gap-1.5">
                                            <span className="w-2.5 h-2.5 bg-rose-500 rounded-full"></span>
                                            <span className="w-2.5 h-2.5 bg-amber-500 rounded-full"></span>
                                            <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full"></span>
                                        </div>
                                        <span className="text-slate-500 text-[9px] font-black uppercase tracking-widest">interactive_checkout.json</span>
                                    </div>

                                    {checkoutState === "idle" && (
                                        <div className="space-y-4">
                                            <p className="text-slate-500 text-[10px]">{"// Trigger simulated API payment payload"}</p>
                                            <pre className="text-slate-400 text-[11px] leading-relaxed">
                                                {`{
  "api_token": "abiamfb_live_79a2bb...",
  "currency": "NGN",
  "amount": ${checkoutAmount},
  "customer": "Sarah Johnson",
  "recipient": "Aba Leather Guild Corp"
}`}
                                            </pre>
                                            <button
                                                onClick={triggerCheckoutSim}
                                                className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold py-3.5 rounded-2xl flex items-center justify-center gap-2 border border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:scale-[1.01] active:scale-95 transition-all text-xs"
                                            >
                                                <span>Simulate Web API Checkout</span>
                                                <ArrowRight size={14} />
                                            </button>
                                        </div>
                                    )}

                                    {checkoutState === "processing" && (
                                        <div className="flex flex-col items-center justify-center py-12 space-y-4 text-center">
                                            <Loader2 className="h-8 w-8 text-emerald-500 animate-spin" />
                                            <span className="text-emerald-400 animate-pulse tracking-widest text-[10px]">ROUTING TRANSACTION VIA CENTRAL SETTLEMENT NETWORKS...</span>
                                        </div>
                                    )}

                                    {checkoutState === "success" && (
                                        <div className="space-y-4 animate-in fade-in">
                                            <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl flex items-center gap-3 text-emerald-500">
                                                <CheckCircle size={20} className="shrink-0 animate-bounce" />
                                                <div>
                                                    <p className="font-extrabold text-[11px]">TRANSACTION SETTLED OK</p>
                                                    <p className="text-[10px] text-emerald-400/80">Ref: abia-7910-381a-912a</p>
                                                </div>
                                            </div>

                                            <div className="bg-slate-900 p-4 rounded-xl space-y-1.5 text-[10px] text-slate-400 border border-slate-800">
                                                <div className="flex justify-between"><span className="text-slate-500">Customer:</span><span className="text-white font-bold">Sarah Johnson</span></div>
                                                <div className="flex justify-between"><span className="text-slate-500">Recipient Store:</span><span className="text-white font-bold">Aba Leather Guild Corp</span></div>
                                                <div className="flex justify-between"><span className="text-slate-500">Settled Net Payout:</span><span className="text-emerald-400 font-extrabold">₦18,500.00</span></div>
                                                <div className="flex justify-between"><span className="text-slate-500">Clearing Network:</span><span className="text-white">Abia MFB InstantPay API</span></div>
                                            </div>

                                            <button
                                                onClick={() => setCheckoutState("idle")}
                                                className="w-full bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold py-2 rounded-xl text-center transition-colors text-[10px]"
                                            >
                                                Reset Simulator
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB 5: SMART DEBIT CARDS */}
                    {activeTab === "cards" && (
                        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-500" id="smart-cards">
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                                {/* Interactive Card Previewer Left */}
                                <div className="lg:col-span-5 flex flex-col items-center justify-center space-y-6">
                                    <div className="perspective-1000 w-full max-w-[360px]">
                                        <div className={`w-full aspect-[1.586/1] rounded-3xl p-6 text-white flex flex-col justify-between shadow-2xl relative overflow-hidden transition-all duration-500 transform hover:scale-[1.02] border ${cardBrand === "Verve"
                                                ? "bg-gradient-to-br from-emerald-600 via-teal-800 to-emerald-950 border-emerald-500/40"
                                                : cardBrand === "Visa"
                                                    ? "bg-gradient-to-br from-blue-700 via-indigo-900 to-indigo-950 border-blue-600/40"
                                                    : "bg-gradient-to-br from-neutral-800 via-neutral-900 to-neutral-950 border-neutral-700/40"
                                            }`}>
                                            {/* Glowing ambient ring */}
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl pointer-events-none"></div>

                                            {/* Frosted Glass Frozen Overlay */}
                                            {cardFrozen && (
                                                <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-md z-20 flex flex-col items-center justify-center space-y-2 animate-in fade-in duration-300">
                                                    <div className="w-12 h-12 bg-rose-500/20 border border-rose-500/30 text-rose-500 rounded-full flex items-center justify-center shadow-lg shadow-rose-950">
                                                        <Lock size={20} className="animate-pulse" />
                                                    </div>
                                                    <span className="text-rose-500 text-xs font-black uppercase tracking-widest">Card Locked</span>
                                                    <span className="text-slate-400 text-[8px]">Tap Active Status below to unlock</span>
                                                </div>
                                            )}

                                            <div className="flex justify-between items-start z-10">
                                                <div>
                                                    <h4 className="text-xs font-black tracking-widest leading-none">{activeProfile.shortName}</h4>
                                                    <p className="text-[7px] text-slate-300 uppercase tracking-widest mt-0.5 font-bold">Contactless &amp; Web</p>
                                                </div>
                                                <span className="text-[9px] font-black uppercase bg-white/10 px-2 py-0.5 rounded backdrop-blur border border-white/15">
                                                    {cardType === "physical" ? "PHYSICAL CHIP" : "VIRTUAL CLOUD"}
                                                </span>
                                            </div>

                                            {/* Gold Card Chip */}
                                            <div className="w-10 h-8 bg-gradient-to-br from-amber-400 via-yellow-300 to-amber-200 rounded-lg border border-amber-300 shadow-md z-10 self-start mt-4"></div>

                                            <div className="flex justify-between items-end z-10 mt-auto">
                                                <div className="space-y-1">
                                                    <p className="text-sm sm:text-base font-mono tracking-widest">4912 8011 4409 3892</p>
                                                    <div className="flex gap-4 text-[8px] text-slate-300 uppercase tracking-wider">
                                                        <div>
                                                            <p className="text-[6px] text-slate-400">Cardholder</p>
                                                            <p className="font-bold text-white">{cardName || "YOUR NAME HERE"}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-[6px] text-slate-400">Expiry</p>
                                                            <p className="font-bold text-white">09 / 31</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-[6px] text-slate-400">CVV</p>
                                                            <p className="font-bold text-white">•••</p>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="text-right">
                                                    <span className="text-sm font-black italic tracking-wide block leading-none">{cardBrand}</span>
                                                    <span className="text-[7px] font-extrabold uppercase text-slate-400 block mt-1 tracking-widest">Active Limit: ₦{(cardLimit / 1000).toFixed(0)}k</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Active State glow indicator */}
                                    <div className="flex items-center gap-3">
                                        <div className={`w-3.5 h-3.5 rounded-full border shadow-sm transition-all duration-500 ${cardFrozen
                                                ? "bg-rose-500 border-rose-400 shadow-rose-950 animate-pulse"
                                                : "bg-emerald-500 border-emerald-400 shadow-emerald-950 animate-ping"
                                            }`}></div>
                                        <span className={`text-[10px] font-black uppercase tracking-widest ${cardFrozen ? "text-rose-500" : "text-emerald-500"
                                            }`}>
                                            {cardFrozen ? "CARD STATUS: LOCKED" : "CARD STATUS: LIVE & ACTIVE"}
                                        </span>
                                    </div>
                                </div>

                                {/* Controls Settings Rig Right */}
                                <div className="lg:col-span-7 space-y-6 bg-background/80 border border-border/80 p-8 rounded-3xl shadow-xl">
                                    <div className="space-y-2">
                                        <div className="inline-flex items-center gap-2">
                                            <CreditCard size={18} className="text-primary" />
                                            <span className="text-xs uppercase font-extrabold text-slate-500 tracking-wider">Debit Card Interactive Configurator</span>
                                        </div>
                                        <h3 className="text-lg font-black text-foreground">Smart Cards Customizer</h3>
                                        <p className="text-xs text-muted-foreground leading-relaxed">
                                            Test different visual configurations, adjust local card limits, or toggle simulated lock commands to experience our high-tech security layer.
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-border/60">
                                        {/* Cardholder Input */}
                                        <div className="space-y-1">
                                            <label className="text-[10px] uppercase font-extrabold text-slate-500">Name on Card</label>
                                            <input
                                                type="text"
                                                maxLength={20}
                                                value={cardName}
                                                onChange={(e) => setCardName(e.target.value.toUpperCase())}
                                                className="w-full bg-card border border-border/80 px-3 py-2.5 rounded-xl text-xs font-semibold focus:outline-none focus:border-primary"
                                            />
                                        </div>

                                        {/* Card Network Selector */}
                                        <div className="space-y-1">
                                            <label className="text-[10px] uppercase font-extrabold text-slate-500">Card Payment Network</label>
                                            <div className="grid grid-cols-3 gap-1">
                                                {["Verve", "Visa", "Mastercard"].map((net) => (
                                                    <button
                                                        key={net}
                                                        onClick={() => setCardBrand(net as any)}
                                                        className={`py-2 rounded-xl text-[10px] font-black tracking-wider transition-all ${cardBrand === net
                                                                ? "bg-primary text-primary-foreground font-black shadow-sm"
                                                                : "bg-card text-muted-foreground hover:bg-foreground/5"
                                                            }`}
                                                    >
                                                        {net}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {/* Card Type Selector */}
                                        <div className="space-y-1">
                                            <label className="text-[10px] uppercase font-extrabold text-slate-500">Card Issuance Mode</label>
                                            <div className="grid grid-cols-2 gap-1">
                                                {["physical", "virtual"].map((mode) => (
                                                    <button
                                                        key={mode}
                                                        onClick={() => setCardType(mode as any)}
                                                        className={`py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${cardType === mode
                                                                ? "bg-primary text-primary-foreground font-black shadow-sm"
                                                                : "bg-card text-muted-foreground hover:bg-foreground/5"
                                                            }`}
                                                    >
                                                        {mode}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Lock Status Toggle */}
                                        <div className="space-y-1">
                                            <label className="text-[10px] uppercase font-extrabold text-slate-500">Emergency Security Lock</label>
                                            <button
                                                onClick={() => setCardFrozen(!cardFrozen)}
                                                className={`w-full py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 ${cardFrozen
                                                        ? "bg-rose-500 hover:bg-rose-600 text-white shadow-md shadow-rose-950"
                                                        : "bg-emerald-500 hover:bg-emerald-600 text-black shadow-md shadow-emerald-950"
                                                    }`}
                                            >
                                                {cardFrozen ? (
                                                    <>
                                                        <Lock size={12} />
                                                        <span>Unlock Card</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Unlock size={12} />
                                                        <span>Freeze Card</span>
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Card Limit Slider */}
                                    <div className="space-y-1 pt-2">
                                        <div className="flex justify-between text-[10px] font-extrabold">
                                            <span className="text-slate-500 uppercase">Local Spending Limit (Per Day)</span>
                                            <span className="text-primary font-mono">₦{cardLimit.toLocaleString()}</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="50000"
                                            max="5000000"
                                            step="50000"
                                            value={cardLimit}
                                            onChange={(e) => setCardLimit(Number(e.target.value))}
                                            className="w-full accent-primary h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg cursor-pointer"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB 6: CREDIT & FINANCING */}
                    {activeTab === "credit" && (
                        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-500" id="all-loans">
                            <div className="text-center max-w-3xl mx-auto space-y-4">
                                <div className="inline-flex items-center gap-2">
                                    <Landmark className="text-primary w-5 h-5 animate-pulse" />
                                    <span className="text-primary font-black uppercase text-xs tracking-widest">Active Credit Schemes</span>
                                </div>
                                <h2 className="text-3xl md:text-5xl font-display font-black text-foreground">
                                    Financing & Loans
                                </h2>
                                <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
                                    Comprehensive credit products pulled dynamically from our database — covering personnel advances, SME working capital, and union loans across {activeProfile.regionLabel}.
                                </p>
                            </div>

                            {loadingLoans ? (
                                <div className="flex w-full justify-center py-20"><Loader2 className="h-10 w-10 text-primary animate-spin" /></div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                    {products.map(prod => {
                                        const prodTerms = prod.financial_terms?.find((t: any) => t.blockType === 'loan-terms') as any;
                                        return (
                                            <div key={prod.id} className="bg-card text-card-foreground p-8 rounded-2xl shadow-lg border hover:-translate-y-1 transition-transform duration-300 flex flex-col">
                                                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-6">
                                                    {getIconForLoan(prod.name)}
                                                </div>
                                                <h4 className="text-xl font-bold text-foreground mb-3">{prod.name}</h4>
                                                <p className="text-muted-foreground leading-relaxed text-sm mb-6 flex-grow">{prod.tagline}</p>

                                                <div className="flex items-center gap-4 mt-auto mb-6 pt-4 border-t w-full">
                                                    {prod.category !== 'accounts' && (
                                                        <>
                                                            <div>
                                                                <p className="text-[9px] text-muted-foreground font-medium uppercase tracking-wider">Interest</p>
                                                                <p className="text-sm font-bold text-primary">{prodTerms?.interest_rate || 0}% <span className="text-[9px] text-muted-foreground font-normal">p.a</span></p>
                                                            </div>
                                                            <div className="w-px h-8 bg-border"></div>
                                                        </>
                                                    )}
                                                    <div>
                                                        <p className="text-[9px] text-muted-foreground font-medium uppercase tracking-wider">{prod.category === 'accounts' ? 'Min Deposit' : 'Max Amount'}</p>
                                                        <p className="text-sm font-bold">₦{((prod.category === 'accounts' ? prodTerms?.min_balance : prodTerms?.max_amount) || 0).toLocaleString()}</p>
                                                    </div>
                                                </div>

                                                <Link className="inline-flex justify-between w-full items-center text-primary font-semibold text-sm hover:text-accent transition-colors" href={`/product/${prod.id}`}>
                                                    <span>Learn More</span>
                                                    <ArrowRight size={16} />
                                                </Link>
                                            </div>
                                        )
                                    })}

                                    {/* Custom Assistance Loan Offer */}
                                    <div className="bg-primary p-8 rounded-2xl shadow-lg hover:-translate-y-1 transition-transform duration-300 flex flex-col justify-center items-center text-center text-primary-foreground relative overflow-hidden group">
                                        <div className="absolute inset-0 bg-white/5 group-hover:scale-105 transition-transform duration-500 pointer-events-none"></div>
                                        <h3 className="text-xl font-display font-bold text-white mb-4 z-10">Need Custom Financing?</h3>
                                        <p className="text-slate-200 text-sm leading-relaxed mb-6 z-10">
                                            We design customized cooperative loans or supply discounting contracts for unique corporate scenarios. Speak directly with a loan officer.
                                        </p>
                                        <Link
                                            href={`mailto:${activeProfile.supportEmail}`}
                                            className="bg-white text-primary font-black px-6 py-3.5 rounded-full hover:bg-slate-100 transition-colors w-full shadow-md z-10 text-xs uppercase tracking-wider"
                                        >
                                            Contact Loan Officer
                                        </Link>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}
