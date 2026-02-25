import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Wifi, Search, User, ArrowRight } from "lucide-react";

export default function ClientTransfersPage() {
    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Transfer Funds</h1>
                <p className="text-muted-foreground mt-1">Send money quickly to local and international banks.</p>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mt-8">
                {/* Recent Beneficiaries */}
                <div className="xl:col-span-2 space-y-6">
                    <h2 className="text-lg font-semibold">Recent Beneficiaries</h2>
                    <div className="relative">
                        <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                        <Input type="search" placeholder="Search saved beneficiaries..." className="pl-10 h-12 text-base shadow-sm" />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {[
                            { name: 'Michael O.', bank: 'Access Bank' },
                            { name: 'Sarah T.', bank: 'GTBank' },
                            { name: 'Chidi M.', bank: 'Abia MFB' },
                            { name: 'Oluwaseun', bank: 'Zenith Bank' },
                            { name: 'Rent Agent', bank: 'UBA' },
                        ].map((person) => (
                            <Card key={person.name} className="border hover:border-primary/50 cursor-pointer transition-colors shadow-sm group">
                                <CardHeader className="p-4 flex flex-col items-center justify-center text-center gap-2">
                                    <div className="size-12 rounded-full bg-accent text-primary flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                                        <User className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-sm">{person.name}</CardTitle>
                                        <CardDescription className="text-xs">{person.bank}</CardDescription>
                                    </div>
                                </CardHeader>
                            </Card>
                        ))}
                    </div>
                </div>

                {/* Transfer Form */}
                <div className="xl:col-span-1">
                    <Card className="border shadow-lg">
                        <CardHeader className="bg-muted/50 border-b">
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <Wifi className="h-5 w-5 text-primary" />
                                Initiate Transfer
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-5">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Destination Bank</label>
                                <select className="w-full h-10 px-3 rounded-md border bg-background text-sm outline-none focus:ring-1 focus:ring-primary focus:border-primary cursor-pointer">
                                    <option>Select Bank...</option>
                                    <option>Abia MFB (Intra-bank)</option>
                                    <option>Access Bank</option>
                                    <option>GTBank</option>
                                    <option>First Bank</option>
                                    <option>Zenith Bank</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Account Number</label>
                                <Input placeholder="10 Digit Account Number" />
                                <p className="text-xs text-green-600 font-medium hidden">Account Name: John Doe</p>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Amount</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2.5 text-muted-foreground">₦</span>
                                    <Input type="number" placeholder="0.00" className="pl-8 text-lg font-bold" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Narration (Optional)</label>
                                <Input placeholder="What is this for?" />
                            </div>
                        </CardContent>
                        <CardFooter className="border-t bg-muted/50 flex flex-col items-stretch pt-4 pb-4">
                            <Button className="w-full h-12 shadow-md gap-2">
                                Send Money <ArrowRight className="h-4 w-4" />
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
            </div>
        </div>
    );
}
