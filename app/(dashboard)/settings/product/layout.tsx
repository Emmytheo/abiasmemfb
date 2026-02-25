"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function ProductSettingsLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    const tabs = [
        { name: "Classes", href: "/settings/product/classes" },
        { name: "Categories", href: "/settings/product/categories" },
        { name: "Types", href: "/settings/product/types" },
    ];

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Show header and tabs only on main listing pages */}
            {(pathname === "/settings/product/classes" ||
                pathname === "/settings/product/categories" ||
                pathname === "/settings/product/types") && (
                    <>
                        <div className="flex flex-col gap-2">
                            <h1 className="text-3xl font-bold tracking-tight text-primary">Product Configuration</h1>
                            <p className="text-muted-foreground">
                                Manage product classes, categories, and specific types offered by ABIA MFB.
                            </p>
                        </div>

                        <div className="bg-background/95 backdrop-blur border-b sticky top-16 z-10 w-full mb-6 py-2">
                            <nav className="flex items-center space-x-1 border rounded-lg p-1 bg-muted/20 w-max">
                                {tabs.map((tab) => {
                                    const isActive = pathname.startsWith(tab.href) &&
                                        (pathname === tab.href || tab.name !== "Types" || pathname === "/settings/product/types");
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
