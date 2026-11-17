"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { CheckCircle2, XCircle, Clock, Loader2, Share2, Printer, ArrowLeft, Copy, BadgeCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useBankProfile } from "@/context/bank-profile-context";

interface ReceiptPageProps {
    params: Promise<{ executionId: string }>;
}

interface ExecutionData {
    id: string;
    status: "PENDING" | "RUNNING" | "COMPLETED" | "FAILED";
    createdAt?: string;
    completedAt?: string;
    phases?: Array<{
        name: string;
        status: string;
        outputs?: Record<string, any>;
        creditedAmount?: number;
        debitedAmount?: number;
        reference?: string;
    }>;
    outputs?: Record<string, any>;
}

function Confetti() {
    return (
        <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden" aria-hidden>
            {[...Array(48)].map((_, i) => {
                const colors = ["#22c55e", "#3b82f6", "#f59e0b", "#ec4899", "#8b5cf6", "#06b6d4"];
                const color = colors[i % colors.length];
                const left = `${(i * 2.1) % 100}%`;
                const delay = `${(i * 0.07).toFixed(2)}s`;
                const dur = `${1.2 + (i % 5) * 0.2}s`;
                const size = 6 + (i % 5) * 2;
                return (
                    <div
                        key={i}
                        style={{
                            position: "absolute",
                            left,
                            top: "-20px",
                            width: size,
                            height: size,
                            background: color,
                            borderRadius: i % 3 === 0 ? "50%" : "2px",
                            animation: `confettiFall ${dur} ${delay} ease-in forwards`,
                        }}
                    />
                );
            })}
            <style>{`
                @keyframes confettiFall {
                    0% { transform: translateY(0) rotate(0deg); opacity: 1; }
                    80% { opacity: 1; }
                    100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
                }
            `}</style>
        </div>
    );
}

