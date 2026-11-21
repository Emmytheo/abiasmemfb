"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";
import { BankPageHeader } from "@/components/banking/page-header";
import { SubsystemNav } from "@/components/banking/subsystem-nav";

function ServiceSettingsContent({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    return (
        <div className="max-w-7xl mx-auto p-4 sm:p-8 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {(pathname === "/settings/service/categories" ||
                pathname === "/settings/service/list") && (
                    <>
                        <BankPageHeader
                            badge="Services & Billers Factory"
                            livePill="Workflow-Backed"
                            title="Service Configuration"
                            subtitle="Configure bill payment categories, transfer rails, fee schedules, dynamic form schemas, and workflow bindings."
                        />
                        <SubsystemNav group="factory" />
                    </>
                )}

            {children}
        </div>
    );
}

export default function ServiceSettingsLayout({ children }: { children: React.ReactNode }) {
    return (
        <Suspense fallback={<div className="p-8">Loading configuration...</div>}>
            <ServiceSettingsContent>
                {children}
            </ServiceSettingsContent>
        </Suspense>
    );
}
