"use client";

import React, { useState } from "react";
import { 
    Store, 
    Wallet, 
    TrendingUp, 
    ArrowDownRight, 
    ArrowUpRight,
    Users,
    Search,
    Filter,
    Activity,
    CreditCard
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useScope } from "@/context/scope-context";

const RECENT_TRANSACTIONS = [
    { id: 'TRX-9901', type: 'Cash Withdrawal', customer: '0912***432', amount: 15000, commission: 150, time: '10:42 AM', status: 'Success' },
    { id: 'TRX-9902', type: 'Cash Deposit', customer: '0803***991', amount: 50000, commission: 250, time: '11:15 AM', status: 'Success' },
    { id: 'TRX-9903', type: 'Utility Bill (AEDC)', customer: 'Walk-in', amount: 5000, commission: 100, time: '12:05 PM', status: 'Success' },
    { id: 'TRX-9904', type: 'Cash Withdrawal', customer: '0705***112', amount: 10000, commission: 100, time: '01:22 PM', status: 'Failed' },
];

export default function AgentDashboardPage() {
    const { activeScopeId, activeScope } = useScope();
    const [search, setSearch] = useState("");

    // Simulate agent scope lock - in a real app, you might use a dedicated 'agent' scope 
    // or check user metadata if they are an approved agent.
    if (activeScope.type !== 'business' && activeScope.type !== 'personal') {
        // Just allowing rendering for now, but usually we'd strictly lock this
    }

    return (
        <div className="p-4 md:p-10 space-y-8 max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <p className="text-xs font-bold uppercase tracking-widest text-primary/70">Agency Network</p>
                        <Badge variant="outline" className="uppercase text-[10px] tracking-widest bg-primary/5">Agent ID: AG-4009</Badge>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black tracking-tight mt-1">Agent Portal</h1>
                    <p className="text-muted-foreground mt-2 max-w-xl">
                        Process Over-the-Counter (OTC) requests, track your daily float, and monitor commissions.
                    </p>
                </div>

                <div className="flex gap-3">
                    <Button className="h-11 font-black bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg">
                        <ArrowDownRight className="mr-2 h-4 w-4" /> Receive Cash (Deposit)
                    </Button>
                    <Button className="h-11 font-black shadow-lg">
                        <ArrowUpRight className="mr-2 h-4 w-4" /> Give Cash (Withdrawal)
                    </Button>
                </div>
            </header>

            {/* Top Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="shadow-lg shadow-primary/5 border-primary/10">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                <Wallet className="h-5 w-5" />
                            </div>
                            <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-200">Active Float</Badge>
                        </div>
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Available E-Value</p>
                        <h2 className="text-3xl font-black">₦450,200.00</h2>
                    </CardContent>
                </Card>
                
                <Card className="shadow-lg shadow-emerald-500/5 border-emerald-500/10 bg-emerald-500/5">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="size-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-600">
                                <TrendingUp className="h-5 w-5" />
                            </div>
                            <Badge variant="outline" className="bg-white/50 border-emerald-200 text-emerald-700">Today</Badge>
                        </div>
                        <p className="text-xs font-bold text-emerald-800/70 uppercase tracking-widest mb-1">Earned Commissions</p>
                        <h2 className="text-3xl font-black text-emerald-700">₦1,250.00</h2>
                    </CardContent>
                </Card>

                <Card className="shadow-lg shadow-primary/5 border-primary/10">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                <Activity className="h-5 w-5" />
                            </div>
                            <span className="text-xs font-bold text-emerald-500">+12% vs Yesterday</span>
                        </div>
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Transaction Volume</p>
                        <h2 className="text-3xl font-black">₦80,000.00</h2>
                    </CardContent>
                </Card>

                <Card className="shadow-lg shadow-primary/5 border-primary/10">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                <Users className="h-5 w-5" />
                            </div>
                        </div>
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Customers Served</p>
                        <h2 className="text-3xl font-black">24</h2>
                    </CardContent>
                </Card>
            </div>

            {/* Quick Actions & Recent */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left: Quick Actions */}
                <div className="space-y-6">
                    <Card className="shadow-lg shadow-primary/5">
                        <CardHeader>
                            <CardTitle className="text-lg">Agency Services</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <Button variant="outline" className="w-full h-14 justify-start font-bold">
                                <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center text-primary mr-3">
                                    <CreditCard className="h-4 w-4" />
                                </div>
                                Card Withdrawal (POS)
                            </Button>
                            <Button variant="outline" className="w-full h-14 justify-start font-bold">
                                <div className="size-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600 mr-3">
                                    <ArrowDownRight className="h-4 w-4" />
                                </div>
                                Cash Deposit to Account
                            </Button>
                            <Button variant="outline" className="w-full h-14 justify-start font-bold">
                                <div className="size-8 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-600 mr-3">
                                    <ArrowUpRight className="h-4 w-4" />
                                </div>
                                Cardless Withdrawal
                            </Button>
                            <Button variant="outline" className="w-full h-14 justify-start font-bold">
                                <div className="size-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-600 mr-3">
                                    <Store className="h-4 w-4" />
                                </div>
                                Pay Utility Bills
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                {/* Right: Transactions Log */}
                <Card className="lg:col-span-2 shadow-xl shadow-primary/5 border-primary/10">
                    <CardHeader className="bg-muted/30 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <CardTitle className="text-lg">Today's Transactions</CardTitle>
                            <CardDescription>Real-time log of OTC activities.</CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="relative max-w-xs w-full">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input 
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search Ref..." 
                                    className="pl-9 h-10 bg-background"
                                />
                            </div>
                            <Button variant="outline" size="icon" className="h-10 w-10 shrink-0">
                                <Filter className="h-4 w-4" />
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b">
                                    <tr>
                                        <th className="px-6 py-4 font-black tracking-wider">Ref & Type</th>
                                        <th className="px-6 py-4 font-black tracking-wider">Customer</th>
                                        <th className="px-6 py-4 font-black tracking-wider text-right">Amount</th>
                                        <th className="px-6 py-4 font-black tracking-wider text-right">Earned</th>
                                        <th className="px-6 py-4 font-black tracking-wider text-right">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {RECENT_TRANSACTIONS.map((tx) => (
                                        <tr key={tx.id} className="hover:bg-muted/20 transition-colors">
                                            <td className="px-6 py-4">
                                                <p className="font-bold text-foreground">{tx.type}</p>
                                                <p className="text-xs text-muted-foreground">{tx.id} • {tx.time}</p>
                                            </td>
                                            <td className="px-6 py-4 font-medium">{tx.customer}</td>
                                            <td className="px-6 py-4 text-right font-black">
                                                ₦{tx.amount.toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 text-right font-bold text-emerald-600">
                                                +₦{tx.commission}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {tx.status === 'Success' ? (
                                                    <Badge className="bg-emerald-500/10 text-emerald-600 border-0 hover:bg-emerald-500/20">Success</Badge>
                                                ) : (
                                                    <Badge variant="outline" className="text-rose-600 border-rose-200 bg-rose-50">Failed</Badge>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
