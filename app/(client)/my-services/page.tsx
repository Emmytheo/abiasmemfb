import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Filter, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function MyServicesPage() {
    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Transaction History</h1>
                <p className="text-muted-foreground mt-1">Review all your past service payments and fund transfers.</p>
            </div>

            <div className="flex items-center justify-between mt-8">
                <div className="relative w-full max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input type="search" placeholder="Search transactions..." className="pl-8 bg-background shadow-sm" />
                </div>
                <Button variant="outline" size="sm">
                    <Filter className="mr-2 h-4 w-4" />
                    Filter
                </Button>
            </div>

            <div className="bg-card border rounded-lg shadow-sm">
                {/* Simulated Data Table */}
                <div className="divide-y relative max-h-[500px] overflow-auto">
                    {[
                        { date: 'Oct 12, 2024', name: 'EKEDC Token Purchase', amount: '-₦10,000', type: 'Utility', status: 'Success' },
                        { date: 'Oct 10, 2024', name: 'Salary Deposit', amount: '+₦450,000', type: 'Transfer', status: 'Success' },
                        { date: 'Oct 05, 2024', name: 'Cable TV Subscription', amount: '-₦14,500', type: 'Bill', status: 'Success' },
                        { date: 'Oct 01, 2024', name: 'Airtime Recharge', amount: '-₦2,000', type: 'e-Pin', status: 'Success' }
                    ].map((tx, idx) => (
                        <div key={idx} className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                            <div>
                                <h4 className="font-medium text-sm">{tx.name}</h4>
                                <div className="flex gap-2 text-xs text-muted-foreground mt-1">
                                    <span>{tx.date}</span>
                                    <span>•</span>
                                    <span>{tx.type}</span>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className={`font-bold text-sm ${tx.amount.startsWith('+') ? 'text-emerald-500' : ''}`}>{tx.amount}</div>
                                <div className="text-xs text-muted-foreground mt-1">{tx.status}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
