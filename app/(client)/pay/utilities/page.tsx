import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Lightbulb, Droplets, Trash2, Search } from "lucide-react";

export default function ClientUtilitiesPage() {
    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Utilities</h1>
                <p className="text-muted-foreground mt-1">Pay for power, water, and environmental services.</p>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mt-8">
                {/* Available Utilities */}
                <div className="xl:col-span-2 space-y-6">
                    <div className="relative">
                        <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                        <Input type="search" placeholder="Search disco or utility board..." className="pl-10 h-12 text-base shadow-sm" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[
                            { name: 'EKEDC (Eko Disco)', type: 'Power', icon: Lightbulb },
                            { name: 'IKEDC (Ikeja Disco)', type: 'Power', icon: Lightbulb },
                            { name: 'Abia State Water Board', type: 'Water', icon: Droplets },
                            { name: 'LAWMA', type: 'Waste', icon: Trash2 },
                            { name: 'KEDCO (Kano Disco)', type: 'Power', icon: Lightbulb },
                        ].map((utility) => (
                            <Card key={utility.name} className="border hover:border-primary/50 cursor-pointer transition-colors shadow-sm group">
                                <CardHeader className="p-4 flex flex-row items-center gap-4">
                                    <div className="size-10 rounded-full bg-accent text-primary flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                                        <utility.icon className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-sm">{utility.name}</CardTitle>
                                        <CardDescription className="text-xs">{utility.type} Utility</CardDescription>
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
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-5">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Meter/Account Number</label>
                                <Input placeholder="Enter meter number" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Phone Number</label>
                                <Input type="tel" placeholder="080..." />
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
                            <div className="flex justify-between text-sm mb-4">
                                <span className="text-muted-foreground">Convenience Fee</span>
                                <span className="font-medium">₦100.00</span>
                            </div>
                            <Button className="w-full h-12 shadow-md">Purchase Token</Button>
                        </CardFooter>
                    </Card>
                </div>
            </div>
        </div>
    );
}
