import { ContactHero } from "@/components/support/contact-hero";
import { ContactInfo } from "@/components/support/contact-info";
import { ContactForm } from "@/components/support/contact-form";
import { BranchLocator } from "@/components/support/branch-locator";
import { LegalSeeAlso } from "@/components/legal/see-also";

export default function HelpSupportPage() {
    return (
        <>
            <ContactHero />

            {/* Main Content: Split Layout */}
            <div className="flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20">
                    <ContactInfo />
                    <ContactForm />
                </div>
            </div>

            <BranchLocator />

            <div className="py-16 bg-white dark:bg-card-dark transition-colors duration-300">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <LegalSeeAlso />
                </div>
            </div>
        </>
    );
}
