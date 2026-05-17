"use client";

import { use, useEffect, useState, Suspense } from "react";
import { ProductTypeEditor } from "@/components/forms/ProductTypeEditor";
import { api } from "@/lib/api";
import { ProductType } from "@/lib/api/types";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

function EditProductTypeContent({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const [data, setData] = useState<ProductType | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            try {
                const productType = await api.getProductTypeById(id);
                if (productType) {
                    setData(productType);
                } else {
                    toast.error("Product type not found");
                    router.push("/products/types");
                }
            } catch (error) {
                toast.error("Failed to load product type");
                router.push("/products/types");
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

    return <ProductTypeEditor isEdit={true} initialData={data} />;
}

export default function EditProductTypePage({ params }: { params: Promise<{ id: string }> }) {
    return (
        <Suspense fallback={<div className="flex w-full justify-center p-24"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>}>
            <EditProductTypeContent params={params} />
        </Suspense>
    );
}
