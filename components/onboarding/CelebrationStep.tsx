"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { PartyPopper, ArrowRight, CheckCircle2, Copy, Building, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { useDummyData } from "@/lib/api";

interface CelebrationStepProps {
    accountNumber: string;
    customerId: string;
}

export function CelebrationStep({ accountNumber, customerId }: CelebrationStepProps) {
    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success("Copied to clipboard!");
    };

    return (
        <div className="space-y-8 py-4">
            <div className="flex flex-col items-center text-center space-y-4">
                <div className="relative">
                    <motion.div 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", damping: 10, stiffness: 100 }}
                        className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center text-primary"
                    >
                        <PartyPopper className="h-12 w-12" />
                    </motion.div>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-green-500 border-4 border-background flex items-center justify-center text-white"
                    >
                        <CheckCircle2 className="h-3 w-3" />
                    </motion.div>
                </div>

                <div className="space-y-2">
                    <h2 className="text-4xl font-black tracking-tight bg-gradient-to-br from-foreground to-foreground/60 bg-clip-text text-transparent">
                        Congratulations!
                    </h2>
                    <p className="text-muted-foreground text-lg">
                        Your account is now active and ready for use.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div 
                    className="p-6 rounded-2xl bg-muted/30 border border-primary/10 group cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => copyToClipboard(accountNumber)}
                >
                    <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Account Number</span>
                        <Copy className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <p className="text-3xl font-mono font-bold tracking-[0.2em] text-primary">{accountNumber}</p>
                </div>

                <div className="p-6 rounded-2xl bg-muted/30 border border-primary/10">
                    <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Customer ID</span>
                        <Building className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <p className="text-2xl font-mono font-semibold text-foreground/80">{customerId}</p>
                </div>
            </div>

            <div className="bg-primary/5 rounded-2xl p-6 border border-primary/20 space-y-4">
                <div className="flex items-start gap-4">
                    <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground shrink-0">
                        <PartyPopper className="h-5 w-5" />
                    </div>
                    <div className="space-y-1">
                        <h4 className="font-bold text-primary">Your Welcome Bonus Awaits</h4>
                        <p className="text-sm text-muted-foreground">Fund your account with at least ₦1,000 to activate your premium features and start earning interest.</p>
                    </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <Button variant="outline" className="flex-1 rounded-xl bg-background" asChild>
                        <Link href="/client-dashboard/fund">
                            Fund Account
                            <ExternalLink className="ml-2 h-4 w-4" />
                        </Link>
                    </Button>
                    <Button className="flex-1 rounded-xl shadow-lg shadow-primary/25 group" asChild>
                        <Link href="/client-dashboard">
                            Go to Dashboard
                            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </Link>
                    </Button>
                </div>
            </div>

            <div className="text-center pt-4">
                <p className="text-xs text-muted-foreground">
                    You can find your account details anytime in the <span className="font-semibold text-foreground">Settings</span> section of your dashboard.
                </p>
            </div>
        </div>
    );
}
