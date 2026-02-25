import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Hash, Search } from "lucide-react";

export default function ClientePinsPage() {
    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Purchase e-Pins</h1>
                <p className="text-muted-foreground mt-1">Buy airtime, data bundles, and exam scratch cards directly.</p>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mt-8">
                {/* Categories */}
                <div className="xl:col-span-2 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {['Airtime', 'Data Bundles', 'WAEC Pin', 'NECO Pin', 'JAMB Pin'].map((pin) => (
                            <Card key={pin} className="border hover:border-primary/50 cursor-pointer transition-colors shadow-sm group">
                                <CardHeader className="p-4 flex flex-col items-center justify-center text-center gap-2">
                                    <div className="size-12 rounded-full bg-accent text-primary flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                                        <Hash className="h-6 w-6" />
                                    </div>
                                    <CardTitle className="text-sm">{pin}</CardTitle>
                                </CardHeader>
                            </Card>
                        ))}
                    </div>
                </div>

                {/* Form */}
                <div className="xl:col-span-1">
                    <Card className="border shadow-lg">
                        <CardHeader className="bg-muted/50 border-b">
                            <CardTitle className="flex justify-between items-center text-lg">
                                Purchase Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-5">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Select Network/Provider</label>
                                <select className="w-full h-10 px-3 rounded-md border bg-background text-sm outline-none focus:ring-1 focus:ring-primary focus:border-primary cursor-pointer">
                                    <option>MTN Nigeria</option>
                                    <option>Airtel</option>
                                    <option>Glo</option>
                                    <option>9Mobile</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Phone Number / Exam Registration</label>
                                <Input placeholder="080..." />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Amount</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2.5 text-muted-foreground">₦</span>
                                    <Input type="number" placeholder="0.00" className="pl-8" />
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="border-t bg-muted/50 flex flex-col items-stretch pt-4 pb-4">
                            <Button className="w-full h-12 shadow-md">Buy Now</Button>
                        </CardFooter>
                    </Card>
                </div>
            </div>
        </div>
    );
}
