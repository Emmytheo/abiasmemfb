"use client";

import Link from "next/link";
import {
    CheckCircle, ArrowDownLeft, Send, Receipt, CreditCard, Users, Store,
    Menu, UserCircle, Signal, Wifi, Battery, Apple, Play, GraduationCap
} from "lucide-react";
import { useBankProfile } from "@/context/bank-profile-context";

export function MobileAppShowcase() {
    const { activeProfile } = useBankProfile();

    return (
        <section className="py-24 bg-muted overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col lg:flex-row items-center gap-16">
                    <div className="lg:w-1/2 order-2 lg:order-1">
                        <div className="relative flex justify-center">
                            <div className="absolute inset-0 bg-primary/10 rounded-full blur-3xl transform -translate-x-10 translate-y-10" />
                            <div className="w-[320px] bg-white rounded-[2rem] overflow-hidden shadow-2xl relative border-[8px] border-slate-900 z-10 transform scale-95 sm:scale-100 hover:scale-[1.02] transition-transform duration-500">
                                <div className="h-6 bg-slate-900 flex justify-between items-center px-4">
                                    <span className="text-[10px] text-white font-bold">9:41</span>
                                    <div className="flex gap-1.5 items-center">
                                        <Signal className="text-white w-3 h-3" />
                                        <Wifi className="text-white w-3 h-3" />
                                        <Battery className="text-white w-3.5 h-3.5" />
                                    </div>
                                </div>
                                <div className="bg-gray-50 min-h-[500px]">
                                    <div className="bg-primary px-4 py-3 flex justify-between items-center shadow-sm">
                                        <Menu className="text-primary-foreground w-5 h-5 cursor-pointer" />
                                        <span className="text-xs font-black tracking-tight text-primary-foreground border border-primary-foreground/60 rounded-sm px-2 py-0.5">
                                            {activeProfile.shortName}
                                        </span>
                                        <UserCircle className="text-primary-foreground w-6 h-6 cursor-pointer" />
                                    </div>

                                    <div className="p-4 space-y-5">
                                        <div>
                                            <p className="text-xs text-gray-500 font-medium">Sample Customer Mobile View</p>
                                            <h4 className="text-lg font-bold text-gray-900 tracking-tight">{activeProfile.shortName} Mobile</h4>
                                        </div>

                                        <div className="bg-slate-900 rounded-2xl p-5 text-white shadow-xl relative overflow-hidden">
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/25 rounded-bl-full transform translate-x-10 -translate-y-10" />
                                            <p className="text-xs text-slate-400 font-medium mb-1">Primary Account</p>
                                            <p className="text-xs font-mono text-accent font-bold mb-3">{activeProfile.demoAccountNumber}</p>
                                            <div className="flex gap-3 text-xs font-semibold">
                                                <Link href="/auth/login" className="bg-primary text-primary-foreground px-4 py-2 rounded-lg flex-1 text-center hover:opacity-90 transition-all">
                                                    Transfer
                                                </Link>
                                                <Link href="/business#collections" className="bg-white/10 text-white px-4 py-2 rounded-lg flex-1 text-center hover:bg-white/20 transition-all">
                                                    Pay Fees
                                                </Link>
                                            </div>
                                        </div>

                                        <div className="space-y-3 bg-white p-3 rounded-2xl border border-gray-100 shadow-sm">
                                            <div className="flex justify-between items-center text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                                                <span>Connected Modules</span>
                                                <span className="text-emerald-600 font-extrabold">● READY</span>
                                            </div>

                                            <div className="space-y-1">
                                                <div className="flex justify-between items-center text-[10px]">
                                                    <span className="font-bold text-gray-800 truncate">{activeProfile.demoCoopName}</span>
                                                    <span className="font-mono text-gray-500">Co-Op Sync</span>
                                                </div>
                                                <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                                                    <div className="bg-primary h-full w-3/4 rounded-full" />
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-gray-100 text-[10px]">
                                                <div className="flex items-center gap-2">
                                                    <CreditCard className="w-3.5 h-3.5 text-primary shrink-0" />
                                                    <span className="font-mono font-bold text-slate-800">{activeProfile.shortName} Contactless</span>
                                                </div>
                                                <span className="bg-emerald-50 text-emerald-600 font-extrabold px-1.5 py-0.5 rounded text-[8px]">ACTIVE</span>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-4 gap-2">
                                            <div className="flex flex-col items-center gap-1.5">
                                                <div className="w-11 h-11 bg-white rounded-full shadow-sm flex items-center justify-center text-primary">
                                                    <Send size={18} />
                                                </div>
                                                <span className="text-[10px] font-bold text-gray-600">Send</span>
                                            </div>
                                            <div className="flex flex-col items-center gap-1.5">
                                                <div className="w-11 h-11 bg-white rounded-full shadow-sm flex items-center justify-center text-primary">
                                                    <GraduationCap size={18} />
                                                </div>
                                                <span className="text-[10px] font-bold text-gray-600">Schools</span>
                                            </div>
                                            <div className="flex flex-col items-center gap-1.5">
                                                <div className="w-11 h-11 bg-white rounded-full shadow-sm flex items-center justify-center text-primary">
                                                    <Users size={18} />
                                                </div>
                                                <span className="text-[10px] font-bold text-gray-600">Esusu</span>
                                            </div>
                                            <div className="flex flex-col items-center gap-1.5">
                                                <div className="w-11 h-11 bg-white rounded-full shadow-sm flex items-center justify-center text-primary">
                                                    <Store size={18} />
                                                </div>
                                                <span className="text-[10px] font-bold text-gray-600">POS</span>
                                            </div>
                                        </div>

                                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden divide-y divide-gray-50">
                                            <div className="p-3 flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                                        <ArrowDownLeft size={14} />
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-bold text-gray-900">Salary Payroll Credit</p>
                                                        <p className="text-[10px] text-gray-400">Automated Settlement</p>
                                                    </div>
                                                </div>
                                                <span className="text-[10px] font-bold text-emerald-600">CLEARED</span>
                                            </div>
                                            <div className="p-3 flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                                                        <Receipt size={14} />
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-bold text-gray-900">School Tuition &amp; Utility</p>
                                                        <p className="text-[10px] text-gray-400">Instant E-Receipt</p>
                                                    </div>
                                                </div>
                                                <span className="text-[10px] font-bold text-primary">VERIFIED</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="lg:w-1/2 order-1 lg:order-2">
                        <h2 className="text-accent font-bold tracking-wider uppercase text-sm mb-3">
                            iOS, Android &amp; USSD ({activeProfile.ussdCode})
                        </h2>
                        <h3 className="text-3xl md:text-5xl font-display font-bold text-foreground mb-6 leading-tight">
                            Banking that fits cleanly in your pocket.
                        </h3>
                        <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                            Manage savings, salary loans, school fee collections, and instant inter-bank transfers across Android, iOS, Web Banking, or offline USSD ({activeProfile.ussdCode}).
                        </p>
                        <div className="space-y-4 mb-10">
                            {[
                                `Instant intra-bank transfers across ${activeProfile.shortName} accounts`,
                                "School fee billing with downloadable verified digital receipts",
                                "Biometric login, transaction PINs & real-time card controls",
                            ].map((feat) => (
                                <div key={feat} className="flex items-start">
                                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
                                        <CheckCircle className="text-primary" size={14} />
                                    </div>
                                    <p className="ml-4 text-base text-foreground">{feat}</p>
                                </div>
                            ))}
                        </div>
                        <div className="flex flex-wrap gap-4">
                            <Link href="/internet-banking" className="flex items-center bg-foreground text-background px-4 py-2.5 rounded-xl hover:opacity-85 transition-opacity">
                                <Apple className="mr-2" size={26} />
                                <div className="text-left">
                                    <p className="text-[10px] uppercase font-semibold leading-none">iOS &amp; Web App</p>
                                    <p className="text-sm font-bold leading-none mt-1">{activeProfile.shortName} Mobile</p>
                                </div>
                            </Link>
                            <Link href="/internet-banking" className="flex items-center bg-foreground text-background px-4 py-2.5 rounded-xl hover:opacity-85 transition-opacity">
                                <Play className="mr-2 fill-current" size={24} />
                                <div className="text-left">
                                    <p className="text-[10px] uppercase font-semibold leading-none">Android App</p>
                                    <p className="text-sm font-bold leading-none mt-1">Google Play</p>
                                </div>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
