import { redirect } from "next/navigation";
import { api } from "@/lib/api";
import { Activity } from "lucide-react";

import { ServiceSelectionView } from "@/components/service-selection-view";

export const dynamic = 'force-dynamic';

export default async function DynamicServiceCategoryPage({ params }: { params: Promise<{ categorySlug: string }> }) {
    const { categorySlug } = await params;
    
    const categories = await api.getServiceCategories();
    const currentCategory = categories.find(c => c.slug === categorySlug);

    if (!currentCategory) {
        // If it's an invalid category, jump back to dashboard
        redirect('/client-dashboard');
    }

    const services = await api.getServicesByCategory(categorySlug);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">{currentCategory.name}</h1>
                <p className="text-muted-foreground mt-1">{currentCategory.description || 'Access quick operational services.'}</p>
            </div>

            <ServiceSelectionView category={currentCategory} services={services} />
        </div>
    );
}
