import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { api } from "@/lib/api";
import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard";

export const metadata = {
  title: "Complete Your Onboarding | ABIA MFB",
  description: "Set up your banking identity and open your first account with ABIA MFB.",
};

export default async function OnboardingPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/auth/login");
    }

    // Check if they already have a customer record with qore_customer_id
    const customer = await api.getCustomerBySupabaseId(user.id);
    if (customer?.qore_customer_id) {
        redirect("/client-dashboard");
    }

    // Fetch existing applications to support auto-resume
    const applications = await api.getUserApplications(user.id);
    console.log(`[Onboarding] Found ${applications.length} applications for user ${user.id}`);
    
    const latestApplication = applications.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )[0] || null;

    if (latestApplication) {
        console.log(`[Onboarding] Latest application: ${latestApplication.id}, Status: ${latestApplication.status}`);
    }

    // Fetch active product types for selection
    const productTypes = await api.getAllProductTypes();
    const activeProducts = productTypes.filter(p => p.status === 'active');

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-muted/30 p-4 md:p-8">
            <div className="w-full max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-700">
                <OnboardingWizard 
                    user={user} 
                    products={activeProducts}
                    initialCustomerData={customer}
                    initialApplication={latestApplication}
                />
            </div>
        </div>
    );
}
