"use client";

import { MapPin, Phone, Mail } from "lucide-react";
import { useBankProfile } from "@/context/bank-profile-context";

export function ContactInfo() {
    const { activeProfile } = useBankProfile();

    return (
        <div className="lg:col-span-5 flex flex-col gap-10">
            <div className="flex flex-col gap-4">
                <h2 className="text-foreground text-3xl lg:text-4xl font-display font-bold leading-tight tracking-tight">
                    Contact {activeProfile.shortName}
                </h2>
                <p className="text-muted-foreground text-lg font-normal leading-relaxed">
                    Choose your preferred channel below. Our dedicated support desk assists both personnel and retail customers.
                </p>
            </div>

            <div className="flex flex-col gap-6">
                <div className="group flex gap-5 items-start p-6 rounded-xl border border-border bg-card/80 hover:bg-card">
                    <div className="size-12 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0 text-accent group-hover:bg-accent group-hover:text-primary transition-colors">
                        <MapPin className="w-6 h-6" />
                    </div>
                    <div className="flex flex-col gap-1">
                        <h3 className="text-foreground text-lg font-bold">Headquarters</h3>
                        <p className="text-muted-foreground text-sm leading-relaxed">
                            {activeProfile.addressLines.join(", ")}
                        </p>
                    </div>
                </div>

                <div className="group flex gap-5 items-start p-6 rounded-xl border border-border bg-card/80 hover:bg-card">
                    <div className="size-12 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0 text-accent group-hover:bg-accent group-hover:text-primary transition-colors">
                        <Phone className="w-6 h-6" />
                    </div>
                    <div className="flex flex-col gap-1">
                        <h3 className="text-foreground text-lg font-bold">Customer Support Lines</h3>
                        {activeProfile.supportPhones.map((p, i) => (
                            <p key={i} className="text-muted-foreground text-sm leading-relaxed">{p}</p>
                        ))}
                        <p className="text-accent text-xs font-semibold mt-1">USSD Self-Service: {activeProfile.ussdCode}</p>
                    </div>
                </div>

                <div className="group flex gap-5 items-start p-6 rounded-xl border border-border bg-card/80 hover:bg-card">
                    <div className="size-12 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0 text-accent group-hover:bg-accent group-hover:text-primary transition-colors">
                        <Mail className="w-6 h-6" />
                    </div>
                    <div className="flex flex-col gap-1">
                        <h3 className="text-foreground text-lg font-bold">Official Email</h3>
                        <p className="text-muted-foreground text-sm leading-relaxed">
                            {activeProfile.supportEmail}
                        </p>
                        <p className="text-accent text-xs font-semibold mt-1">Compliance: {activeProfile.whistleblowerEmail}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
