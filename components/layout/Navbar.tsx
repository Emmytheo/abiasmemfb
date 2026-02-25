"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { ThemeCustomizer } from "@/components/theme-customizer";
import { Logo } from "@/components/ui/logo";

export function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const pathname = usePathname();

    const isActive = (path: string) => {
        if (path === "/" && pathname === "/") return true;
        if (path !== "/" && pathname.startsWith(path)) return true;
        return false;
    };

    const linkBaseClass = "text-sm font-medium transition-colors duration-200";
    const activeClass = "text-primary dark:text-accent font-bold";
    const inactiveClass = "text-muted-foreground hover:text-primary dark:hover:text-accent";

    return (
        <nav className="fixed w-full z-50 bg-background/95 backdrop-blur-md border-b border-border transition-colors duration-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-20">
                    <div className="flex-shrink-0 flex items-center">
                        <Link href="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
                            <Logo
                                iconClassName="w-10 h-10 text-xl bg-sidebar-primary text-sidebar-primary-foreground size-10 border-2 border-sidebar-primary"
                                textClassName="text-2xl text-primary dark:text-white"
                            />
                        </Link>
                    </div>
                    <div className="hidden md:flex items-center space-x-8">
                        <Link
                            href="/"
                            className={`${linkBaseClass} ${isActive("/") ? activeClass : inactiveClass}`}
                        >
                            Home
                        </Link>
                        <Link
                            href="/personal-banking"
                            className={`${linkBaseClass} ${isActive("/personal-banking") ? activeClass : inactiveClass}`}
                        >
                            Personal Banking
                        </Link>
                        <Link
                            href="/business"
                            className={`${linkBaseClass} ${isActive("/business") ? activeClass : inactiveClass}`}
                        >
                            Business
                        </Link>
                        <Link
                            href="/company"
                            // Match /company but NOT /company/leadership (optional preference, but strictly startsWith handles substrings)
                            // Usually "Company" section includes leadership, so startsWith is good.
                            className={`${linkBaseClass} ${isActive("/company") ? activeClass : inactiveClass}`}
                        >
                            Company
                        </Link>
                        <Link
                            href="/blog"
                            className={`${linkBaseClass} ${isActive("/blog") ? activeClass : inactiveClass}`}
                        >
                            Blog
                        </Link>
                        <Link
                            href="/support"
                            className={`${linkBaseClass} ${isActive("/support") ? activeClass : inactiveClass}`}
                        >
                            Help & Support
                        </Link>
                    </div>
                    <div className="hidden md:flex items-center gap-4">
                        <ThemeCustomizer />
                        <Link
                            href="#"
                            className="inline-flex items-center justify-center px-6 py-2.5 border border-primary dark:border-accent text-sm font-medium rounded-full text-primary dark:text-accent bg-transparent hover:bg-primary hover:text-white dark:hover:bg-accent dark:hover:text-primary transition-all duration-300"
                        >
                            Internet Banking
                        </Link>
                    </div>
                    <div className="flex md:hidden items-center gap-4">
                        <ThemeCustomizer />
                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            className="text-muted-foreground hover:text-foreground focus:outline-none"
                            type="button"
                        >
                            {isOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {isOpen && (
                <div className="md:hidden bg-background border-b border-border">
                    <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                        <Link
                            href="/"
                            onClick={() => setIsOpen(false)}
                            className="block px-3 py-2 rounded-md text-base font-medium text-foreground hover:text-primary dark:hover:text-accent hover:bg-muted"
                        >
                            Home
                        </Link>
                        <Link
                            href="/personal-banking"
                            onClick={() => setIsOpen(false)}
                            className="block px-3 py-2 rounded-md text-base font-medium text-muted-foreground hover:text-primary dark:hover:text-accent hover:bg-muted"
                        >
                            Personal Banking
                        </Link>
                        <Link
                            href="/business"
                            onClick={() => setIsOpen(false)}
                            className="block px-3 py-2 rounded-md text-base font-medium text-muted-foreground hover:text-primary dark:hover:text-accent hover:bg-muted"
                        >
                            Business
                        </Link>
                        <Link
                            href="/company"
                            onClick={() => setIsOpen(false)}
                            className="block px-3 py-2 rounded-md text-base font-medium text-muted-foreground hover:text-primary dark:hover:text-accent hover:bg-muted"
                        >
                            Company
                        </Link>
                        <Link
                            href="/blog"
                            onClick={() => setIsOpen(false)}
                            className="block px-3 py-2 rounded-md text-base font-medium text-muted-foreground hover:text-primary dark:hover:text-accent hover:bg-muted"
                        >
                            Blog
                        </Link>
                        <Link
                            href="/support"
                            onClick={() => setIsOpen(false)}
                            className="block px-3 py-2 rounded-md text-base font-medium text-muted-foreground hover:text-primary dark:hover:text-accent hover:bg-muted"
                        >
                            Help & Support
                        </Link>
                        <div className="pt-4 pb-2">
                            <Link
                                href="#"
                                className="w-full flex items-center justify-center px-6 py-3 border border-primary dark:border-accent text-base font-medium rounded-full text-primary dark:text-accent bg-transparent hover:bg-primary hover:text-white dark:hover:bg-accent dark:hover:text-primary transition-all duration-300"
                            >
                                Internet Banking
                            </Link>
                        </div>
                    </div>
                </div>
            )}
        </nav>
    );
}
