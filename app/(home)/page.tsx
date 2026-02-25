import Link from "next/link";
import Image from "next/image";
import { CheckCircle, ArrowRight, TrendingUp, Smartphone, Users, DollarSign, FileText, CheckSquare, ShieldCheck, Apple, Play } from "lucide-react";
import { Newsletter } from "@/components/newsletter";
import { SuccessStories } from "@/components/home/success-stories";
import { NewsInsights } from "@/components/home/news-insights";
import { Suspense } from "react";

export default function Home() {
  return (
    <>
      {/* Hero Section */}
      <section className="relative h-screen min-h-[600px] flex items-center justify-center overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat bg-fixed"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1579621970588-a35d0e7ab9b6?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2070&q=80')" }}
        ></div>
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(color-mix(in srgb, hsl(var(--primary)), transparent 20%), color-mix(in srgb, hsl(var(--primary)), transparent 40%))" }}
        ></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center z-10">
          <span className="inline-block py-1 px-3 rounded-full bg-accent/20 border border-accent/40 text-accent text-sm font-semibold mb-6 animate-fade-in-up">
            Building Tomorrow, Today
          </span>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-display font-bold text-white mb-6 leading-tight tracking-tight">
            Empowering Your <br />
            <span className="text-accent italic">Financial Future</span>
          </h1>
          <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-200 font-light mb-10">
            We create financial giants by providing bespoke microfinance solutions for entrepreneurs and small
            business owners across Abia State.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              className="inline-flex items-center justify-center px-8 py-4 text-base font-semibold rounded-full text-white bg-primary border-2 border-primary hover:bg-transparent hover:text-white transition-all duration-300 shadow-lg hover:shadow-xl"
              href="/personal-banking"
            >
              Open An Account
            </Link>
            <Link
              className="inline-flex items-center justify-center px-8 py-4 text-base font-semibold rounded-full text-white border-2 border-white/30 bg-white/10 hover:bg-white hover:text-primary backdrop-blur-sm transition-all duration-300"
              href="/business"
            >
              Explore Services
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-background -mt-20 relative z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-card text-card-foreground rounded-2xl shadow-xl p-8 grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border -mt-20">
            <div className="p-6 text-center">
              <p className="text-4xl font-display font-bold text-primary mb-2">25k+</p>
              <p className="text-muted-foreground font-medium">Active Customers</p>
            </div>
            <div className="p-6 text-center">
              <p className="text-4xl font-display font-bold text-primary mb-2">98%</p>
              <p className="text-muted-foreground font-medium">Customer Satisfaction</p>
            </div>
            <div className="p-6 text-center">
              <p className="text-4xl font-display font-bold text-primary mb-2">₦1.5B+</p>
              <p className="text-muted-foreground font-medium">Loans Disbursed</p>
            </div>
          </div>
        </div>
      </section>

      {/* Expertise Section */}
      <section className="py-20 bg-background pattern-dots">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-accent font-semibold tracking-wide uppercase text-sm mb-3">Our Expertise</h2>
            <h3 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-6">
              Banking Tailored To You
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
            <div className="bg-card text-card-foreground p-8 rounded-2xl shadow-lg hover:-translate-y-1 transition-transform duration-300">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-6">
                <DollarSign />
              </div>
              <h4 className="text-xl font-bold text-foreground mb-3">Business Savings</h4>
              <p className="text-muted-foreground leading-relaxed">
                Secure your business future with competitive interest rates designed to help your capital grow
                steadily.
              </p>
            </div>
            <div className="bg-card text-card-foreground p-8 rounded-2xl shadow-lg hover:-translate-y-1 transition-transform duration-300 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-accent/5 rounded-bl-full transition-transform group-hover:scale-150 duration-500"></div>
              <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center text-accent mb-6 relative z-10">
                <TrendingUp />
              </div>
              <h4 className="text-xl font-bold text-foreground mb-3 relative z-10">SME Loans</h4>
              <p className="text-muted-foreground leading-relaxed relative z-10">
                Fast, flexible financing solutions to scale your operations, purchase inventory, or expand your
                reach.
              </p>
            </div>
            <div className="bg-card text-card-foreground p-8 rounded-2xl shadow-lg hover:-translate-y-1 transition-transform duration-300">
              <div className="w-12 h-12 bg-secondary/10 rounded-xl flex items-center justify-center text-secondary mb-6">
                <Smartphone />
              </div>
              <h4 className="text-xl font-bold text-foreground mb-3">Digital Banking</h4>
              <p className="text-muted-foreground leading-relaxed">
                Experience banking at your fingertips. Transfer funds, pay bills, and manage accounts 24/7.
              </p>
            </div>
          </div>

          <div className="bg-primary rounded-3xl p-8 md:p-12 text-white relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-primary-foreground/5 rounded-full blur-3xl"></div>
            <div className="max-w-2xl relative z-10">
              <h3 className="text-2xl md:text-3xl font-display font-bold mb-4 text-primary-foreground">Flexible Financing</h3>
              <p className="text-primary-foreground/90 text-lg mb-6">
                We've simplified the loan application process to get you the capital you need without the usual
                banking headaches.
              </p>
              <div className="flex flex-wrap gap-4 text-sm font-medium text-primary-foreground/80">
                <span className="flex items-center gap-1">
                  <CheckCircle size={16} /> Fast Approval
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle size={16} /> Low Interest
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle size={16} /> Secure
                </span>
              </div>
            </div>
            <div className="flex-shrink-0 relative z-10">
              <Link
                className="inline-flex items-center justify-center px-8 py-3 bg-white text-primary font-bold rounded-lg shadow-lg hover:bg-gray-50 transition-colors"
                href="/business"
              >
                Start Your Application
                <ArrowRight className="ml-2" size={20} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* App Section */}
      <section className="py-24 bg-muted overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <div className="lg:w-1/2 order-2 lg:order-1">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/10 rounded-full blur-3xl transform -translate-x-10 translate-y-10"></div>
                <img
                  alt="Mobile Banking App Interface"
                  className="relative rounded-2xl shadow-2xl border-4 border-border w-full max-w-md mx-auto transform hover:scale-[1.02] transition-transform duration-500"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuBTI_Ts85VC_1JndsAWXrDIGgJ4EIj_dHeoDbCz_8IsmaxFXvb_v0E-Ny5S5GXraCXfCsGHXdYvtVy2Iyg5ScV5q3XhxcoUm0anbx3GYX3W_OGmH6u3DDR08SnvRRJvW4qRjBALAriKNYzcuj9w_cCA97o-wPjsRlbdul_uSh7s58BfW5PPW-HtwI1eMD41GC0qks36_aqB76lRcG14OVwfZPs3pVzLbJfdgWdnSvkBBZf3VR3fufzc7FXUiTqxEHd6BJVGOGNInN2a"
                />
              </div>
            </div>
            <div className="lg:w-1/2 order-1 lg:order-2">
              <h2 className="text-accent font-bold tracking-wider uppercase text-sm mb-3">Seamless Experience</h2>
              <h3 className="text-3xl md:text-5xl font-display font-bold text-foreground mb-6 leading-tight">
                Banking that fits in your pocket.
              </h3>
              <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                Manage your finances on the go with our secure and intuitive mobile app. From instant transfers to
                bill payments, control your wealth from anywhere in the world.
              </p>
              <div className="space-y-4 mb-10">
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-secondary/20 flex items-center justify-center mt-1">
                    <CheckCircle className="text-secondary" size={14} />
                  </div>
                  <p className="ml-4 text-base text-foreground">
                    Zero Rate Transactions on internal transfers
                  </p>
                </div>
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-secondary/20 flex items-center justify-center mt-1">
                    <CheckCircle className="text-secondary" size={14} />
                  </div>
                  <p className="ml-4 text-base text-foreground">
                    Real-time spending notifications
                  </p>
                </div>
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-secondary/20 flex items-center justify-center mt-1">
                    <CheckCircle className="text-secondary" size={14} />
                  </div>
                  <p className="ml-4 text-base text-foreground">
                    Biometric security for your peace of mind
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <button className="flex items-center bg-foreground text-background px-4 py-2 rounded-lg hover:opacity-80 transition-opacity">
                  <Apple className="text-3xl mr-2" size={30} />
                  <div className="text-left">
                    <p className="text-[10px] uppercase font-semibold leading-none">Download on the</p>
                    <p className="text-sm font-bold leading-none mt-1">App Store</p>
                  </div>
                </button>
                <button className="flex items-center bg-foreground text-background px-4 py-2 rounded-lg hover:opacity-80 transition-opacity">
                  <Play className="text-3xl mr-2 fill-current" size={30} />
                  <div className="text-left">
                    <p className="text-[10px] uppercase font-semibold leading-none">Get it on</p>
                    <p className="text-sm font-bold leading-none mt-1">Google Play</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-24 bg-card text-card-foreground relative overflow-hidden">
        <div className="absolute inset-y-0 left-0 w-1 bg-accent opacity-20"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-accent font-bold tracking-wider uppercase text-sm mb-3">Flexible Financing</h2>
            <h3 className="text-3xl md:text-4xl font-display font-bold text-foreground">
              Get Funded in 4 Simple Steps
            </h3>
            <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
              We've simplified the loan application process to get you the capital you need without the usual
              banking headaches.
            </p>
          </div>
          <div className="relative grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="hidden md:block absolute top-[3.5rem] left-0 w-full h-0.5 bg-border -z-10"></div>
            {/* Step 1 */}
            <div className="text-center group relative">
              <div className="w-28 h-28 mx-auto relative mb-6">
                <svg className="w-full h-full transform -rotate-90">
                  <circle className="text-border" cx="50%" cy="50%" fill="transparent"
                    r="45%" stroke="currentColor" strokeWidth="6"></circle>
                  <circle className="text-accent transition-all duration-1000 ease-out group-hover:stroke-primary"
                    cx="50%" cy="50%" fill="transparent" r="45%" stroke="currentColor"
                    strokeDasharray="283" strokeDashoffset="210" strokeLinecap="round" strokeWidth="6">
                  </circle>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <FileText size={32} className="text-primary" />
                </div>
              </div>
              <h4 className="text-lg font-bold text-foreground mb-2">Check Eligibility</h4>
              <p className="text-sm text-muted-foreground leading-relaxed px-4">
                Complete our secure online form in under 5 minutes to see your qualified amount.
              </p>
            </div>
            {/* Step 2 */}
            <div className="text-center group relative">
              <div className="w-28 h-28 mx-auto relative mb-6">
                <svg className="w-full h-full transform -rotate-90">
                  <circle className="text-border" cx="50%" cy="50%" fill="transparent"
                    r="45%" stroke="currentColor" strokeWidth="6"></circle>
                  <circle className="text-accent transition-all duration-1000 ease-out group-hover:stroke-primary"
                    cx="50%" cy="50%" fill="transparent" r="45%" stroke="currentColor"
                    strokeDasharray="283" strokeDashoffset="140" strokeLinecap="round" strokeWidth="6">
                  </circle>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <CheckSquare size={32} className="text-primary" />
                </div>
              </div>
              <h4 className="text-lg font-bold text-foreground mb-2">Documentation</h4>
              <p className="text-sm text-muted-foreground leading-relaxed px-4">
                Upload your basic ID and business documents directly through our portal.
              </p>
            </div>
            {/* Step 3 */}
            <div className="text-center group relative">
              <div className="w-28 h-28 mx-auto relative mb-6">
                <svg className="w-full h-full transform -rotate-90">
                  <circle className="text-border" cx="50%" cy="50%" fill="transparent"
                    r="45%" stroke="currentColor" strokeWidth="6"></circle>
                  <circle className="text-accent transition-all duration-1000 ease-out group-hover:stroke-primary"
                    cx="50%" cy="50%" fill="transparent" r="45%" stroke="currentColor"
                    strokeDasharray="283" strokeDashoffset="70" strokeLinecap="round" strokeWidth="6">
                  </circle>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <ShieldCheck size={32} className="text-primary" />
                </div>
              </div>
              <h4 className="text-lg font-bold text-foreground mb-2">Fast Approval</h4>
              <p className="text-sm text-muted-foreground leading-relaxed px-4">
                Our team reviews applications within 24 hours to give you a quick decision.
              </p>
            </div>
            {/* Step 4 */}
            <div className="text-center group relative">
              <div className="w-28 h-28 mx-auto relative mb-6">
                <svg className="w-full h-full transform -rotate-90">
                  <circle className="text-border" cx="50%" cy="50%" fill="transparent"
                    r="45%" stroke="currentColor" strokeWidth="6"></circle>
                  <circle className="text-accent transition-all duration-1000 ease-out group-hover:stroke-primary"
                    cx="50%" cy="50%" fill="transparent" r="45%" stroke="currentColor"
                    strokeDasharray="283" strokeDashoffset="0" strokeLinecap="round" strokeWidth="6">
                  </circle>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <DollarSign size={32} className="text-primary" />
                </div>
              </div>
              <h4 className="text-lg font-bold text-foreground mb-2">Disbursement</h4>
              <p className="text-sm text-muted-foreground leading-relaxed px-4">
                Funds are deposited directly into your account instantly upon final approval.
              </p>
            </div>
          </div>
          <div className="mt-16 text-center">
            <Link
              className="inline-flex items-center justify-center px-8 py-3 text-sm font-semibold rounded-full text-white bg-primary hover:bg-accent hover:text-primary transition-all duration-300 shadow-md"
              href="/business"
            >
              Start Your Application
            </Link>
          </div>
        </div>
      </section>

      {/* Success Stories */}
      <SuccessStories />
      {/* News & Insights */}
      <Suspense fallback={null}>
        <NewsInsights />
      </Suspense>
    </>
  );
}
