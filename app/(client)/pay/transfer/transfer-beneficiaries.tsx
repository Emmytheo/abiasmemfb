"use client";

import React, { useEffect, useState } from "react";
import { api, Beneficiary } from "@/lib/api";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Globe, Building, ArrowRight, Loader2, Star, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export function TransferBeneficiaries() {
    const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        async function fetchBens() {
            try {
                const supabase = createClient();
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    const data = await api.getUserBeneficiaries(user.id);
                    setBeneficiaries(data);
                }
            } catch (err) {
                console.error("Failed to load beneficiaries", err);
            } finally {
                setLoading(false);
            }
        }
        fetchBens();
    }, []);

    if (loading) {
        return (
            <div className="flex w-full items-center justify-center p-24 bg-accent/20 rounded-xl border border-dashed">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (beneficiaries.length === 0) {
        return (
            <div className="p-12 text-center flex flex-col items-center bg-accent/20 rounded-xl border border-dashed">
                <div className="h-16 w-16 bg-muted/50 rounded-full flex items-center justify-center mb-4">
                    <Star className="h-8 w-8 text-muted-foreground/50" />
                </div>
                <h3 className="text-lg font-bold mb-1">No saved beneficiaries</h3>
                <p className="text-muted-foreground text-sm max-w-sm">
                    When you make transfers to external banks, the details will automatically be saved here for quick access next time.
                </p>
            </div>
        );
    }

    const filteredBeneficiaries = beneficiaries.filter(b =>
        (b.account_name && b.account_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (b.bank_name && b.bank_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (b.account_number && b.account_number.includes(searchQuery))
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                <h3 className="text-lg font-medium flex items-center gap-2">
                    <Star className="h-5 w-5 text-amber-500" /> Quick Send Actions
                </h3>
                <div className="relative max-w-sm w-full">
                    <input
                        type="text"
                        placeholder="Search beneficiaries..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full h-10 px-4 py-2 rounded-full border border-input bg-background/50 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    />
                </div>
            </div>

            {filteredBeneficiaries.length === 0 ? (
                <div className="p-8 text-center bg-accent/20 rounded-xl border border-dashed">
                    <p className="text-muted-foreground">No beneficiaries found matching "{searchQuery}"</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {filteredBeneficiaries.map((b) => (
                        <Link
                            key={b.id}
                            href={`/pay/transfer?tab=${b.is_international ? 'international' : 'interbank'}&beneficiary=${b.id}`}
                            className="block group"
                        >
                            <Card className="border shadow-sm hover:border-primary/50 transition-all group-hover:shadow-md cursor-pointer h-full">
                                <CardContent className="p-4 flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
                                            {b.is_international ? (
                                                <Globe className="h-4 w-4 text-primary" />
                                            ) : (
                                                <Building className="h-4 w-4 text-primary" />
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2">
                                                <h4 className="font-semibold text-sm truncate">{b.account_name}</h4>
                                                {b.is_international && (
                                                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">INTL</Badge>
                                                )}
                                            </div>
                                            <p className="text-xs text-muted-foreground truncate">
                                                {b.bank_name} • {b.account_number}
                                            </p>
                                        </div>
                                    </div>
                                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
            )}

            <div className="bg-muted/30 p-4 rounded-lg flex items-center justify-between border">
                <div className="flex items-center gap-3">
                    <Clock className="text-muted-foreground h-5 w-5" />
                    <div>
                        <p className="text-sm font-medium">Manage all beneficiaries</p>
                        <p className="text-xs text-muted-foreground">View and delete saved transfer contacts.</p>
                    </div>
                </div>
                <Link href="/client-dashboard/beneficiaries" className="text-sm text-primary hover:underline font-medium">
                    View All
                </Link>
            </div>
        </div>
    );
}
