"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";

function ServiceSettingsContent({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    const tabs = [
        { name: "Categories", href: "/settings/service/categories" },
        { name: "Services", href: "/settings/service/list" },
    ];

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Show header and tabs only on main listing pages */}
            {(pathname === "/settings/service/categories" ||
                pathname === "/settings/service/list") && (
                    <>
                        <div className="flex flex-col gap-2 px-4 md:px-8">
                            <h1 className="text-3xl font-bold tracking-tight text-primary">Service Configuration</h1>
                            <p className="text-muted-foreground">
                                Manage dynamic service categories and executable services.
                            </p>
                        </div>

                        <div className="bg-background/95 backdrop-blur border-b sticky top-16 z-10 w-full mb-6 py-2 px-4 md:px-8">
                            <nav className="flex items-center space-x-1 border rounded-lg p-1 bg-muted/20 w-max">
                                {tabs.map((tab) => {
                                    const isActive = pathname.startsWith(tab.href);
                                    return (
                                        <Link
                                            key={tab.name}
                                            href={tab.href}
                                            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${isActive
                                                ? "bg-background text-primary shadow-sm"
                                                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                                                }`}
                                        >
                                            {tab.name}
                                        </Link>
                                    );
                                })}
                            </nav>
                        </div>
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
