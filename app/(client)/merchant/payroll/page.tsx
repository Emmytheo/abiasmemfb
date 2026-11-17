"use client";

import React, { useState } from "react";
import { 
    Briefcase, 
    Upload, 
    FileSpreadsheet, 
    Play, 
    CheckCircle2, 
    AlertCircle,
    Loader2,
    Download
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useScope } from "@/context/scope-context";
import { useBankProfile } from "@/context/bank-profile-context";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

// Dummy payroll data representing what would be parsed from a CSV
const BASE_PAYROLL = [
    { id: 1, name: "Anita Okoro", account: "0123456789", bank: "GTBank", amount: 250000, status: "pending" },
    { id: 2, name: "Michael Chen", account: "9876543210", bank: "Access Bank", amount: 180000, status: "pending" },
    { id: 3, name: "Sarah Johnson", account: "0001112223", bank: "Partner MFB", amount: 300000, status: "pending" },
];

export default function MerchantPayrollPage() {
    const { activeScopeId, activeScope } = useScope();
    const { activeProfile } = useBankProfile();
    const DUMMY_PAYROLL = React.useMemo(
        () => BASE_PAYROLL.map((row, i) => (i === 2 ? { ...row, bank: activeProfile.shortName } : row)),
        [activeProfile.shortName]
    );
    const [isUploading, setIsUploading] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [payrollData, setPayrollData] = useState<typeof DUMMY_PAYROLL | null>(null);

    const handleUploadClick = () => {
        setIsUploading(true);
        // Simulate CSV parsing delay
        setTimeout(() => {
            setPayrollData(DUMMY_PAYROLL);
            setIsUploading(false);
            toast.success("Payroll CSV processed successfully");
        }, 1500);
    };

    const handleRunPayroll = () => {
        setIsProcessing(true);
        // Simulate API call to process bulk transfers
        setTimeout(() => {
            setPayrollData(DUMMY_PAYROLL.map(p => ({ ...p, status: 'success' })));
            setIsProcessing(false);
            toast.success("Payroll distribution completed");
        }, 3000);
    };

    if (activeScope.type !== 'business') {
        return (
            <div className="max-w-md mx-auto my-12 text-center p-8 bg-card border rounded-3xl shadow-xl space-y-6 animate-in fade-in zoom-in duration-500">
                <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mx-auto">
                    <Briefcase className="h-8 w-8" />
                </div>
                <div className="space-y-2">
                    <h2 className="text-2xl font-black">Business Scope Required</h2>
                    <p className="text-xs text-muted-foreground font-semibold leading-relaxed">
                        Bulk Payroll and HR operations are exclusive to corporate profiles.
                    </p>
                </div>
            </div>
        );
    }

    const totalAmount = payrollData ? payrollData.reduce((acc, curr) => acc + curr.amount, 0) : 0;
    const isCompleted = payrollData?.every(p => p.status === 'success');

    return (
        <div className="p-4 md:p-10 space-y-8 max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <p className="text-xs font-bold uppercase tracking-widest text-primary/70">Human Resources</p>
                        <Badge variant="outline" className="uppercase text-[10px] tracking-widest bg-primary/5">Corporate</Badge>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black tracking-tight mt-1">Bulk Payroll</h1>
                    <p className="text-muted-foreground mt-2 max-w-xl">
                        Upload your employee salary sheet and execute instant bulk disbursements.
                    </p>
                </div>

                <Button variant="outline" className="h-11 font-black">
                    <Download className="mr-2 h-4 w-4" /> Download CSV Template
                </Button>
            </header>

            {!payrollData ? (
                <Card className="border-dashed border-2 border-primary/20 bg-primary/5 shadow-none">
                    <CardContent className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                        <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-2">
                            <FileSpreadsheet className="size-8" />
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-xl font-bold">Upload Salary Schedule</h3>
                            <p className="text-sm text-muted-foreground max-w-sm">
                                Drag and drop your completed CSV template here, or click to browse files.
                            </p>
                        </div>
                        <Button onClick={handleUploadClick} disabled={isUploading} className="h-12 px-8 font-black mt-4 shadow-lg shadow-primary/20">
                            {isUploading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analyzing Sheet...
                                </>
                            ) : (
                                <>
                                    <Upload className="mr-2 h-4 w-4" /> Select CSV File
                                </>
                            )}
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Card className="shadow-lg shadow-primary/5">
                            <CardContent className="p-6">
                                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">Total Employees</p>
                                <p className="text-3xl font-black">{payrollData.length}</p>
                            </CardContent>
                        </Card>
                        <Card className="shadow-lg shadow-primary/5 border-primary/10 bg-primary/5">
                            <CardContent className="p-6">
                                <p className="text-xs font-bold text-primary uppercase tracking-widest mb-2">Total Disbursement</p>
                                <p className="text-3xl font-black text-primary">₦{totalAmount.toLocaleString()}</p>
                            </CardContent>
                        </Card>
                        <Card className="shadow-lg shadow-primary/5">
                            <CardContent className="p-6 flex flex-col justify-center h-full">
                                <Button 
                                    onClick={handleRunPayroll} 
                                    disabled={isProcessing || isCompleted}
                                    className={`w-full h-12 font-black text-lg ${isCompleted ? 'bg-emerald-500 hover:bg-emerald-500' : ''}`}
                                >
                                    {isProcessing ? (
                                        <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Processing Transfer...</>
                                    ) : isCompleted ? (
                                        <><CheckCircle2 className="mr-2 h-5 w-5" /> Distribution Complete</>
                                    ) : (
                                        <><Play className="mr-2 h-5 w-5" /> Execute Payroll</>
                                    )}
                                </Button>
                            </CardContent>
                        </Card>
                    </div>

                    <Card className="shadow-xl shadow-primary/5">
                        <CardHeader className="bg-muted/30 border-b">
                            <CardTitle className="text-lg">Parsed Schedule</CardTitle>
                            <CardDescription>Review the recipients before executing the transaction.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b">
                                        <tr>
                                            <th className="px-6 py-4 font-black tracking-wider">Employee Name</th>
                                            <th className="px-6 py-4 font-black tracking-wider">Bank Details</th>
                                            <th className="px-6 py-4 font-black tracking-wider text-right">Amount</th>
                                            <th className="px-6 py-4 font-black tracking-wider text-right">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {payrollData.map((row) => (
                                            <tr key={row.id} className="hover:bg-muted/20 transition-colors">
                                                <td className="px-6 py-4 font-bold">{row.name}</td>
                                                <td className="px-6 py-4">
                                                    <p className="font-medium text-foreground">{row.account}</p>
                                                    <p className="text-xs text-muted-foreground">{row.bank}</p>
                                                </td>
                                                <td className="px-6 py-4 text-right font-black">
                                                    ₦{row.amount.toLocaleString()}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    {row.status === 'success' ? (
                                                        <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-0">Paid</Badge>
                                                    ) : (
                                                        <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50">Pending</Badge>
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
            )}
        </div>
    );
}
