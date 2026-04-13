import { redirect } from "next/navigation";
import { api } from "@/lib/api";

export default async function TransferRedirectPage() {
    const categories = await api.getServiceCategories();
    // Find the actual category configured in the CMS
    const transferCategory = categories.find(c => 
        c.slug.toLowerCase().includes('transfer') || 
        c.name.toLowerCase().includes('transfer')
    );

    if (transferCategory) {
        redirect(`/pay/${transferCategory.slug}`);
    }

    // Fallback if no category found (unlikely in production)
    redirect('/client-dashboard');
}
