import { ExpandingReach } from "@/components/home/expanding-reach";
import Link from "next/link";
import { FileText, CheckSquare, ShieldCheck, DollarSign, Zap } from "lucide-react";
import { NewsInsights } from "@/components/home/news-insights";
import { HeroPromotionsShowcase, BannerPromotion, SidebarPromotionsWidget } from "@/components/home/promotions-showcase";
import { ProductsShowcase } from "@/components/home/products-showcase";
import { HeroExpository } from "@/components/home/hero-expository";
import { SpotlightSection } from "@/components/home/spotlight-section";
import { MobileAppShowcase } from "@/components/home/mobile-app-showcase";
import { WhyChooseBankSection, MissionVisionBand, CoreServicesGrid, TestimonialsBand } from "@/components/home/nnmfb-sections";
import { Suspense } from "react";
import { unstable_cache } from "next/cache";
import { api } from "@/lib/api";
import { PageRenderer } from "@/components/payload/PageRenderer";
import { getServerBankProfile } from "@/lib/banking/bank-profile-server";

function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([
    promise.catch(() => fallback),
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms)),
  ]);
}

const getCachedPromotions = unstable_cache(
  async (placement: string) => {
    return await withTimeout(api.getPromotions(placement), 1500, []);
  },
  ["home-promotions"],
  { revalidate: 60 }
);

const getCachedAbiaHomePage = unstable_cache(
  async () => {
    return await withTimeout(api.getPageBySlug("home"), 1500, null);
  },
  ["home-cms-page"],
  { revalidate: 60 }
);

async function HeroPromotionsSlot() {
  const heroPromos = await getCachedPromotions("hero");
  const activeHero = (heroPromos || []).filter((p: any) => p.isActive);
  if (activeHero.length === 0) return null;
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <BannerPromotion />
      <HeroPromotionsShowcase initialData={activeHero} />
    </div>
  );
}

async function SidebarPromotionsColumn() {
  const sidebarPromos = await getCachedPromotions("sidebar");
  const activeSidebar = (sidebarPromos || []).filter((p: any) => p.isActive);
  if (activeSidebar.length === 0) return null;
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
      <div className="rounded-3xl border border-border p-6 bg-card/60">
        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground mb-4">Special Offers</h3>
        <SidebarPromotionsWidget initialData={activeSidebar} />
      </div>
    </div>
  );
}

export default async function Home() {
  const { profile } = await getServerBankProfile();

  // Only check static CMS layout override when AbiaSMEMFB profile is active
  if (profile.id === "abiasmemfb") {
    const pageData = await getCachedAbiaHomePage();
    if (pageData && pageData.layout && pageData.layout.length > 0) {
      return (
        <main className="flex flex-col min-h-screen">
          <PageRenderer layout={pageData.layout} />
        </main>
      );
    }
  }

  return (
    <main className="flex flex-col min-h-screen overflow-x-hidden">
      {/* 1. Profile-Controlled Hero Banner (Instant SSR, Zero DB Blocking) */}
      <HeroExpository />

      {/* 2. Why Choose Bank + Mission/Vision + Core Services (Instant SSR) */}
      <WhyChooseBankSection />
      <MissionVisionBand />
      <CoreServicesGrid />

      {/* Optional Non-Blocking Promotions Banner */}
      <Suspense fallback={null}>
        <HeroPromotionsSlot />
      </Suspense>

      {/* 3. Live Core Product Catalog */}
      <ProductsShowcase />

      {/* 4. Spotlight + Optional Sidebar Offers + Customer Reviews */}
      <SpotlightSection />
      <Suspense fallback={null}>
        <SidebarPromotionsColumn />
      </Suspense>

      <TestimonialsBand />

      {/* 5. Mobile App & Interactive Channels (USSD / Cards / POS) */}
      <MobileAppShowcase />

      <section className="py-20 bg-background pattern-dots relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <div className="inline-flex items-center gap-2 py-1.5 px-3.5 rounded-full bg-primary/10 border border-primary/20 mb-4">
              <Zap size={12} className="text-primary" />
              <span className="text-[10px] font-black uppercase tracking-[0.15em] text-primary">Omnichannel Delivery</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-display font-black text-foreground mb-4 tracking-tight">
              Cards, {profile.ussdCode} USSD &amp; Agency POS
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-sm sm:text-base leading-relaxed">
              Every customer and enterprise on {profile.shortName} operates seamlessly across cards, offline USSD, mobile apps, and POS cashpoints.
            </p>
          </div>

          <ExpandingReach />
        </div>
      </section>

      {/* 6. 4-Step Fast Financing */}
      <section className="py-20 bg-card text-card-foreground border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-accent font-bold tracking-wider uppercase text-xs mb-2">Fast Onboarding</h2>
            <h3 className="text-3xl md:text-4xl font-display font-bold text-foreground">
              Open Accounts or Apply for Credit in 4 Steps
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { icon: FileText, title: "Verify BVN / NIN", desc: "Complete secure digital onboarding in minutes." },
              { icon: CheckSquare, title: "Select Facility", desc: "Pick savings, salary loans, or school billing." },
              { icon: ShieldCheck, title: "Automated Review", desc: "Instant eligibility & risk officer sign-off." },
              { icon: DollarSign, title: "Disbursement", desc: "Funds credit straight to your ledger account." },
            ].map((step, idx) => (
              <div key={idx} className="text-center p-6 rounded-2xl border border-border bg-background space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
                  <step.icon size={26} />
                </div>
                <h4 className="text-base font-bold text-foreground">{step.title}</h4>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-12 text-center flex flex-wrap justify-center gap-4">
            <Link
              className="inline-flex items-center justify-center px-8 py-3.5 text-sm font-black rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-all shadow-md"
              href="/support"
            >
              Contact {profile.shortName}
            </Link>
            <Link
              className="inline-flex items-center justify-center px-8 py-3.5 text-sm font-black rounded-lg bg-accent text-accent-foreground hover:opacity-90 transition-all shadow-md"
              href="/business"
            >
              Explore Services
            </Link>
          </div>
        </div>
      </section>

      {/* Non-Blocking Cached Insights */}
      <Suspense fallback={null}>
        <NewsInsights />
      </Suspense>
    </main>
  );
}
