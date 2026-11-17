"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, X, UserCircle, Mail, Phone, Hash, SlidersHorizontal, ArrowUpRight } from "lucide-react";
import { ThemeCustomizer } from "@/components/theme-customizer";
import { Logo } from "@/components/ui/logo";
import { useBankProfile } from "@/context/bank-profile-context";
import type { AppRole } from "@/lib/auth/roles";

interface NavbarProps {
    userRole?: AppRole | null;
}

export function Navbar({ userRole }: NavbarProps) {
    const [isOpen, setIsOpen] = useState(false);
    const pathname = usePathname();
    const { activeProfile } = useBankProfile();

    const isDarkNav = activeProfile.themeStyle.useBrandedDarkNav;
    const showTopBar = activeProfile.themeStyle.showTopUtilityBar;

    const isActive = (path: string) => {
        if (path === "/" && pathname === "/") return true;
        if (path !== "/" && pathname.startsWith(path)) return true;
        return false;
    };

    const navLinks = [
        { href: "/", label: "Home" },
        { href: "/company", label: "About" },
        { href: "/business", label: "Services" },
        { href: "/personal-banking", label: "Accounts" },
        { href: "/internet-banking", label: "Digital Banking" },
        { href: "/support", label: "Support" },
    ];

    return (
        <header className="fixed top-0 w-full z-50 transition-all duration-300">
            {/* Whisper-thin Executive Strip */}
            {showTopBar && (
                <div
                    className="text-white/85 text-[11px] font-medium border-b border-white/10 hidden md:block backdrop-blur-md"
                    style={{ backgroundColor: activeProfile.themeStyle.topBarBgHex }}
                >
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-8 flex items-center justify-between gap-4 overflow-hidden">
                        <div className="flex items-center gap-5 truncate">
                            <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-[#F4C414]">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                CBN Licensed · NDIC Insured
                            </span>
                            <a href={`mailto:${activeProfile.supportEmail}`} className="inline-flex items-center gap-1.5 hover:text-[#F4C414] transition-colors">
                                <Mail className="w-3 h-3 text-[#F4C414]" />
                                <span>{activeProfile.supportEmail}</span>
                            </a>
                            <span className="inline-flex items-center gap-1.5 truncate">
                                <Phone className="w-3 h-3 text-[#F4C414]" />
                                <span>{activeProfile.supportPhones[0]}</span>
                            </span>
                        </div>
                        <div className="flex items-center gap-4 shrink-0">
                            <span className="inline-flex items-center gap-1 font-mono font-bold text-[#F4C414]">
                                <Hash className="w-3 h-3" /> {activeProfile.ussdCode}
                            </span>
                            {userRole === "admin" && (
                                <Link
                                    href="/settings/bank-profiles"
                                    className="inline-flex items-center gap-1 text-[10px] font-black uppercase bg-white/10 hover:bg-white/20 px-2.5 py-0.5 rounded-full text-white transition-colors"
                                >
                                    <SlidersHorizontal className="w-2.5 h-2.5" /> Swap Bank
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Main Frosted / Branded Navbar */}
            <nav
                className={
                    isDarkNav
                        ? "border-b border-white/10 text-white backdrop-blur-xl shadow-lg"
                        : "bg-background/90 backdrop-blur-xl border-b border-border text-foreground shadow-sm"
                }
                style={
                    isDarkNav
                        ? { backgroundColor: `${activeProfile.themeStyle.heroBgHex}F0` }
                        : undefined
                }
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16 sm:h-[70px]">
                        <Link href="/" className="flex items-center gap-2.5 hover:opacity-90 transition-opacity shrink-0">
                            <Logo
                                iconClassName={isDarkNav ? "w-10 h-10 ring-1 ring-[#F4C414]/60" : "w-9 h-9"}
                                textClassName={isDarkNav ? "text-lg sm:text-xl text-white" : "text-xl sm:text-2xl text-primary dark:text-white"}
                                subtitle={isDarkNav ? activeProfile.holdingEntity : undefined}
                                subtitleClassName={isDarkNav ? "text-[9px] text-[#F4C414]/85" : undefined}
                            />
                        </Link>

                        {/* Center Pill Navigation */}
                        <div className={`hidden md:flex items-center gap-1 p-1 rounded-full border ${
                            isDarkNav ? "bg-white/5 border-white/10" : "bg-muted/60 border-border"
                        }`}>
                            {navLinks.map((item) => {
                                const active = isActive(item.href);
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={`px-3.5 py-1.5 rounded-full text-xs font-bold tracking-wide transition-all whitespace-nowrap ${
                                            active
                                                ? isDarkNav
                                                    ? "bg-[#F4C414] text-[#070D59] shadow-sm font-black"
                                                    : "bg-primary text-primary-foreground shadow-sm font-black"
                                                : isDarkNav
                                                  ? "text-white/85 hover:text-white hover:bg-white/10"
                                                  : "text-muted-foreground hover:text-foreground hover:bg-background/80"
                                        }`}
                                    >
                                        {item.label}
                                    </Link>
                                );
                            })}
                        </div>

                        {/* Right Action Cluster */}
                        <div className="hidden md:flex items-center gap-2.5 shrink-0">
                            <ThemeCustomizer />
                            {!userRole ? (
                                <>
                                    <Link
                                        href="/auth/sign-up"
                                        className={`text-xs font-bold px-3.5 py-2 rounded-full transition-colors ${
                                            isDarkNav ? "text-white/90 hover:text-[#F4C414]" : "text-muted-foreground hover:text-foreground"
                                        }`}
                                    >
                                        Open Account
                                    </Link>
                                    <Link
                                        href="/auth/login"
                                        className={
                                            isDarkNav
                                                ? "inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-black uppercase tracking-wider rounded-full bg-[#F4C414] text-[#070D59] hover:bg-white transition-all shadow-lg shadow-[#F4C414]/20"
                                                : "inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-primary text-primary-foreground text-xs font-black uppercase tracking-wider hover:opacity-90 transition-all shadow-md"
                                        }
                                    >
                                        <span>iBank Login</span>
                                        <ArrowUpRight className="w-3.5 h-3.5" />
                                    </Link>
                                </>
                            ) : (
                                <Link
                                    href={userRole === "admin" ? "/dashboard" : "/client-dashboard"}
                                    className={
                                        isDarkNav
                                            ? "inline-flex items-center justify-center px-5 py-2.5 bg-[#F4C414] text-xs font-black uppercase tracking-wider rounded-full text-[#070D59] hover:bg-white transition-all gap-1.5 shadow-lg"
                                            : "inline-flex items-center justify-center px-5 py-2.5 bg-primary text-xs font-black uppercase tracking-wider rounded-full text-primary-foreground hover:opacity-90 transition-all gap-1.5 shadow-md"
                                    }
                                >
                                    <UserCircle className="w-4 h-4" />
                                    {userRole === "admin" ? "Admin Console" : "Client Portal"}
                                </Link>
                            )}
                        </div>

                        {/* Mobile Trigger */}
                        <div className="flex md:hidden items-center gap-2.5">
                            <ThemeCustomizer />
                            <button
                                onClick={() => setIsOpen(!isOpen)}
                                className={`p-2 rounded-xl border ${
                                    isDarkNav ? "text-white border-white/15 bg-white/5" : "text-foreground border-border bg-muted/50"
                                }`}
                                type="button"
                                aria-label="Toggle Menu"
                            >
                                {isOpen ? <X size={20} /> : <Menu size={20} />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile Drawer */}
                {isOpen && (
                    <div
                        className={isDarkNav ? "md:hidden border-t border-white/10 text-white" : "md:hidden bg-background border-b border-border"}
                        style={isDarkNav ? { backgroundColor: activeProfile.themeStyle.topBarBgHex } : undefined}
                    >
                        <div className="px-4 pt-3 pb-5 space-y-1.5">
                            {navLinks.map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setIsOpen(false)}
                                    className={`block px-3.5 py-2.5 rounded-xl text-sm font-bold ${
                                        isActive(item.href)
                                            ? "bg-accent text-accent-foreground font-black"
                                            : isDarkNav
                                              ? "text-white/90 hover:bg-white/10"
                                              : "text-foreground hover:bg-muted"
                                    }`}
                                >
                                    {item.label}
                                </Link>
                            ))}

                            <div className="pt-3 grid grid-cols-2 gap-2.5">
                                {!userRole ? (
                                    <>
                                        <Link
                                            href="/auth/sign-up"
                                            onClick={() => setIsOpen(false)}
                                            className={`flex items-center justify-center py-3 rounded-xl text-xs font-black border ${
                                                isDarkNav ? "border-white/25 text-white" : "border-border text-foreground"
                                            }`}
                                        >
                                            Open Account
                                        </Link>
                                        <Link
                                            href="/auth/login"
                                            onClick={() => setIsOpen(false)}
                                            className="flex items-center justify-center py-3 bg-accent text-accent-foreground text-xs font-black rounded-xl"
                                        >
                                            iBank Login
                                        </Link>
                                    </>
                                ) : (
                                    <Link
                                        href={userRole === "admin" ? "/dashboard" : "/client-dashboard"}
                                        onClick={() => setIsOpen(false)}
                                        className="col-span-2 flex items-center justify-center py-3 bg-accent text-accent-foreground text-xs font-black rounded-xl gap-2"
                                    >
                                        <UserCircle className="w-4 h-4" />
                                        {userRole === "admin" ? "Admin Console" : "Client Portal"}
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </nav>
        </header>
    );
}
