import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lightbulb, Hash, Tag, Wifi } from "lucide-react";

export default function ExploreServicesPage() {
    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Services Hub</h1>
                <p className="text-muted-foreground mt-1">Make payments and handle daily utilities instantly.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mt-8">
                <Card className="border shadow-sm flex flex-col items-center justify-center p-6 text-center hover:border-primary/50 transition-colors cursor-pointer group">
                    <div className="p-3 rounded-full bg-accent text-primary mb-4 group-hover:scale-110 transition-transform">
                        <Tag className="h-8 w-8" />
                    </div>
                    <CardTitle className="text-lg">Pay Bills</CardTitle>
                    <CardDescription className="mt-2 text-xs">Cable TV, Subscriptions, Insurance</CardDescription>
                </Card>

                <Card className="border shadow-sm flex flex-col items-center justify-center p-6 text-center hover:border-primary/50 transition-colors cursor-pointer group">
                    <div className="p-3 rounded-full bg-accent text-primary mb-4 group-hover:scale-110 transition-transform">
                        <Lightbulb className="h-8 w-8" />
                    </div>
                    <CardTitle className="text-lg">Utilities</CardTitle>
                    <CardDescription className="mt-2 text-xs">Power, Water & Environmental Taxes</CardDescription>
                </Card>

                <Card className="border shadow-sm flex flex-col items-center justify-center p-6 text-center hover:border-primary/50 transition-colors cursor-pointer group">
                    <div className="p-3 rounded-full bg-accent text-primary mb-4 group-hover:scale-110 transition-transform">
                        <Hash className="h-8 w-8" />
                    </div>
                    <CardTitle className="text-lg">e-Pins</CardTitle>
                    <CardDescription className="mt-2 text-xs">Airtime, Data & Exam scratch cards</CardDescription>
                </Card>

                <Card className="border shadow-sm flex flex-col items-center justify-center p-6 text-center hover:border-primary/50 transition-colors cursor-pointer group">
                    <div className="p-3 rounded-full bg-accent text-primary mb-4 group-hover:scale-110 transition-transform">
                        <Wifi className="h-8 w-8" />
                    </div>
                    <CardTitle className="text-lg">Transfers</CardTitle>
                    <CardDescription className="mt-2 text-xs">Local & International Remittances</CardDescription>
                </Card>
            </div>
        </div>
    );
}
