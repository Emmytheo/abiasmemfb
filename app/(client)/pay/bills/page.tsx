import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tag, Search, CheckCircle2 } from "lucide-react";

export default function ClientBillsPage() {
    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Pay Bills</h1>
                <p className="text-muted-foreground mt-1">Settle your cable, internet, and subscription bills instantly.</p>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mt-8">
                {/* Available Billers */}
                <div className="xl:col-span-2 space-y-6">
                    <div className="relative">
                        <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                        <Input type="search" placeholder="Search billers (e.g., DSTV, GOTV)..." className="pl-10 h-12 text-base shadow-sm" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {['DSTV Subscription', 'GOTV Subscription', 'Startimes', 'Netflix NG', 'Showmax', 'Spectranet'].map((biller) => (
                            <Card key={biller} className="border hover:border-primary/50 cursor-pointer transition-colors shadow-sm group">
                                <CardHeader className="p-4 flex flex-row items-center gap-4">
                                    <div className="size-10 rounded-full bg-accent text-primary flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                                        <Tag className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-sm">{biller}</CardTitle>
                                        <CardDescription className="text-xs">Cable & Internet</CardDescription>
                                    </div>
                                </CardHeader>
                            </Card>
                        ))}
                    </div>
                </div>

                {/* Payment Form */}
                <div className="xl:col-span-1">
                    <Card className="border shadow-lg">
                        <CardHeader className="bg-muted/50 border-b">
                            <CardTitle className="flex justify-between items-center text-lg">
                                Payment Details
                                <span className="text-xs font-normal text-muted-foreground bg-background px-2 py-1 rounded-md border">Select a Biller</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-5">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Smartcard / Account Number</label>
                                <Input placeholder="Enter 10-digit number" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Select Package</label>
                                <select className="w-full h-10 px-3 rounded-md border bg-background text-sm outline-none focus:ring-1 focus:ring-primary focus:border-primary cursor-pointer">
                                    <option>Select a package...</option>
                                    <option>Premium - ₦29,500</option>
                                    <option>Compact Plus - ₦19,800</option>
                                    <option>Compact - ₦12,500</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Amount to Pay</label>
                                <Input defaultValue="₦0.00" disabled className="bg-accent/50 font-bold" />
                            </div>
                        </CardContent>
                        <CardFooter className="border-t bg-muted/50 flex flex-col items-stretch pt-4 pb-4">
                            <div className="flex justify-between text-sm mb-4">
                                <span className="text-muted-foreground">Convenience Fee</span>
                                <span className="font-medium">₦100.00</span>
                            </div>
                            <Button className="w-full h-12 shadow-md">Complete Payment</Button>
                        </CardFooter>
                    </Card>
                </div>
            </div>
        </div>
    );
}
