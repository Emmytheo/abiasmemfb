"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  PiggyBank, Baby, GraduationCap, User, Banknote, Store, Building2,
  Briefcase, Clock, ArrowRight, Loader2, Landmark, CheckCircle,
  Percent, ShieldCheck, Sparkles, Search, HelpCircle
} from "lucide-react";
import { api } from "@/lib/api";
import { ProductType } from "@/lib/api/types";
import { useBankProfile } from "@/context/bank-profile-context";

// Helper to map an icon to a string
function getIconForProduct(name: string) {
  const l = name.toLowerCase();
  if (l.includes('kiddies') || l.includes('child')) {
    return <Baby className="text-amber-500 group-hover:text-white transition-colors duration-300" size={32} />;
  }
  if (l.includes('school') || l.includes('education')) {
    return <GraduationCap className="text-emerald-500 group-hover:text-white transition-colors duration-300" size={32} />;
  }
  if (l.includes('individual') || l.includes('personal')) {
    return <User className="text-primary group-hover:text-white transition-colors duration-300" size={32} />;
  }
  if (l.includes('business') || l.includes('sme') || l.includes('merchant')) {
    return <Store className="text-violet-500 group-hover:text-white transition-colors duration-300" size={32} />;
  }
  if (l.includes('corporate') || l.includes('cooperative')) {
    return <Building2 className="text-blue-500 group-hover:text-white transition-colors duration-300" size={32} />;
  }
  if (l.includes('salary') || l.includes('payroll')) {
    return <Briefcase className="text-teal-500 group-hover:text-white transition-colors duration-300" size={32} />;
  }
  if (l.includes('fixed') || l.includes('deposit') || l.includes('term')) {
    return <Clock className="text-rose-500 group-hover:text-white transition-colors duration-300" size={32} />;
  }
  return <Landmark className="text-primary group-hover:text-white transition-colors duration-300" size={32} />;
}

