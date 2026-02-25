import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CreditCard, History } from "lucide-react";

export default function MyLoansPage() {
    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">My Loans</h1>
                    <p className="text-muted-foreground mt-1">Manage your active credit facilities and view history.</p>
                </div>
                <Button>
                    <CreditCard className="mr-2 h-4 w-4" />
                    Apply for a Loan
                </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card className="border shadow-sm">
                    <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                            <CardDescription>Personal Loan</CardDescription>
                            <span className="text-xs font-medium px-2 py-1 bg-emerald-500/10 text-emerald-500 rounded-full">Active</span>
                        </div>
                        <CardTitle className="text-2xl mt-2">₦500,000.00</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Interest Rate</span>
                                <span className="font-medium">20% P.A.</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Next Repayment</span>
                                <span className="font-medium">₦45,000.00</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Due Date</span>
                                <span className="font-medium">Oct 14, 2024</span>
                            </div>
                            <div className="pt-4 flex gap-3">
                                <Button className="flex-1">Pay Now</Button>
                                <Button variant="outline" size="icon"><History className="h-4 w-4" /></Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
