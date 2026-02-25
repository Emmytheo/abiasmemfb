import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PiggyBank, Landmark, CheckCircle2 } from "lucide-react";

export default function ExploreAccountsPage() {
    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Open an Account</h1>
                <p className="text-muted-foreground mt-1">Discover high-yield savings and flexible business accounts.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mt-8">
                {/* Premium Corporate */}
                <Card className="border shadow-lg flex flex-col relative overflow-hidden">
                    <div className="absolute top-0 right-0 bg-primary/20 text-primary text-xs font-bold px-3 py-1 rounded-bl-lg">
                        Recommended
                    </div>
                    <CardHeader className="pt-8">
                        <div className="p-3 w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                            <Landmark className="h-7 w-7 text-primary" />
                        </div>
                        <CardTitle className="text-xl">Premium Corporate</CardTitle>
                        <CardDescription>Scale your enterprise with zero maintenance fees.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 space-y-4">
                        <div className="flex justify-between items-center text-sm p-3 bg-muted/50 rounded-lg">
                            <span className="text-muted-foreground">Interest Range</span>
                            <span className="font-bold text-primary">Up to 5% P.A.</span>
                        </div>
                        <div className="flex justify-between items-center text-sm p-3 bg-muted/50 rounded-lg">
                            <span className="text-muted-foreground">Min Balance</span>
                            <span className="font-bold">₦0.00</span>
                        </div>
                        <ul className="text-sm space-y-3 mt-4">
                            <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Free incoming wire transfers</li>
                            <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Priority customer support</li>
                            <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Bulk payment API access</li>
                        </ul>
                    </CardContent>
                    <CardFooter className="pt-6">
                        <Button className="w-full h-12">Open Account</Button>
                    </CardFooter>
                </Card>

                {/* High-Yield Savings */}
                <Card className="border flex flex-col hover:shadow-md transition-shadow">
                    <CardHeader className="pt-8">
                        <div className="p-3 w-14 h-14 rounded-full bg-accent text-primary flex items-center justify-center mb-4">
                            <PiggyBank className="h-7 w-7" />
                        </div>
                        <CardTitle className="text-xl">Target Savings</CardTitle>
                        <CardDescription>Reach your financial milestones faster.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 space-y-4">
                        <div className="flex justify-between items-center text-sm p-3 bg-muted/50 rounded-lg">
                            <span className="text-muted-foreground">Interest Range</span>
                            <span className="font-bold text-primary">12% - 14% P.A.</span>
                        </div>
                        <div className="flex justify-between items-center text-sm p-3 bg-muted/50 rounded-lg">
                            <span className="text-muted-foreground">Lock Period</span>
                            <span className="font-bold">3 - 12 Months</span>
                        </div>
                        <ul className="text-sm space-y-3 mt-4">
                            <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-muted-foreground" /> Automated daily/weekly savings</li>
                            <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-muted-foreground" /> Penalty-free emergency withdrawal (1x)</li>
                            <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-muted-foreground" /> High compounding returns</li>
                        </ul>
                    </CardContent>
                    <CardFooter className="pt-6">
                        <Button variant="outline" className="w-full h-12 border-primary text-primary hover:bg-primary/5">Start Saving</Button>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}
