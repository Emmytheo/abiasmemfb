import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Briefcase, Building, CheckCircle2 } from "lucide-react";

export default function ExploreLoansPage() {
    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Explore Loans</h1>
                <p className="text-muted-foreground mt-1">Get the financial support you need to achieve your goals.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mt-8">
                {/* SME Growth Loan */}
                <Card className="border shadow-lg flex flex-col relative overflow-hidden">
                    <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-bl-lg">
                        Popular
                    </div>
                    <CardHeader className="pt-8">
                        <div className="p-3 w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                            <Building className="h-7 w-7 text-primary" />
                        </div>
                        <CardTitle className="text-xl">SME Growth Loan</CardTitle>
                        <CardDescription>Flexible financing to power your business growth.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 space-y-4">
                        <div className="flex justify-between items-center text-sm p-3 bg-muted/50 rounded-lg">
                            <span className="text-muted-foreground">Interest Rate</span>
                            <span className="font-bold text-primary">12.5% P.A.</span>
                        </div>
                        <div className="flex justify-between items-center text-sm p-3 bg-muted/50 rounded-lg">
                            <span className="text-muted-foreground">Amount Limit</span>
                            <span className="font-bold">Up to ₦5,000,000</span>
                        </div>
                        <ul className="text-sm space-y-3 mt-4">
                            <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Quick 48-hour approval</li>
                            <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> No collateral for &lt;₦500k</li>
                            <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Flexible 3-24 months tenure</li>
                        </ul>
                    </CardContent>
                    <CardFooter className="pt-6">
                        <Button className="w-full h-12">Apply Now</Button>
                    </CardFooter>
                </Card>

                {/* Personal Loan */}
                <Card className="border flex flex-col hover:shadow-md transition-shadow">
                    <CardHeader className="pt-8">
                        <div className="p-3 w-14 h-14 rounded-full bg-accent text-primary flex items-center justify-center mb-4">
                            <Briefcase className="h-7 w-7" />
                        </div>
                        <CardTitle className="text-xl">Personal Asset Loan</CardTitle>
                        <CardDescription>Finance your immediate personal or household needs.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 space-y-4">
                        <div className="flex justify-between items-center text-sm p-3 bg-muted/50 rounded-lg">
                            <span className="text-muted-foreground">Interest Rate</span>
                            <span className="font-bold text-primary">15% P.A.</span>
                        </div>
                        <div className="flex justify-between items-center text-sm p-3 bg-muted/50 rounded-lg">
                            <span className="text-muted-foreground">Amount Limit</span>
                            <span className="font-bold">Up to ₦1,500,000</span>
                        </div>
                        <ul className="text-sm space-y-3 mt-4">
                            <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-muted-foreground" /> Direct salary deduction</li>
                            <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-muted-foreground" /> Minimal documentation</li>
                            <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-muted-foreground" /> Up to 12 months tenure</li>
                        </ul>
                    </CardContent>
                    <CardFooter className="pt-6">
                        <Button variant="outline" className="w-full h-12 border-primary text-primary hover:bg-primary/5">Apply Now</Button>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}