export default function PersonalBanking() {
  const { activeProfile } = useBankProfile();
  const [products, setProducts] = useState<ProductType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTab, setSelectedTab] = useState<"all" | "savings" | "term">("all");

  useEffect(() => {
    api.getAllProductTypes().then(types => {
      const isAccountCategory = (catName: string) => {
        const name = catName.toLowerCase();
        return name.includes("account") || name.includes("saving") || name.includes("deposit") || name.includes("current");
      };
      setProducts(types.filter(t => isAccountCategory(t.category) && t.status === 'active'));
      setLoading(false);
    });
  }, []);

  const filteredProducts = products.filter(prod => {
    const matchesSearch = prod.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prod.description?.toLowerCase().includes(searchQuery.toLowerCase());

    const isTerm = prod.name.toLowerCase().includes("fixed") || prod.name.toLowerCase().includes("term") || prod.name.toLowerCase().includes("deposit");
    
    if (selectedTab === "savings") return matchesSearch && !isTerm;
    if (selectedTab === "term") return matchesSearch && isTerm;
    return matchesSearch;
  });

  return (
    <div className="animate-in fade-in duration-700 bg-background min-h-screen">
      {/* ── Dynamic Hero Header ── */}
      <header className="relative pt-32 pb-24 lg:pt-40 lg:pb-36 overflow-hidden">
        {/* Deep modern background with glowing ambient orbs */}
        <div className="absolute inset-0 z-0 bg-zinc-950">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/90 via-zinc-950 to-zinc-950"></div>
          <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-primary/20 rounded-full blur-[120px] mix-blend-screen animate-pulse"></div>
          <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-accent/15 rounded-full blur-[120px] mix-blend-screen animate-pulse delay-1000"></div>
          {/* Subtle grid pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 py-1.5 px-3 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-accent animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest text-white/80">Premium Deposit Accounts</span>
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-7xl font-display font-black text-white tracking-tight leading-[1.1]">
            Grow Wealth With <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-amber-300">Absolute Trust.</span>
          </h1>

          <p className="max-w-2xl mx-auto text-base sm:text-lg md:text-xl text-zinc-300 font-light leading-relaxed">
            Savings, checking, and voluntary target wealth plans tailored for personnel, families, and enterprises across {activeProfile.regionLabel} — backed by {activeProfile.legalName}.
          </p>

          {/* Quick trust metrics */}
          <div className="flex flex-wrap justify-center items-center gap-6 pt-4 text-xs font-semibold text-zinc-400">
            <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-emerald-400" /> {activeProfile.licenseBadge}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-700 hidden sm:inline" />
            <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-emerald-400" /> USSD {activeProfile.ussdCode}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-700 hidden sm:inline" />
            <span className="flex items-center gap-1.5"><Percent className="w-4 h-4 text-emerald-400" /> Competative Rates</span>
          </div>
        </div>
      </header>

      {/* ── Main Section ── */}
      <main className="relative z-20 -mt-10 pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-12">
        
        {/* Controls Panel (Tabs + Search) */}
        <div className="bg-card/70 backdrop-blur-md rounded-3xl border p-4 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Tabs */}
          <div className="flex bg-muted p-1 rounded-2xl w-full md:w-auto">
            {[
              { id: "all", label: "All Accounts" },
              { id: "savings", label: "Savings & Current" },
              { id: "term", label: "Fixed Deposit Terms" }
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setSelectedTab(t.id as any)}
                className={`flex-1 md:flex-none px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 ${
                  selectedTab === t.id
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Search box */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-muted/50 rounded-2xl text-sm border-none focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
            />
          </div>
        </div>

        {/* Loading Spinner */}
        {loading ? (
          <div className="flex flex-col items-center justify-center p-24 bg-card rounded-3xl border shadow-xl w-full gap-4">
            <Loader2 className="h-10 w-10 text-primary animate-spin" />
            <p className="text-sm font-semibold text-muted-foreground uppercase tracking-widest animate-pulse">Loading Products...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center p-20 bg-card rounded-3xl border shadow-xl w-full space-y-4">
            <HelpCircle className="w-12 h-12 text-muted-foreground mx-auto" />
            <h3 className="text-lg font-bold">No Products Found</h3>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto">
              We couldn't find any products matching your current query. Try adjusting your filter or search search term.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredProducts.map(prod => {
              const prodTerms = prod.financial_terms?.[0] as any;
              const hasInterest = prodTerms?.blockType !== 'savings-terms';
              
              return (
                <div
                  key={prod.id}
                  className="group bg-card hover:bg-card/90 rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-500 border flex flex-col relative overflow-hidden"
                >
                  {/* Subtle top brand line */}
                  <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-accent to-primary transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />

                  {/* Icon Circle */}
                  <div className="w-14 h-14 rounded-2xl bg-muted/60 flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                    {getIconForProduct(prod.name)}
                  </div>

                  {/* Info */}
                  <h3 className="text-2xl font-black text-foreground mb-3 font-display tracking-tight group-hover:text-primary transition-colors duration-300">
                    {prod.name}
                  </h3>
                  
                  <p className="text-muted-foreground text-sm leading-relaxed mb-8 flex-grow font-medium">
                    {prod.description?.replace(/<[^>]*>?/gm, '') || "Secure and flexible deposit account option customized to support your business expansion and financial target requirements."}
                  </p>

                  {/* Financial Details Row */}
                  <div className="flex items-center gap-6 mt-auto mb-8 pt-6 border-t w-full">
                    {hasInterest && (
                      <>
                        <div className="space-y-0.5">
                          <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">Yield / Interest</p>
                          <p className="text-base font-black text-primary">
                            {prodTerms?.interest_rate || 0}% <span className="text-[10px] text-muted-foreground font-normal lowercase">p.a.</span>
                          </p>
                        </div>
                        <div className="w-px h-8 bg-border" />
                      </>
                    )}
                    <div className="space-y-0.5">
                      <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">
                        {prodTerms?.blockType === 'savings-terms' ? 'Min Balance' : prodTerms?.blockType === 'fixed-deposit-terms' ? 'Min Amount' : 'Max Limit'}
                      </p>
                      <p className="text-base font-black text-foreground">
                        ₦{((prodTerms?.blockType === 'savings-terms' ? prodTerms?.min_balance : prodTerms?.blockType === 'fixed-deposit-terms' ? prodTerms?.min_amount : prodTerms?.max_amount) || 0).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* CTA */}
                  <Link
                    href={`/product/${prod.id}`}
                    className="inline-flex items-center justify-between w-full px-5 py-3.5 bg-muted text-foreground font-black text-xs uppercase tracking-wider rounded-2xl hover:bg-primary hover:text-primary-foreground transition-all duration-300 group/btn"
                  >
                    <span>Apply For Account</span>
                    <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1.5 transition-transform" />
                  </Link>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Helpful FAQ Banner ── */}
        <div className="bg-zinc-950 text-white rounded-3xl p-8 lg:p-12 relative overflow-hidden border border-white/10 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/30 to-transparent pointer-events-none" />
          <div className="relative z-10 space-y-3 max-w-xl">
            <span className="text-[10px] font-black uppercase tracking-widest text-accent">Account Guidelines</span>
            <h3 className="text-2xl lg:text-3xl font-display font-black tracking-tight">Need help deciding which account is right for you?</h3>
            <p className="text-sm text-zinc-300 leading-relaxed font-light">
              Our financial officers are always standing by to recommend the most optimal accounts or cooperative structures that match your business patterns.
            </p>
          </div>
          <Link
            href="/support"
            className="relative z-10 px-8 py-4 bg-white text-black font-black rounded-2xl hover:bg-accent hover:text-white transition-all duration-300 shrink-0 text-sm tracking-wider uppercase"
          >
            Contact Advisor
          </Link>
        </div>
      </main>
    </div>
  );
}
