import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function MyProductsPage() {
    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">My Products</h1>
                    <p className="text-muted-foreground mt-1">View and manage your active accounts and assets.</p>
                </div>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Open New Account
                </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Card className="border shadow-sm">
                    <CardHeader className="pb-2">
                        <CardDescription>Savings Account</CardDescription>
                        <CardTitle className="text-2xl">₦2,500,000.00</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-sm text-muted-foreground mb-4">Account Number: 0123456789</div>
                        <Button variant="outline" className="w-full">View Details</Button>
                    </CardContent>
                </Card>

                <Card className="border shadow-sm">
                    <CardHeader className="pb-2">
                        <CardDescription>Fixed Deposit</CardDescription>
                        <CardTitle className="text-2xl">₦1,700,000.00</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-sm text-muted-foreground mb-4">Matures: Dec 15, 2024</div>
                        <Button variant="outline" className="w-full">View Details</Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
