"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Clock, XCircle, AlertCircle, Loader2, ArrowRight } from "lucide-react";
import { api } from "@/lib/api";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

interface ExecutionTrackerProps {
    executionId: string;
}

export function ExecutionTracker({ executionId }: ExecutionTrackerProps) {
    const [execution, setExecution] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Polling logic
    useEffect(() => {
        let isMounted = true;
        let pollInterval: NodeJS.Timeout;

        const checkStatus = async () => {
            try {
                const data = await api.getWorkflowExecutionById(executionId);
                if (isMounted) {
                    setExecution(data);
                    setLoading(false);

                    // Stop polling if we reached a terminal state
                    if (data?.status === 'COMPLETED' || data?.status === 'FAILED' || data?.status === 'CANCELLED') {
                        clearInterval(pollInterval);
                    }
                }
            } catch (err: any) {
                if (isMounted) {
                    setError(err.message || "Failed to fetch execution status.");
                    setLoading(false);
                }
            }
        };

        // Initial fetch
        checkStatus();

        // Start polling every 2 seconds
        pollInterval = setInterval(checkStatus, 2000);

        return () => {
            isMounted = false;
            clearInterval(pollInterval);
        };
    }, [executionId]);

    const getStatusConfig = (status: string) => {
        switch (status) {
            case 'COMPLETED':
                return { icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-50', border: 'border-green-200', text: 'Transaction Successful' };
            case 'FAILED':
                return { icon: XCircle, color: 'text-red-500', bg: 'bg-red-50', border: 'border-red-200', text: 'Transaction Failed' };
            case 'RUNNING':
                return { icon: Loader2, color: 'text-blue-500 animate-spin', bg: 'bg-blue-50', border: 'border-blue-200', text: 'Processing...' };
            case 'PENDING':
                return { icon: Clock, color: 'text-orange-500', bg: 'bg-orange-50', border: 'border-orange-200', text: 'Awaiting Execution' };
            default:
                return { icon: AlertCircle, color: 'text-muted-foreground', bg: 'bg-muted', border: 'border-border', text: status };
        }
    };

    if (loading) {
        return (
            <Card className="max-w-md mx-auto mt-8 border shadow-sm">
                <CardContent className="p-12 flex flex-col items-center justify-center text-center space-y-4">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    <p className="text-muted-foreground animate-pulse text-sm">Locating transaction record...</p>
                </CardContent>
            </Card>
        );
    }

    if (error || !execution) {
        return (
            <Card className="max-w-md mx-auto mt-8 border shadow-sm border-destructive">
                <CardContent className="p-8 flex flex-col items-center justify-center text-center space-y-4">
                    <AlertCircle className="h-10 w-10 text-destructive mb-2" />
                    <h3 className="font-semibold text-lg text-destructive">Record Not Found</h3>
                    <p className="text-muted-foreground text-sm">We could not locate execution record #{executionId}. It may have been archived or removed.</p>
                    <Button asChild variant="outline" className="mt-4">
                        <Link href="/explore">Return Home</Link>
                    </Button>
                </CardContent>
            </Card>
        );
    }

    const config = getStatusConfig(execution.status);
    const StatusIcon = config.icon;

    // Attempt to extract the final workflow output from the last phase if COMPLETED
    let finalOutputObj = null;
    if (execution.status === 'COMPLETED' && Array.isArray(execution.phases) && execution.phases.length > 0) {
        const lastPhase = execution.phases[execution.phases.length - 1];
        if (lastPhase?.outputs) finalOutputObj = lastPhase.outputs;
    }

    return (
        <Card className={`max-w-xl mx-auto mt-8 border-2 shadow-sm ${config.border}`}>
            <CardHeader className={`${config.bg} border-b ${config.border} pb-6 pt-8 items-center text-center space-y-4 rounded-t-lg justify-center flex flex-col`}>
                <div className={`p-4 flex w-fit items-center justify-center rounded-full bg-background shadow-sm ${config.color}`}>
                    <StatusIcon className="h-8 w-8" />
                </div>
                <div>
                    <CardTitle className="text-xl mb-1">{config.text}</CardTitle>
                    <CardDescription className="text-sm">
                        Reference: <span className="font-mono text-foreground font-medium">{execution.id}</span>
                    </CardDescription>
                </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">

                {/* Context Details */}
                {execution.inputData && (
                    <div className="space-y-3">
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4 border-b pb-2">Transaction Details</h4>

                        {execution.inputData._serviceName && (
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground">Service</span>
                                <span className="font-medium">{execution.inputData._serviceName}</span>
                            </div>
                        )}

                        {execution.inputData.amount && (
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground">Principal</span>
                                <span className="font-medium text-lg">₦{Number(execution.inputData.amount).toLocaleString()}</span>
                            </div>
                        )}

                        {execution.inputData._feeValue !== undefined && execution.inputData._feeType !== 'none' && (
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground">Fee</span>
                                <span className="font-medium">
                                    {execution.inputData._feeType === 'flat'
                                        ? `₦${Number(execution.inputData._feeValue).toFixed(2)}`
                                        : `${execution.inputData._feeValue}%`}
                                </span>
                            </div>
                        )}

                        {/* Render dynamic inputs */}
                        {Object.entries(execution.inputData).map(([key, val]) => {
                            if (key.startsWith('_') || key === 'amount') return null; // Skip internal keys and amount
                            return (
                                <div key={key} className="flex justify-between items-center text-sm">
                                    <span className="text-muted-foreground capitalize">{key.replace(/_/g, ' ')}</span>
                                    <span className="font-mono">{String(val)}</span>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Workflow Logs / Final Output section */}
                {finalOutputObj && (
                    <div className="bg-muted/50 rounded-lg p-4 border mt-6">
                        <h4 className="text-xs font-semibold text-muted-foreground mb-2 flex items-center justify-between">
                            Provider Response
                            <Badge variant="outline" className="bg-background">Processed</Badge>
                        </h4>
                        <pre className="text-xs font-mono w-full overflow-x-auto text-foreground">
                            {JSON.stringify(finalOutputObj, null, 2)}
                        </pre>
                    </div>
                )}

                {/* Show short error snippet if failed */}
                {execution.status === 'FAILED' && Array.isArray(execution.phases) && (
                    <div className="bg-red-50 text-red-900 rounded-lg p-4 border border-red-200 mt-6 text-sm">
                        <h4 className="font-semibold mb-1 flex items-center gap-2"><XCircle className="h-4 w-4" /> Execution Halted</h4>
                        <p className="opacity-80">The integration pipeline reported an error processing this request.</p>
                    </div>
                )}

            </CardContent>

            {/* Action Footer */}
            {(execution.status === 'COMPLETED' || execution.status === 'FAILED') && (
                <CardFooter className="bg-muted/30 border-t p-4 flex flex-col gap-2 sm:flex-row justify-between">
                    {execution.status === 'COMPLETED' ? (
                        <Button variant="outline" className="w-full sm:w-auto" onClick={() => window.print()}>
                            Download Receipt
                        </Button>
                    ) : (
                        <Button variant="outline" className="w-full sm:w-auto text-destructive border-destructive/30 hover:bg-destructive/10">
                            Report Issue
                        </Button>
                    )}
                    <Button asChild className="w-full sm:w-auto gap-2">
                        <Link href="/explore">
                            Done <ArrowRight className="h-4 w-4" />
                        </Link>
                    </Button>
                </CardFooter>
            )}
        </Card>
    );
}
