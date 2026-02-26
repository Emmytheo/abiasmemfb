"use client";

import { useEffect, useState } from "react";
import { GenericDataTable } from "@/components/data-table";
import { api, SystemConfig } from "@/lib/api";

export default function GlobalContentSettingsPage() {
    const [data, setData] = useState<SystemConfig[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.getConfigsByCategory("Global Content").then((configs) => {
            setData(configs);
            setLoading(false);
        });
    }, []);

    if (loading) return <div className="p-8">Loading settings...</div>;

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <GenericDataTable
                title="Global Content Management"
                description="Manage text, banners, and configurable zones across the public site."
                data={data}
                searchPlaceholder="Search by content key..."
                searchKey="key"
                columns={[
                    { header: "Key", accessorKey: "key" },
                    {
                        header: "Value (Preview)",
                        accessorKey: "value",
                        cell: (item) => (
                            <div className="max-w-[400px] truncate text-muted-foreground">
                                {item.value}
                            </div>
                        )
                    },
                    { header: "Last Updated", accessorKey: "updated_at", cell: (item) => new Date(item.updated_at).toLocaleDateString() },
                ]}
                gridRenderItem={(item) => (
                    <div key={item.id} className="border rounded-lg p-4 bg-background shadow-sm hover:shadow-md transition-shadow">
                        <h3 className="font-semibold text-lg mb-2">{item.key.replace(/_/g, ' ')}</h3>
                        <div className="text-sm text-muted-foreground p-3 bg-muted/30 rounded-md mb-4 line-clamp-3">
                            {item.value}
                        </div>
                        <div className="text-xs text-muted-foreground">Last updated: {new Date(item.updated_at).toLocaleDateString()}</div>
                    </div>
                )}
            />
        </div>
    );
}
