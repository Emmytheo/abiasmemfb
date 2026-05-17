"use client";

import { use, useEffect, useState, Suspense } from "react";
import { ServiceEditor } from "@/components/forms/ServiceEditor";
import { api } from "@/lib/api";
import { Service } from "@/lib/api/types";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

function EditServiceContent({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const [data, setData] = useState<Service | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            try {
                const service = await api.getServiceById(id);
                if (service) {
                    setData(service);
                } else {
                    toast.error("Service not found");
                    router.push("/services");
                }
            } catch (error) {
                toast.error("Failed to load service");
                router.push("/services");
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [id, router]);

    if (loading) {
        return (
            <div className="flex w-full justify-center p-24">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!data) return null;

    return <ServiceEditor isEdit={true} initialData={data} />;
}

export default function EditServicePage({ params }: { params: Promise<{ id: string }> }) {
    return (
        <Suspense fallback={<div className="flex w-full justify-center p-24"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>}>
            <EditServiceContent params={params} />
        </Suspense>
    );
}
