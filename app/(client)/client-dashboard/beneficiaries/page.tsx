"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, Beneficiary } from "@/lib/api";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, Users, Trash2, Globe, Building, Search, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import Link from "next/link";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

export default function BeneficiariesPage() {
    const router = useRouter();
    const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [userId, setUserId] = useState<string | null>(null);

    async function loadBeneficiaries() {
        try {
            const supabase = createClient();
            const { data: { user }, error } = await supabase.auth.getUser();
            if (error || !user) {
                router.push("/auth/login");
                return;
            }
            setUserId(user.id);
            const data = await api.getUserBeneficiaries(user.id);
            setBeneficiaries(data);
        } catch (err) {
            console.error(err);
            toast.error("Failed to load beneficiaries");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadBeneficiaries();
    }, [router]);

    const handleDelete = async (id: string) => {
        if (!userId) return;
        try {
            const success = await api.deleteBeneficiary(id, userId);
            if (success) {
                toast.success("Beneficiary removed successfully");
                setBeneficiaries(prev => prev.filter(b => b.id !== id));
            } else {
                toast.error("Failed to remove beneficiary");
            }
        } catch (err) {
            console.error(err);
            toast.error("An error occurred");
        }
    };

    const filteredBeneficiaries = beneficiaries.filter(b =>
        b.account_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.bank_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.account_number.includes(searchQuery)
    );

    if (loading) {
        return (
            <div className="flex w-full items-center justify-center p-24">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500 pb-24 px-4 sm:px-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Saved Beneficiaries</h1>
                    <p className="text-muted-foreground mt-1 text-sm sm:text-base">
                        Manage your frequently used transfer accounts.
                    </p>
                </div>
                <Button asChild className="shrink-0">
                    <Link href="/pay/transfer">
                        <Plus className="mr-2 h-4 w-4" /> Add New Transfer
                    </Link>
                </Button>
            </div>

            <Card className="border shadow-sm">
                <CardHeader className="border-b bg-muted/20 pb-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <Users className="h-5 w-5 text-primary" />
                                All Beneficiaries ({beneficiaries.length})
                            </CardTitle>
                        </div>
                        <div className="relative w-full sm:w-72">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by name, bank, or account..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {filteredBeneficiaries.length === 0 ? (
                        <div className="p-12 text-center flex flex-col items-center">
                            <div className="h-16 w-16 bg-muted/50 rounded-full flex items-center justify-center mb-4">
                                <Users className="h-8 w-8 text-muted-foreground/50" />
                            </div>
                            <h3 className="text-lg font-bold mb-1">No beneficiaries found</h3>
                            <p className="text-muted-foreground text-sm max-w-sm">
                                {searchQuery ? "Try adjusting your search query." : "You haven't saved any transfer contacts yet. They will be automatically saved when you make transfers."}
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y">
                            {filteredBeneficiaries.map((b) => (
                                <div key={b.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 sm:p-6 hover:bg-muted/10 transition-colors gap-4">
                                    <div className="flex items-center gap-4 w-full sm:w-auto overflow-hidden">
                                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
                                            {b.is_international ? (
                                                <Globe className="h-5 w-5 text-primary" />
                                            ) : (
                                                <Building className="h-5 w-5 text-primary" />
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h4 className="font-bold text-base truncate">{b.account_name}</h4>
                                                {b.is_international && (
                                                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">INTL</Badge>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <span className="font-mono">{b.account_number}</span>
                                                <span>•</span>
                                                <span className="truncate">{b.bank_name}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 self-end sm:self-auto shrink-0 w-full sm:w-auto justify-end">

                                        <Button variant="outline" size="sm" asChild className="hidden sm:flex">
                                            <Link href={`/pay/transfer?tab=${b.is_international ? 'international' : 'interbank'}&beneficiary=${b.id}`}>
                                                Send Money
                                            </Link>
                                        </Button>
                                        <Button variant="ghost" size="icon" asChild className="sm:hidden text-primary">
                                            <Link href={`/pay/transfer?tab=${b.is_international ? 'international' : 'interbank'}&beneficiary=${b.id}`}>
                                                <ArrowRight className="h-4 w-4" />
                                            </Link>
                                        </Button>

                                        <Dialog>
                                            <DialogTrigger asChild>
                                                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent>
                                                <DialogHeader>
                                                    <DialogTitle>Remove Beneficiary</DialogTitle>
                                                    <DialogDescription>
                                                        Are you sure you want to remove <strong>{b.account_name}</strong> from your saved beneficiaries?
                                                        This action cannot be undone.
                                                    </DialogDescription>
                                                </DialogHeader>
                                                <DialogFooter className="mt-4 gap-2 sm:gap-0">
                                                    <DialogTrigger asChild>
                                                        <Button variant="outline">Cancel</Button>
                                                    </DialogTrigger>
                                                    <DialogTrigger asChild>
                                                        <Button variant="destructive" onClick={() => handleDelete(b.id)}>
                                                            Remove
                                                        </Button>
                                                    </DialogTrigger>
                                                </DialogFooter>
                                            </DialogContent>
                                        </Dialog>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
