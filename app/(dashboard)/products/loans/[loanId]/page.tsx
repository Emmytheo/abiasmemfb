"use client";

import { use, useEffect, useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { Loan, Transaction } from "@/lib/api/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ArrowLeft, AlertTriangle, DollarSign, Calendar, TrendingDown, CheckCircle2, XCircle, Clock } from "lucide-react";
import { toast } from "sonner";
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";

const formatNaira = (n: number) => new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(n ?? 0);

// Amortization schedule generator
function computeAmortization(principal: number, annualRate: number, months: number, startDate: string) {
    const monthlyRate = annualRate / 100 / 12;
    const rows: { month: number; date: string; payment: number; principal: number; interest: number; balance: number }[] = [];
    let balance = principal;
    const start = new Date(startDate);

    for (let i = 1; i <= months; i++) {
        const interest = balance * monthlyRate;
        const payment = monthlyRate === 0 ? principal / months : (principal * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -months));
        const principalPart = payment - interest;
        balance = Math.max(0, balance - principalPart);

        const date = new Date(start);
        date.setMonth(date.getMonth() + i);

        rows.push({
            month: i,
            date: date.toLocaleDateString('en-NG', { month: 'short', year: 'numeric' }),
            payment: Math.round(payment * 100) / 100,
            principal: Math.round(principalPart * 100) / 100,
            interest: Math.round(interest * 100) / 100,
            balance: Math.round(balance * 100) / 100,
        });
    }
    return rows;
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    active: { label: 'Active', color: 'text-emerald-600 bg-emerald-500/10 border-emerald-500/30', icon: <CheckCircle2 className="h-4 w-4" /> },
    pending: { label: 'Pending', color: 'text-amber-600 bg-amber-500/10 border-amber-500/30', icon: <Clock className="h-4 w-4" /> },
    under_review: { label: 'Under Review', color: 'text-blue-600 bg-blue-500/10 border-blue-500/30', icon: <Clock className="h-4 w-4" /> },
    defaulted: { label: 'Defaulted', color: 'text-red-600 bg-red-500/10 border-red-500/30', icon: <XCircle className="h-4 w-4" /> },
    repaid: { label: 'Repaid', color: 'text-emerald-600 bg-emerald-500/10 border-emerald-500/30', icon: <CheckCircle2 className="h-4 w-4" /> },
    rejected: { label: 'Rejected', color: 'text-red-600 bg-red-500/10 border-red-500/30', icon: <XCircle className="h-4 w-4" /> },
};

