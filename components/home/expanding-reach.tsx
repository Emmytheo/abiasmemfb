"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { CreditCard, Hash, Store, ArrowRight, RefreshCw, Smartphone, CheckCircle, ChevronRight, Zap } from "lucide-react";

export function ExpandingReach() {
  // ATM Card State
  const [cardBrand, setCardBrand] = useState<"Visa" | "Mastercard" | "Verve">("Verve");
  const brands: ("Visa" | "Mastercard" | "Verve")[] = ["Verve", "Visa", "Mastercard"];

  useEffect(() => {
    const interval = setInterval(() => {
      setCardBrand((prev) => {
        const nextIdx = (brands.indexOf(prev) + 1) % brands.length;
        return brands[nextIdx];
      });
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // USSD State
  const [ussdState, setUssdState] = useState<"idle" | "dialing" | "menu" | "success">("idle");
  const [ussdOutput, setUssdOutput] = useState("");

  const triggerUssd = (command: string) => {
    setUssdState("dialing");
    setTimeout(() => {
      if (command === "*5125#") {
        setUssdState("menu");
      } else if (command === "1") {
        setUssdOutput("Balance: ₦1,240,500.00\nAjo Esusu: ₦250,000.00\n[0] Back");
        setUssdState("success");
      } else if (command === "2") {
        setUssdOutput("Select Cycle:\n1. Ariaria Market Thrift\n2. Aba Shoe Union\n[0] Back");
        setUssdState("success");
      } else if (command === "3") {
        setUssdOutput("Transfers:\n1. To Abia MFB Account\n2. To Other Banks\n[0] Back");
        setUssdState("success");
      } else {
        setUssdState("idle");
      }
    }, 800);
  };

  // Agency POS State
  const [posVolume, setPosVolume] = useState<number>(45);

  const calculateCommission = (vol: number) => {
    // ₦100 average commission per transaction
    return vol * 100 * 30;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {/* 1. ATM & Virtual Smart Cards */}
      <div className="bg-card text-card-foreground p-8 rounded-3xl shadow-lg border border-border/80 relative overflow-hidden group hover:shadow-2xl hover:border-primary/30 transition-all duration-500 flex flex-col justify-between min-h-[460px]">
        {/* Dynamic decorative light */}
        <div className="absolute -right-20 -top-20 w-40 h-40 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-all duration-500"></div>

        <div>
          <div className="flex justify-between items-center mb-6">
            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary border border-primary/20 group-hover:scale-110 transition-transform duration-500">
              <CreditCard size={24} />
            </div>
            <span className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[10px] uppercase font-black px-2.5 py-1 rounded-full animate-pulse">
              Active Now
            </span>
          </div>

          <h4 className="text-2xl font-black text-foreground mb-3 tracking-tight">
            ATM & Smart Cards
          </h4>
          <p className="text-muted-foreground leading-relaxed text-sm mb-6">
            Instantly issue virtual cards or order physical Mastercard, Visa, and Verve cards. Adjust spending limits and freeze cards on the fly.
          </p>

          {/* Interactive Card Graphic */}
          <div className="my-4 perspective-1000">
            <div className={`w-full h-36 rounded-2xl p-4 text-white flex flex-col justify-between shadow-lg relative overflow-hidden transition-all duration-500 ${
              cardBrand === "Verve" 
                ? "bg-gradient-to-br from-emerald-600 to-teal-900 border border-emerald-500/30" 
                : cardBrand === "Visa"
                ? "bg-gradient-to-br from-blue-700 to-indigo-950 border border-blue-600/30"
                : "bg-gradient-to-br from-neutral-800 to-neutral-950 border border-neutral-700/30"
            }`}>
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full blur-xl"></div>
              
              <div className="flex justify-between items-start z-10">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">Abia MFB</span>
                <span className="text-[10px] font-extrabold uppercase bg-white/10 px-2 py-0.5 rounded backdrop-blur">Smart Card</span>
              </div>

              {/* Gold Chip Mock */}
              <div className="w-8 h-6 bg-gradient-to-r from-amber-400 to-yellow-200 rounded-md border border-amber-300 shadow-sm z-10 self-start mt-2"></div>

              <div className="flex justify-between items-end z-10 mt-auto">
                <div>
                  <p className="text-xs font-mono tracking-widest">•••• •••• •••• 4912</p>
                  <p className="text-[8px] uppercase tracking-wider text-slate-300 mt-1">Sarah Johnson</p>
                </div>
                <span className="text-xs font-black italic tracking-wide">
                  {cardBrand}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-border/50">
          <Link 
            href="/business#cards" 
            className="inline-flex items-center justify-between w-full text-sm font-black text-primary hover:text-accent transition-colors group/btn"
          >
            <span>Customize Smart Card</span>
            <ArrowRight size={16} className="group-hover/btn:translate-x-1.5 transition-transform" />
          </Link>
        </div>
      </div>

      {/* 2. USSD Banking (*5125#) */}
      <div className="bg-card text-card-foreground p-8 rounded-3xl shadow-lg border border-border/80 relative overflow-hidden group hover:shadow-2xl hover:border-primary/30 transition-all duration-500 flex flex-col justify-between min-h-[460px]">
        {/* Dynamic decorative light */}
        <div className="absolute -right-20 -top-20 w-40 h-40 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-all duration-500"></div>

        <div>
          <div className="flex justify-between items-center mb-6">
            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary border border-primary/20 group-hover:scale-110 transition-transform duration-500">
              <Hash size={24} />
            </div>
            <span className="bg-primary/10 text-primary border border-primary/20 text-[10px] uppercase font-black px-2.5 py-1 rounded-full">
              Zero Internet
            </span>
          </div>

          <h4 className="text-2xl font-black text-foreground mb-3 tracking-tight">
            Offline USSD (*5125#)
          </h4>
          <p className="text-muted-foreground leading-relaxed text-sm mb-6">
            No active data? Run rapid offline banking checks, Esusu thrift pool transfers, and utility payments from any basic phone.
          </p>

          {/* Simulated Retro Mobile Device screen */}
          <div className="bg-slate-950 rounded-2xl p-4 border border-slate-800 shadow-inner font-mono text-xs text-green-400 min-h-[144px] flex flex-col justify-between relative overflow-hidden">
            {ussdState === "idle" && (
              <div className="flex flex-col items-center justify-center h-full my-auto text-center space-y-2">
                <span className="text-slate-500 text-[10px]">Mobile Signal Active</span>
                <span className="text-sm font-bold text-white tracking-widest">*5125#</span>
                <button 
                  onClick={() => triggerUssd("*5125#")}
                  className="bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold px-4 py-1.5 rounded-full text-[10px] border border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all animate-pulse"
                >
                  Dial Code
                </button>
              </div>
            )}

            {ussdState === "dialing" && (
              <div className="flex flex-col items-center justify-center h-full my-auto space-y-3">
                <RefreshCw className="animate-spin text-emerald-500 h-5 w-5" />
                <span className="text-[10px] tracking-widest text-emerald-500 animate-pulse">RUNNING USSD CODE...</span>
              </div>
            )}

            {ussdState === "menu" && (
              <div className="space-y-1.5">
                <p className="text-white border-b border-slate-800 pb-1 font-bold text-[10px] uppercase text-emerald-500">ABIA MFB MOBILE</p>
                <div className="space-y-0.5 text-[10px]">
                  <p className="hover:text-white cursor-pointer" onClick={() => triggerUssd("1")}>1. Account Balance</p>
                  <p className="hover:text-white cursor-pointer" onClick={() => triggerUssd("2")}>2. My Esusu Cycles</p>
                  <p className="hover:text-white cursor-pointer" onClick={() => triggerUssd("3")}>3. Local Transfer</p>
                </div>
                <div className="flex justify-between items-center pt-2 mt-1 border-t border-slate-900">
                  <span className="text-[8px] text-slate-500">Press option to select</span>
                  <button 
                    onClick={() => setUssdState("idle")}
                    className="text-[9px] text-rose-500 font-bold hover:underline"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {ussdState === "success" && (
              <div className="flex flex-col justify-between h-full space-y-2">
                <div className="whitespace-pre-line text-[10px] text-slate-200">
                  {ussdOutput}
                </div>
                <div className="flex justify-end gap-2 border-t border-slate-900 pt-2 mt-auto">
                  <button 
                    onClick={() => setUssdState("menu")}
                    className="text-[9px] text-emerald-400 font-bold hover:underline"
                  >
                    Back
                  </button>
                  <button 
                    onClick={() => setUssdState("idle")}
                    className="text-[9px] text-rose-500 font-bold hover:underline"
                  >
                    Exit
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-border/50">
          <Link 
            href="/business" 
            className="inline-flex items-center justify-between w-full text-sm font-black text-primary hover:text-accent transition-colors group/btn"
          >
            <span>View Offline Codes</span>
            <ArrowRight size={16} className="group-hover/btn:translate-x-1.5 transition-transform" />
          </Link>
        </div>
      </div>

      {/* 3. Agency Banking (POS) */}
      <div className="bg-card text-card-foreground p-8 rounded-3xl shadow-lg border border-border/80 relative overflow-hidden group hover:shadow-2xl hover:border-primary/30 transition-all duration-500 flex flex-col justify-between min-h-[460px]">
        {/* Dynamic decorative light */}
        <div className="absolute -right-20 -top-20 w-40 h-40 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-all duration-500"></div>

        <div>
          <div className="flex justify-between items-center mb-6">
            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary border border-primary/20 group-hover:scale-110 transition-transform duration-500">
              <Store size={24} />
            </div>
            <span className="bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[10px] uppercase font-black px-2.5 py-1 rounded-full">
              Partner & Earn
            </span>
          </div>

          <h4 className="text-2xl font-black text-foreground mb-3 tracking-tight">
            Agency POS Network
          </h4>
          <p className="text-muted-foreground leading-relaxed text-sm mb-6">
            Become a neighborhood banking point. Facilitate cash deposits, withdrawals, and Esusu collection payouts with our low-fee POS terminals.
          </p>

          {/* Interactive Agent Commission Estimator */}
          <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-4 border border-border/60 shadow-sm space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-extrabold uppercase text-slate-500 tracking-wider">Earnings Estimator</span>
              <span className="text-[10px] font-black text-primary">₦100 / Tx Fee</span>
            </div>
            
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] font-bold">
                <span className="text-muted-foreground">Daily Transactions:</span>
                <span className="text-foreground">{posVolume} txs</span>
              </div>
              <input 
                type="range" 
                min="10" 
                max="200" 
                value={posVolume}
                onChange={(e) => setPosVolume(Number(e.target.value))}
                className="w-full accent-primary h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>

            <div className="bg-primary/5 dark:bg-primary/10 border border-primary/10 p-2.5 rounded-xl flex justify-between items-center">
              <div>
                <p className="text-[8px] uppercase tracking-wider text-slate-400 font-extrabold">Est. Monthly Earnings</p>
                <p className="text-lg font-black text-primary tracking-tight">₦{calculateCommission(posVolume).toLocaleString()}</p>
              </div>
              <span className="bg-emerald-500 text-black text-[9px] font-black px-2 py-0.5 rounded-md shadow-sm">
                + BONUS
              </span>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-border/50">
          <Link 
            href="/business#agency" 
            className="inline-flex items-center justify-between w-full text-sm font-black text-primary hover:text-accent transition-colors group/btn"
          >
            <span>Apply for Agency Terminal</span>
            <ArrowRight size={16} className="group-hover/btn:translate-x-1.5 transition-transform" />
          </Link>
        </div>
      </div>
    </div>
  );
}
