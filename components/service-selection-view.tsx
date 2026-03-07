"use client";

import { useState } from "react";
import { Service, ServiceCategory } from "@/lib/api/types";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Activity, Tag, Wifi, User, Lightbulb, Hash, Landmark, CreditCard } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ServiceExecutionForm } from "./service-execution-form";

const IconMap: Record<string, any> = {
    tag: Tag,
    wifi: Wifi,
    user: User,
    lightbulb: Lightbulb,
    hash: Hash,
    landmark: Landmark,
    creditcard: CreditCard,
};

interface ServiceSelectionViewProps {
    category: ServiceCategory;
    services: Service[];
}

export function ServiceSelectionView({ category, services }: ServiceSelectionViewProps) {
    const [selectedService, setSelectedService] = useState<Service | null>(null);
    const [searchQuery, setSearchQuery] = useState("");

    const CategoryIcon = IconMap[category.icon?.toLowerCase() || ''] || Activity;

    const filteredServices = services.filter(s =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mt-8">
            <div className="xl:col-span-2 space-y-6">
                <div className="relative">
                    <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder={`Search ${category.name.toLowerCase()} services...`}
                        className="pl-10 h-12 text-base shadow-sm"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                </div>

                {filteredServices.length === 0 ? (
                    <div className="w-full p-8 flex flex-col items-center justify-center text-center border rounded-xl bg-accent/20 border-dashed">
                        <CategoryIcon className="h-10 w-10 text-muted-foreground/50 mb-3" />
                        <h3 className="text-lg font-medium">No services found</h3>
                        <p className="text-sm text-muted-foreground">Try adjusting your search query.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {filteredServices.map(service => {
                            const isSelected = selectedService?.id === service.id;
                            return (
                                <Card
                                    key={service.id}
                                    onClick={() => setSelectedService(service)}
                                    className={`border cursor-pointer transition-all shadow-sm group ${isSelected ? 'border-primary ring-1 ring-primary' : 'hover:border-primary/50'}`}
                                >
                                    <CardHeader className="p-4 flex flex-row items-center gap-4">
                                        <div className={`size-10 rounded-full flex items-center justify-center shrink-0 transition-transform ${isSelected ? 'bg-primary text-primary-foreground' : 'bg-accent text-primary group-hover:scale-110'}`}>
                                            <CategoryIcon className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-sm truncate pr-2" title={service.name}>{service.name}</CardTitle>
                                            <CardDescription className="text-xs">
                                                {service.fee_type === 'none' ? 'Zero Fees' : 'Standard Rates Apply'}
                                            </CardDescription>
                                        </div>
                                    </CardHeader>
                                </Card>
                            )
                        })}
                    </div>
                )}
            </div>

            <div className="xl:col-span-1">
                <ServiceExecutionForm service={selectedService} />
            </div>
        </div>
    );
}
