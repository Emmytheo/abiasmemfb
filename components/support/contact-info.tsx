import { MapPin, Phone, Mail } from "lucide-react";

export function ContactInfo() {
    return (
        <div className="lg:col-span-5 flex flex-col gap-10">
            <div className="flex flex-col gap-4">
                <h2 className="text-foreground text-3xl lg:text-4xl font-display font-bold leading-tight tracking-tight">
                    Contact Information
                </h2>
                <p className="text-muted-foreground text-lg font-normal leading-relaxed">
                    Choose your preferred method of communication. Our premium support line is available 24/7 for account holders.
                </p>
            </div>

            <div className="flex flex-col gap-6">
                {/* Contact Card 1 */}
                <div className="group flex gap-5 items-start p-6 rounded-xl border border-border bg-card/80 hover:bg-card">
                    <div className="size-12 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0 text-accent group-hover:bg-accent group-hover:text-primary transition-colors">
                        <MapPin className="w-6 h-6" />
                    </div>
                    <div className="flex flex-col gap-1">
                        <h3 className="text-foreground text-lg font-bold">Headquarters</h3>
                        <p className="text-muted-foreground text-sm leading-relaxed">
                            123 Banking District, Victoria Island<br />Lagos State, Nigeria
                        </p>
                    </div>
                </div>

                {/* Contact Card 2 */}
                <div className="group flex gap-5 items-start p-6 rounded-xl border border-border bg-card/80 hover:bg-card">
                    <div className="size-12 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0 text-accent group-hover:bg-accent group-hover:text-primary transition-colors">
                        <Phone className="w-6 h-6" />
                    </div>
                    <div className="flex flex-col gap-1">
                        <h3 className="text-foreground text-lg font-bold">Premium Support</h3>
                        <p className="text-muted-foreground text-sm leading-relaxed">
                            +234 800 ABIA PREMIUM
                        </p>
                        <p className="text-accent text-xs font-semibold mt-1">Available 24/7</p>
                    </div>
                </div>

                {/* Contact Card 3 */}
                <div className="group flex gap-5 items-start p-6 rounded-xl border border-border bg-card/80 hover:bg-card">
                    <div className="size-12 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0 text-accent group-hover:bg-accent group-hover:text-primary transition-colors">
                        <Mail className="w-6 h-6" />
                    </div>
                    <div className="flex flex-col gap-1">
                        <h3 className="text-foreground text-lg font-bold">Concierge Email</h3>
                        <p className="text-muted-foreground text-sm leading-relaxed">
                            concierge@AbiaSMEMFB.com
                        </p>
                        <p className="text-accent text-xs font-semibold mt-1">Response within 2 hours</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
