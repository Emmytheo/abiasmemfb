import Link from "next/link";
import Image from "next/image";
import { CheckCircle, ArrowRight, TrendingUp, Smartphone, Users, DollarSign, FileText, CheckSquare, ShieldCheck, Apple, Play, Battery, Wifi, Signal, Menu, UserCircle, Send, ArrowDownLeft, Receipt, CreditCard, Hash, Store } from "lucide-react";
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
              <div className="relative flex justify-center">
                <div className="absolute inset-0 bg-primary/10 rounded-full blur-3xl transform -translate-x-10 translate-y-10"></div>
                {/* Mobile Mockup */}
                <div className="w-[320px] bg-white rounded-[2rem] overflow-hidden shadow-2xl relative border-[8px] border-slate-900 z-10 transform scale-90 sm:scale-100 hover:scale-[1.02] transition-transform duration-500">
                  {/* Status Bar Mockup */}
                  <div className="h-6 bg-slate-900 flex justify-between items-center px-4">
                    <span className="text-[10px] text-white font-bold">9:41</span>
                    <div className="flex gap-1.5 items-center">
                      <Signal className="text-white w-3 h-3" />
                      <Wifi className="text-white w-3 h-3" />
                      <Battery className="text-white w-3.5 h-3.5" />
                    </div>
                  </div>
                  {/* App Content */}
                  <div className="bg-gray-50 min-h-[500px]">
                    {/* Header bar fake */}
                    <div className="bg-primary px-4 py-3 flex justify-between items-center shadow-sm">
                      <Menu className="text-black w-5 h-5 cursor-pointer" />
                      <span className="text-sm font-black tracking-tight text-black border-2 border-black rounded-sm px-2">ABIA MFB</span>
                      <UserCircle className="text-black w-6 h-6 cursor-pointer" />
                    </div>

                    <div className="p-4 space-y-5">
                      {/* Greeting */}
                      <div>
                        <p className="text-xs text-gray-500 font-medium">Good Morning,</p>
                        <h4 className="text-xl font-bold text-gray-900 tracking-tight">Sarah Johnson</h4>
                      </div>

                      {/* Balance Card */}
                      <div className="bg-slate-900 rounded-2xl p-5 text-white shadow-xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-bl-full transform translate-x-10 -translate-y-10"></div>
                        <p className="text-xs text-slate-400 font-medium mb-1">Total Available Balance</p>
                        <div className="flex items-center gap-2 mb-4">
                          <span className="text-lg font-light text-primary">₦</span>
                          <span className="text-3xl font-bold tracking-tighter">1,240,500<span className="text-lg text-slate-400">.00</span></span>
                        </div>
                        <div className="flex gap-3 text-xs font-semibold">
                          <button className="bg-primary text-black px-4 py-2 rounded-lg flex-1 hover:bg-white active:scale-95 transition-all">Add Money</button>
                          <button className="bg-white/10 text-white px-4 py-2 rounded-lg flex-1 hover:bg-white/20 active:scale-95 transition-all">Transfer</button>
                        </div>
                      </div>

                      {/* Quick Actions */}
                      <div className="grid grid-cols-4 gap-2">
                        <div className="flex flex-col items-center gap-1.5 cursor-pointer">
                          <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center text-primary hover:bg-primary/10 transition-colors">
                            <Send size={20} />
                          </div>
                          <span className="text-[10px] font-bold text-gray-600">Send</span>
                        </div>
                        <div className="flex flex-col items-center gap-1.5 cursor-pointer">
                          <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center text-primary hover:bg-primary/10 transition-colors">
                            <ArrowDownLeft size={20} />
                          </div>
                          <span className="text-[10px] font-bold text-gray-600">Receive</span>
                        </div>
                        <div className="flex flex-col items-center gap-1.5 cursor-pointer">
                          <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center text-primary hover:bg-primary/10 transition-colors">
                            <Receipt size={20} />
                          </div>
                          <span className="text-[10px] font-bold text-gray-600">Bills</span>
                        </div>
                        <div className="flex flex-col items-center gap-1.5 cursor-pointer">
                          <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center text-primary hover:bg-primary/10 transition-colors">
                            <Smartphone size={20} />
                          </div>
                          <span className="text-[10px] font-bold text-gray-600">Airtime</span>
                        </div>
                      </div>

                      {/* Recent Transactions */}
                      <div>
                        <div className="flex justify-between items-center mb-3">
                          <h4 className="text-sm font-bold text-gray-900">Recent Transactions</h4>
                          <span className="text-[10px] font-bold text-primary uppercase cursor-pointer">See All</span>
                        </div>
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden divide-y divide-gray-50">
                          {/* Transaction 1 */}
                          <div className="p-3 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center">
                                <ArrowDownLeft size={14} />
                              </div>
                              <div>
                                <p className="text-xs font-bold text-gray-900">Salary Credit</p>
                                <p className="text-[10px] text-gray-400">Today, 08:30 AM</p>
                              </div>
                            </div>
                            <p className="text-xs font-bold text-emerald-500">+₦450,000</p>
                          </div>
                          {/* Transaction 2 */}
                          <div className="p-3 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center">
                                <Send size={14} />
                              </div>
                              <div>
                                <p className="text-xs font-bold text-gray-900">MTN Airtime</p>
                                <p className="text-[10px] text-gray-400">Yesterday</p>
                              </div>
                            </div>
                            <p className="text-xs font-bold text-gray-900">-₦5,000</p>
                          </div>
                          {/* Transaction 3 */}
                          <div className="p-3 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center">
                                <Receipt size={14} />
                              </div>
                              <div>
                                <p className="text-xs font-bold text-gray-900">Aba Power PLC</p>
                                <p className="text-[10px] text-gray-400">Monday</p>
                              </div>
                            </div>
                            <p className="text-xs font-bold text-gray-900">-₦12,500</p>
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>
                  {/* Home Indicator */}
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-1/3 h-1 bg-slate-300 rounded-full"></div>
                </div>
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

      {/* Upcoming Channels */}
      <section className="py-24 bg-background pattern-dots">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-accent font-semibold tracking-wide uppercase text-sm mb-3">Expanding Our Reach</h2>
            <h3 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-6">
              More Ways to Bank <span className="text-muted-foreground font-light text-2xl md:text-3xl">(Coming Soon)</span>
            </h3>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              We are constantly innovating to bring AbiaSMEMFB closer to you. Our upcoming channels are designed to ensure you have 24/7 access to your funds and our services.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Cards */}
            <div className="bg-card text-card-foreground p-8 rounded-2xl shadow-sm border border-border/50 relative overflow-hidden group">
              <div className="absolute top-4 right-4 bg-muted/50 text-muted-foreground text-[10px] uppercase font-bold px-2 py-1 rounded">Soon</div>
              <div className="w-12 h-12 bg-muted rounded-xl flex items-center justify-center text-foreground mb-6 opacity-70 group-hover:opacity-100 transition-opacity">
                <CreditCard size={24} />
              </div>
              <h4 className="text-xl font-bold text-foreground mb-3 opacity-80 group-hover:opacity-100 transition-opacity">ATM & Virtual Cards</h4>
              <p className="text-muted-foreground leading-relaxed text-sm">
                Request physical or virtual debit cards. Manage your spending limits, pick your custom PIN securely, and freeze your card instantly from your app.
              </p>
            </div>

            {/* USSD */}
            <div className="bg-card text-card-foreground p-8 rounded-2xl shadow-sm border border-border/50 relative overflow-hidden group">
              <div className="absolute top-4 right-4 bg-muted/50 text-muted-foreground text-[10px] uppercase font-bold px-2 py-1 rounded">Soon</div>
              <div className="w-12 h-12 bg-muted rounded-xl flex items-center justify-center text-foreground mb-6 opacity-70 group-hover:opacity-100 transition-opacity">
                <Hash size={24} />
              </div>
              <h4 className="text-xl font-bold text-foreground mb-3 opacity-80 group-hover:opacity-100 transition-opacity">USSD Banking (*xxx#)</h4>
              <p className="text-muted-foreground leading-relaxed text-sm">
                No internet? No problem. Check balances, buy airtime, and transfer funds seamlessly with our dedicated USSD code from any basic mobile phone.
              </p>
            </div>

            {/* Agency Banking */}
            <div className="bg-card text-card-foreground p-8 rounded-2xl shadow-sm border border-border/50 relative overflow-hidden group">
              <div className="absolute top-4 right-4 bg-muted/50 text-muted-foreground text-[10px] uppercase font-bold px-2 py-1 rounded">Soon</div>
              <div className="w-12 h-12 bg-muted rounded-xl flex items-center justify-center text-foreground mb-6 opacity-70 group-hover:opacity-100 transition-opacity">
                <Store size={24} />
              </div>
              <h4 className="text-xl font-bold text-foreground mb-3 opacity-80 group-hover:opacity-100 transition-opacity">Agency Banking (POS)</h4>
              <p className="text-muted-foreground leading-relaxed text-sm">
                Access cash deposits and withdrawals right in your neighborhood through our extensive network of authorized POS agents across the state.
              </p>
            </div>
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
