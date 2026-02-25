import { CareersHero } from "@/components/careers/hero";
import { CareersValues } from "@/components/careers/values";
import { EmployeeSpotlight } from "@/components/careers/employee-spotlight";
import { JobList } from "@/components/careers/job-list";
import { LegalSeeAlso } from "@/components/legal/see-also";

export default function CareersPage() {
    return (
        <>
            <CareersHero />
            <CareersValues />
            <EmployeeSpotlight />
            <JobList />

            {/* General Application CTA */}
            <section className="py-16 bg-card border-t border-border transition-colors duration-300">
                <div className="max-w-4xl mx-auto px-4 text-center">
                    <h3 className="text-2xl font-bold text-foreground mb-4">Don't see the right fit?</h3>
                    <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
                        We are always looking for talented individuals to join our growing team. Send us your resume and we will keep you in mind for future opportunities.
                    </p>
                    <button className="bg-primary hover:bg-primary/90 text-white font-bold py-3 px-8 rounded-lg shadow-lg transition-colors">
                        Submit General Application
                    </button>
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