export default function ReceiptPage({ params }: ReceiptPageProps) {
    const { executionId } = use(params);
    const [execution, setExecution] = useState<ExecutionData | null>(null);
    const [loading, setLoading] = useState(true);
    const [showConfetti, setShowConfetti] = useState(false);

    useEffect(() => {
        let attempts = 0;
        let interval: NodeJS.Timeout;

        async function poll() {
            try {
                const res = await fetch(`/api/workflows/executions/${executionId}`);
                const data = await res.json();
                if (data.success && data.execution) {
                    setExecution(data.execution);
                    if (data.execution.status === "COMPLETED" || data.execution.status === "FAILED") {
                        clearInterval(interval);
                        setLoading(false);
                        if (data.execution.status === "COMPLETED") {
                            setShowConfetti(true);
                            setTimeout(() => setShowConfetti(false), 4000);
                        }
                        return;
                    }
                }
            } catch (e) {
                // silent
            }
            attempts++;
            if (attempts >= 30) {
                clearInterval(interval);
                setLoading(false);
            }
        }

        poll();
        interval = setInterval(poll, 2000);
        return () => clearInterval(interval);
    }, [executionId]);

    const lastPhase = execution?.phases?.[execution.phases.length - 1];
    const outputs = lastPhase?.outputs || execution?.outputs || {};
    const reference = lastPhase?.reference || outputs?.TransactionReference || outputs?.reference || `TXN-${executionId.slice(0, 8).toUpperCase()}`;
    const amount = lastPhase?.debitedAmount || outputs?.Amount || outputs?.amount;
    const isCompleted = execution?.status === "COMPLETED";
    const isFailed = execution?.status === "FAILED";
    const isPending = !execution || execution.status === "PENDING" || execution.status === "RUNNING";

    const { activeProfile } = useBankProfile();

    const handleShare = async () => {
        const text = `✅ Transaction Confirmed\nReference: ${reference}\nAmount: ${amount ? `₦${Number(amount).toLocaleString()}` : "N/A"}\nDate: ${execution?.completedAt ? new Date(execution.completedAt).toLocaleString() : new Date().toLocaleString()}\n\nPowered by ${activeProfile.shortName}`;
        try {
            await navigator.clipboard.writeText(text);
            toast.success("Receipt copied to clipboard!");
        } catch {
            toast.error("Could not copy to clipboard.");
        }
    };

    const handlePrint = () => window.print();

    return (
        <>
            {showConfetti && <Confetti />}
            <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 print:p-0">
                <div className="w-full max-w-lg">
                    {/* Back nav — hidden on print */}
                    <div className="print:hidden mb-6">
                        <Button variant="ghost" size="sm" asChild>
                            <Link href="/client-dashboard">
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back to Dashboard
                            </Link>
                        </Button>
                    </div>

                    {/* Receipt Card */}
                    <div className="relative bg-card rounded-3xl border shadow-2xl overflow-hidden print:shadow-none print:border-none print:rounded-none">
                        {/* Top accent bar */}
                        <div className={`h-1.5 w-full ${isCompleted ? 'bg-emerald-500' : isFailed ? 'bg-destructive' : 'bg-primary animate-pulse'}`} />

                        <div className="p-8">
                            {/* Bank branding */}
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground font-bold">{activeProfile.legalName}</p>
                                    <p className="text-xs text-muted-foreground">Licensed by CBN</p>
                                </div>
                                <BadgeCheck className="h-8 w-8 text-primary" />
                            </div>

                            {/* Status hero */}
                            <div className="flex flex-col items-center text-center mb-8">
                                {isPending ? (
                                    <>
                                        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                                            <Loader2 className="h-10 w-10 text-primary animate-spin" />
                                        </div>
                                        <h1 className="text-2xl font-bold">Processing...</h1>
                                        <p className="text-sm text-muted-foreground mt-1">Your transaction is being processed. Please wait.</p>
                                    </>
                                ) : isCompleted ? (
                                    <>
                                        <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4 animate-in zoom-in duration-500">
                                            <CheckCircle2 className="h-10 w-10 text-emerald-500" />
                                        </div>
                                        <h1 className="text-2xl font-bold text-emerald-600">Payment Successful</h1>
                                        <p className="text-sm text-muted-foreground mt-1">Your transaction has been completed.</p>
                                    </>
                                ) : (
                                    <>
                                        <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mb-4 animate-in zoom-in duration-500">
                                            <XCircle className="h-10 w-10 text-destructive" />
                                        </div>
                                        <h1 className="text-2xl font-bold text-destructive">Transaction Failed</h1>
                                        <p className="text-sm text-muted-foreground mt-1">Please try again or contact support.</p>
                                    </>
                                )}

                                {/* Amount display */}
                                {amount && (
                                    <div className="mt-6">
                                        <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold mb-1">Amount</p>
                                        <p className="text-4xl font-black tracking-tight">₦{Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                                    </div>
                                )}
                            </div>

                            {/* Divider with scissors icon (receipt style) */}
                            <div className="relative flex items-center gap-3 my-6">
                                <div className="flex-1 border-t-2 border-dashed border-border" />
                                <div className="text-muted-foreground/30 text-lg select-none">✂</div>
                                <div className="flex-1 border-t-2 border-dashed border-border" />
                            </div>

                            {/* Transaction details */}
                            <div className="space-y-3">
                                <DetailRow label="Reference" value={reference} mono />
                                <DetailRow label="Execution ID" value={executionId.slice(0, 16) + "..."} mono />
                                {execution?.createdAt && (
                                    <DetailRow label="Initiated" value={new Date(execution.createdAt).toLocaleString()} />
                                )}
                                {execution?.completedAt && (
                                    <DetailRow label="Completed" value={new Date(execution.completedAt).toLocaleString()} />
                                )}
                                <DetailRow
                                    label="Status"
                                    value={
                                        <Badge className={
                                            isCompleted ? "bg-emerald-500/10 text-emerald-600 border-emerald-200" :
                                            isFailed ? "bg-destructive/10 text-destructive border-destructive/20" :
                                            "bg-primary/10 text-primary border-primary/20"
                                        }>
                                            {execution?.status || "PENDING"}
                                        </Badge>
                                    }
                                />

                                {/* Additional output fields */}
                                {Object.entries(outputs)
                                    .filter(([k]) => !['TransactionReference', 'reference', 'Amount', 'amount'].includes(k))
                                    .slice(0, 4)
                                    .map(([k, v]) => (
                                        <DetailRow key={k} label={k.replace(/_/g, ' ')} value={String(v)} />
                                    ))
                                }
                            </div>

                            {/* Workflow phases */}
                            {execution?.phases && execution.phases.length > 0 && (
                                <div className="mt-6 pt-6 border-t">
                                    <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-3">Processing Steps</p>
                                    <div className="space-y-2">
                                        {execution.phases.map((phase, i) => (
                                            <div key={i} className="flex items-center gap-3 text-sm">
                                                <div className={`size-2 rounded-full shrink-0 ${phase.status === 'COMPLETED' ? 'bg-emerald-500' : phase.status === 'FAILED' ? 'bg-destructive' : 'bg-muted-foreground/30'}`} />
                                                <span className="font-medium capitalize">{phase.name?.replace(/_/g, ' ') || `Step ${i + 1}`}</span>
                                                <span className={`ml-auto text-[10px] font-bold uppercase ${phase.status === 'COMPLETED' ? 'text-emerald-500' : phase.status === 'FAILED' ? 'text-destructive' : 'text-muted-foreground'}`}>
                                                    {phase.status}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Actions footer */}
                        <div className="border-t p-6 flex flex-col sm:flex-row gap-3 print:hidden">
                            {isCompleted && (
                                <>
                                    <Button onClick={handleShare} variant="outline" className="flex-1 gap-2">
                                        <Share2 className="h-4 w-4" /> Share Receipt
                                    </Button>
                                    <Button onClick={handlePrint} variant="outline" className="flex-1 gap-2">
                                        <Printer className="h-4 w-4" /> Print
                                    </Button>
                                </>
                            )}
                            <Button asChild className="flex-1">
                                <Link href="/client-dashboard">
                                    {isCompleted ? "Done" : isFailed ? "Return to Dashboard" : "Back to Dashboard"}
                                </Link>
                            </Button>
                        </div>
                    </div>

                    {/* Footer note */}
                    <p className="text-center text-xs text-muted-foreground mt-6 print:hidden">
                        Licensed by the Central Bank of Nigeria · NDIC insured
                    </p>
                </div>
            </div>

            {/* Print CSS */}
            <style>{`
                @media print {
                    body { background: white !important; }
                    .print\\:hidden { display: none !important; }
                }
            `}</style>
        </>
    );
}

function DetailRow({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
    return (
        <div className="flex items-start justify-between gap-4 py-1.5 border-b border-border/50 last:border-0">
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide shrink-0">{label}</span>
            <span className={`text-xs font-semibold text-right truncate max-w-[60%] ${mono ? 'font-mono' : ''}`}>
                {value}
            </span>
        </div>
    );
}
