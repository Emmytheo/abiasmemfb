"use client";

import { MapPin } from "lucide-react";
import { useBankProfile } from "@/context/bank-profile-context";

export function BranchLocator() {
    const { activeProfile } = useBankProfile();

    return (
        <div className="w-full bg-background border-border py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-10">
                <div className="flex flex-col gap-3 items-center text-center">
                    <h2 className="text-foreground text-3xl font-display font-bold">Visit {activeProfile.shortName} Locations</h2>
                    <p className="text-muted-foreground max-w-xl">
                        Find your nearest {activeProfile.legalName} branch, service lounge, or command desk across {activeProfile.regionLabel}.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                    <div className="lg:col-span-7 relative min-h-[380px] rounded-2xl overflow-hidden shadow-xl border border-border bg-slate-900">
                        <div className="absolute inset-0 pattern-dots opacity-20" />
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/40 via-slate-900 to-slate-950" />

                        {activeProfile.branches.map((branch, idx) => (
                            <div
                                key={idx}
                                className="absolute -translate-x-1/2 -translate-y-1/2 group cursor-pointer z-10"
                                style={{ top: branch.posTop, left: branch.posLeft }}
                            >
                                <div className="relative flex flex-col items-center">
                                    <MapPin className={`drop-shadow-lg fill-current ${branch.featured ? "w-11 h-11 text-accent" : "w-8 h-8 text-accent/85"}`} />
                                    <span className="mt-1 px-2.5 py-0.5 rounded-full bg-black/80 text-white text-[10px] font-bold whitespace-nowrap border border-white/15">
                                        {branch.name}
                                    </span>
                                </div>
                            </div>
                        ))}

                        <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-[11px] text-slate-300 bg-black/50 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10">
                            <span className="font-bold">{activeProfile.shortName} Service Network</span>
                            <span>{activeProfile.branches.length} Active Command &amp; Commercial Nodes</span>
                        </div>
                    </div>

                    <div className="lg:col-span-5 flex flex-col gap-3">
                        {activeProfile.branches.map((branch, idx) => (
                            <div key={idx} className="p-4 rounded-2xl border border-border bg-card space-y-1 flex-1 flex flex-col justify-center">
                                <div className="flex items-center justify-between gap-2">
                                    <h3 className="font-black text-sm text-foreground">{branch.name}</h3>
                                    {branch.featured && (
                                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-primary/10 text-primary">HQ</span>
                                    )}
                                </div>
                                <p className="text-xs font-bold text-primary dark:text-accent">{branch.role}</p>
                                <p className="text-xs text-muted-foreground">{branch.location}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
