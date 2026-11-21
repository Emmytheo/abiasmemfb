"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useBankProfile } from "@/context/bank-profile-context";
import { BankPageHeader } from "@/components/banking/page-header";
import { SubsystemNav } from "@/components/banking/subsystem-nav";

function ProductSettingsContent({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const { activeProfile } = useBankProfile();

    return (
        <div className="max-w-7xl mx-auto p-4 sm:p-8 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {(pathname === "/settings/product/classes" ||
                pathname === "/settings/product/categories" ||
                pathname === "/settings/product/types") && (
                    <>
                        <BankPageHeader
                            badge="Product Factory · Catalog Engine"
                            livePill="Dynamic Schema Active"
                            title="Product Configuration"
                            subtitle={`Design product classes, deposit & credit categories, interest terms, and application form schemas offered by ${activeProfile.shortName}.`}
                        />
                        <SubsystemNav group="factory" />
                    </>
                )}

            {children}
        </div>
    );
}

export default function ProductSettingsLayout({ children }: { children: React.ReactNode }) {
    return (
        <Suspense fallback={<div className="p-8">Loading configuration...</div>}>
            <ProductSettingsContent>
                {children}
            </ProductSettingsContent>
        </Suspense>
    );
}
