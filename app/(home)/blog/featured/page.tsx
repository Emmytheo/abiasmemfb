import { FeaturedHero } from "@/components/blog/featured/featured-hero";
import { LatestPerspectives } from "@/components/blog/featured/latest-perspectives";
import { VoicesOfAbia } from "@/components/blog/featured/voices-section";
import { FinancialJournal } from "@/components/blog/featured/journal-section";
import { EventsSection } from "@/components/blog/featured/events-section";
import { LegalSeeAlso } from "@/components/legal/see-also";
import { NewsletterForm } from "@/components/blog/newsletter-form";

export default function FeaturedBlogPage() {
    return (
        <>
            <FeaturedHero />
            <LatestPerspectives />
            <VoicesOfAbia />
            <FinancialJournal />
            <EventsSection />

            {/* Newsletter Section */}
            <section className="w-full border-y border-border bg-card py-16 px-6 relative overflow-hidden transition-colors duration-300">
                <div className="max-w-4xl mx-auto text-center relative z-10">
                    <h2 className="text-3xl font-display text-foreground mb-4">Master Your Money</h2>
                    <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
                        Join 15,000+ subscribers receiving weekly insights on wealth creation and business growth in Abia State.
                    </p>
                    <NewsletterForm />
                    <p className="text-xs text-muted-foreground mt-4">We respect your privacy. Unsubscribe at any time.</p>
                </div>
            </section>

            <div className="py-16 bg-background transition-colors duration-300">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <LegalSeeAlso />
                </div>
            </div>
        </>
    );
}