function AdminLoanDetailContent({ params }: { params: Promise<{ loanId: string }> }) {
    const { loanId } = use(params);
    const router = useRouter();
    const [loan, setLoan] = useState<Loan | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'details' | 'schedule' | 'history'>('details');
    const [repayLoading, setRepayLoading] = useState(false);
    const [repayAmount, setRepayAmount] = useState('');
    const [repayNarration, setRepayNarration] = useState('');
    const [modifyOpen, setModifyOpen] = useState(false);
    const [modifyData, setModifyData] = useState({ interest_rate: '', next_payment_date: '', maturity_date: '' });

    useEffect(() => {
        async function load() {
            try {
                const [l, txs] = await Promise.all([
                    api.getLoanById(loanId),
                    api.getLoanTransactions(loanId),
                ]);
                setLoan(l);
                setTransactions(txs);
                if (l) setModifyData({
                    interest_rate: String(l.interest_rate),
                    next_payment_date: l.next_payment_date ? l.next_payment_date.slice(0, 10) : '',
                    maturity_date: l.maturity_date ? l.maturity_date.slice(0, 10) : '',
                });
            } finally { setLoading(false); }
        }
        load();
    }, [loanId]);

    const handleRepayment = async () => {
        const amount = parseFloat(repayAmount);
        if (isNaN(amount) || amount <= 0) return toast.error('Enter a valid amount');
        setRepayLoading(true);
        try {
            const ok = await api.recordLoanRepayment(loanId, amount, repayNarration || undefined);
            if (ok) {
                toast.success(`Repayment of ${formatNaira(amount)} recorded successfully.`);
                const updated = await api.getLoanById(loanId);
                setLoan(updated);
                setRepayAmount('');
                setRepayNarration('');
                const txs = await api.getLoanTransactions(loanId);
                setTransactions(txs);
            } else {
                toast.error('Failed to record repayment.');
            }
        } finally { setRepayLoading(false); }
    };

    const handleModify = async () => {
        if (!loan) return;
        const updated = await api.updateLoan(loanId, {
            interest_rate: parseFloat(modifyData.interest_rate) || loan.interest_rate,
            next_payment_date: modifyData.next_payment_date || loan.next_payment_date,
            maturity_date: modifyData.maturity_date || loan.maturity_date,
        });
        if (updated) { setLoan(updated); toast.success('Loan terms updated.'); setModifyOpen(false); }
        else toast.error('Update failed.');
    };

    const handleStatusChange = async (newStatus: Loan['status']) => {
        const updated = await api.updateLoan(loanId, { status: newStatus });
        if (updated) { setLoan(updated); toast.success(`Status changed to ${newStatus}.`); }
        else toast.error('Status update failed.');
    };

    if (loading) return <div className="flex justify-center p-24"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
    if (!loan) return (
        <div className="flex flex-col items-center justify-center p-24 text-center">
            <AlertTriangle className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <h2 className="text-2xl font-bold mb-2">Loan Not Found</h2>
            <Button asChild><Link href="/products/loans">Back to Loans</Link></Button>
        </div>
    );

    const statusInfo = statusConfig[loan.status] || statusConfig.pending;
    const progress = loan.amount > 0 ? Math.round(((loan.amount - (loan.outstanding_balance ?? loan.amount)) / loan.amount) * 100) : 0;
    const schedule = loan.duration_months > 0 && loan.amount > 0
        ? computeAmortization(loan.amount, loan.interest_rate, loan.duration_months, loan.created_at)
        : [];

    const tabs = [
        { key: 'details', label: 'Facility Details' },
        { key: 'schedule', label: 'Amortization' },
        { key: 'history', label: 'Repayment History' },
    ] as const;

    return (
        <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500 pb-24 px-3">
            {/* Header */}
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold">Loan Detail</h1>
                        <p className="text-muted-foreground font-mono text-sm">{String(loan.id).slice(0, 16).toUpperCase()}</p>
                    </div>
                </div>
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-wider border ${statusInfo.color}`}>
                    {statusInfo.icon} {statusInfo.label}
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Principal', value: formatNaira(loan.amount) },
                    { label: 'Outstanding', value: formatNaira(loan.outstanding_balance ?? loan.amount), highlight: true },
                    { label: 'Monthly Payment', value: formatNaira(loan.monthly_installment ?? 0) },
                    { label: 'Interest Rate', value: `${loan.interest_rate}% p.a.` },
                ].map(({ label, value, highlight }) => (
                    <Card key={label} className={`border shadow-sm ${highlight ? 'border-t-2 border-t-amber-500' : ''}`}>
                        <CardContent className="pt-4 px-3 md:px-6">
                            <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold mb-1">{label}</p>
                            <p className={`text-xl font-black ${highlight ? 'text-amber-600' : ''}`}>{value}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Progress */}
            <Card className="border shadow-sm">
                <CardContent className="pt-5">
                    <div className="flex justify-between text-sm mb-2">
                        <span className="font-medium">Repayment Progress</span>
                        <span className="font-bold text-emerald-600">{progress}%</span>
                    </div>
                    <div className="h-3 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-700" style={{ width: `${progress}%` }} />
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground mt-2">
                        <span>{loan.next_payment_date ? `Next: ${new Date(loan.next_payment_date).toLocaleDateString()}` : '—'}</span>
                        <span>{loan.maturity_date ? `Matures: ${new Date(loan.maturity_date).toLocaleDateString()}` : '—'}</span>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Tabs */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="flex gap-1 bg-muted/50 p-1 rounded-lg">
                        {tabs.map(t => (
                            <button
                                key={t.key}
                                onClick={() => setActiveTab(t.key)}
                                className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${activeTab === t.key ? 'bg-background shadow text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>

                    {activeTab === 'details' && (
                        <Card className="border shadow-sm">
                            <CardContent className="pt-5 grid grid-cols-2 gap-4 text-sm">
                                {[
                                    ['Duration', `${loan.duration_months} months`],
                                    ['Total Repayable', formatNaira((loan.monthly_installment ?? 0) * loan.duration_months)],
                                    ['Customer ID', typeof loan.customer === 'object' ? String((loan.customer as any)?.id) : String(loan.customer || '—')],
                                    ['Issued', new Date(loan.created_at).toLocaleDateString()],
                                ].map(([k, v]) => (
                                    <div key={k}><p className="text-muted-foreground text-xs mb-0.5">{k}</p><p className="font-semibold">{v}</p></div>
                                ))}
                            </CardContent>
                        </Card>
                    )}

                    {activeTab === 'schedule' && (
                        <Card className="border shadow-sm">
                            <CardHeader className="border-b py-3 bg-muted/20">
                                <CardTitle className="text-sm">Amortization Schedule</CardTitle>
                                <CardDescription className="text-xs">Month-by-month principal/interest breakdown</CardDescription>
                            </CardHeader>
                            <CardContent className="p-0 overflow-x-auto">
                                {schedule.length === 0 ? (
                                    <div className="p-10 text-center text-muted-foreground text-sm">Cannot compute schedule — missing loan parameters.</div>
                                ) : (
                                    <table className="w-full text-xs">
                                        <thead className="bg-muted/30 border-b">
                                            <tr className="text-left">
                                                {['#', 'Date', 'Payment', 'Principal', 'Interest', 'Balance'].map(h => (
                                                    <th key={h} className="px-3 py-2 font-bold text-muted-foreground uppercase tracking-wider">{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {schedule.map(row => (
                                                <tr key={row.month} className="hover:bg-muted/10">
                                                    <td className="px-3 py-2 font-mono">{row.month}</td>
                                                    <td className="px-3 py-2">{row.date}</td>
                                                    <td className="px-3 py-2 font-medium">{formatNaira(row.payment)}</td>
                                                    <td className="px-3 py-2 text-emerald-600">{formatNaira(row.principal)}</td>
                                                    <td className="px-3 py-2 text-amber-600">{formatNaira(row.interest)}</td>
                                                    <td className="px-3 py-2 font-mono">{formatNaira(row.balance)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {activeTab === 'history' && (
                        <Card className="border shadow-sm">
                            <CardContent className="p-0">
                                {transactions.length === 0 ? (
                                    <div className="p-10 text-center text-muted-foreground text-sm">No repayment transactions recorded.</div>
                                ) : (
                                    <div className="divide-y">
                                        {transactions.map(tx => (
                                            <div key={tx.id} className="flex items-center justify-between px-4 py-3 hover:bg-muted/10">
                                                <div>
                                                    <p className="text-sm font-medium capitalize">{tx.type}</p>
                                                    <p className="text-xs text-muted-foreground">{tx.narration || tx.reference}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-bold text-sm text-emerald-600">+{formatNaira(tx.amount)}</p>
                                                    <p className="text-xs text-muted-foreground">{new Date(tx.created_at).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Actions Sidebar */}
                <div className="space-y-4">
                    {/* Record Repayment */}
                    <Card className="border shadow-sm border-t-4 border-t-emerald-500">
                        <CardHeader className="pb-3"><CardTitle className="text-base">Record Repayment</CardTitle></CardHeader>
                        <CardContent className="space-y-3">
                            <div className="space-y-1.5">
                                <Label>Amount (₦)</Label>
                                <Input type="number" value={repayAmount} onChange={e => setRepayAmount(e.target.value)} placeholder={formatNaira(loan.monthly_installment ?? 0)} />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Narration (optional)</Label>
                                <Input value={repayNarration} onChange={e => setRepayNarration(e.target.value)} placeholder="Cash payment at branch" />
                            </div>
                            <Button className="w-full" disabled={repayLoading || !repayAmount} onClick={handleRepayment}>
                                {repayLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <DollarSign className="mr-2 h-4 w-4" />}
                                Record Payment
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Modify / Status */}
                    <Card className="border shadow-sm">
                        <CardHeader className="pb-3"><CardTitle className="text-base">Loan Actions</CardTitle></CardHeader>
                        <CardContent className="space-y-2">
                            <Dialog open={modifyOpen} onOpenChange={setModifyOpen}>
                                <DialogTrigger asChild>
                                    <Button variant="secondary" className="w-full justify-start gap-2">
                                        <Calendar className="h-4 w-4" /> Modify Terms
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader><DialogTitle>Modify Loan Terms</DialogTitle></DialogHeader>
                                    <div className="space-y-4 py-2">
                                        <div className="space-y-1.5"><Label>Interest Rate (%)</Label><Input type="number" value={modifyData.interest_rate} onChange={e => setModifyData(d => ({ ...d, interest_rate: e.target.value }))} /></div>
                                        <div className="space-y-1.5"><Label>Next Payment Date</Label><Input type="date" value={modifyData.next_payment_date} onChange={e => setModifyData(d => ({ ...d, next_payment_date: e.target.value }))} /></div>
                                        <div className="space-y-1.5"><Label>Maturity Date</Label><Input type="date" value={modifyData.maturity_date} onChange={e => setModifyData(d => ({ ...d, maturity_date: e.target.value }))} /></div>
                                    </div>
                                    <DialogFooter>
                                        <Button onClick={handleModify}>Save Changes</Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>

                            {loan.status !== 'defaulted' && (
                                <Button variant="outline" className="w-full justify-start gap-2 text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => handleStatusChange('defaulted')}>
                                    <TrendingDown className="h-4 w-4" /> Mark as Defaulted
                                </Button>
                            )}
                            {loan.status === 'defaulted' && (
                                <Button variant="outline" className="w-full justify-start gap-2 text-blue-600 hover:bg-blue-500/10 hover:text-blue-700" onClick={() => handleStatusChange('active')}>
                                    <CheckCircle2 className="h-4 w-4" /> Mark as Restructured
                                </Button>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

export default function AdminLoanDetailPage({ params }: { params: Promise<{ loanId: string }> }) {
    return (
        <Suspense fallback={<div className="flex justify-center p-24"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>}>
            <AdminLoanDetailContent params={params} />
        </Suspense>
    );
}
