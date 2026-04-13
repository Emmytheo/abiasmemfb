import { redirect } from "next/navigation";
import { api } from "@/lib/api";
import { Activity } from "lucide-react";

import { ServiceSelectionView } from "@/components/service-selection-view";
import { TransferTabs } from "../transfer/transfer-tabs";

export const dynamic = 'force-dynamic';

export default async function DynamicServiceCategoryPage({ params }: { params: Promise<{ categorySlug: string }> }) {
    const { categorySlug } = await params;
    
    const categories = await api.getServiceCategories();
    const currentCategory = categories.find(c => c.slug === categorySlug);

    if (!currentCategory) {
        redirect('/client-dashboard');
    }

    const services = await api.getServicesByCategory(categorySlug);

    return (
        <div className="container max-w-6xl py-8 space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center gap-4">
                <a href="/client-dashboard" className="p-2 hover:bg-muted rounded-full transition-colors">
                    <Activity className="h-5 w-5" />
                </a>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{currentCategory.name}</h1>
                    <p className="text-muted-foreground mt-1">{currentCategory.description || 'Access quick operational services.'}</p>
                </div>
            </div>

            {currentCategory.ui_layout === 'transfer_tabs' ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-1 border-r pr-6 hidden lg:block">
                         {/* We can move TransferBeneficiaries here if needed */}
                         <p className="text-sm font-medium mb-4">Saved Beneficiaries</p>
                         <p className="text-xs text-muted-foreground italic">Quickly select a recipient to pre-fill the form.</p>
                    </div>
                    <div className="lg:col-span-2">
                        <TransferTabs 
                            services={services}
                        />
                    </div>
                </div>
            ) : (
                <ServiceSelectionView category={currentCategory} services={services} />
            )}
        </div>
    );
}
