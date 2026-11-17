"use client";

import Link from "next/link";
import Image from "next/image";
import { Facebook, MonitorPlay, AtSign, Phone } from "lucide-react";
import { Newsletter } from "../newsletter";
import { Logo } from "@/components/ui/logo";
import { useBankProfile } from "@/context/bank-profile-context";

export function Footer() {
    const { activeProfile } = useBankProfile();

    return (
        <>
            <Newsletter />
            <footer
                className={
                    activeProfile.themeStyle.useBrandedDarkHero
                        ? "text-white pt-20 pb-10 border-t border-white/10"
                        : "bg-primary text-white pt-20 pb-10 border-t border-white/10 dark:border-border dark:bg-background"
                }
                style={{
                    backgroundColor: activeProfile.themeStyle.useBrandedDarkHero
                        ? activeProfile.themeStyle.heroBgHex
                        : undefined,
                }}
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
                        <div>
                            <div className="flex items-center gap-2 mb-6 hover:opacity-90 transition-opacity">
                                <Logo
                                    iconClassName="w-8 h-8 text-xl"
                                    textClassName="text-xl text-white font-display"
                                />
                            </div>
                            <p className="text-white/80 text-sm leading-relaxed mb-4">
                                {activeProfile.addressLines.map((line, i) => (
                                    <span key={i}>
                                        {line}
                                        {i < activeProfile.addressLines.length - 1 && <br />}
                                    </span>
                                ))}
                            </p>
                            <div className="text-xs text-white/75 space-y-1 mb-5">
                                {activeProfile.supportPhones.map((phone, i) => (
                                    <p key={i} className="flex items-center gap-1.5 font-medium">
                                        <Phone size={12} className="text-accent shrink-0" /> {phone}
                                    </p>
                                ))}
                                <p className="text-accent font-bold">USSD: {activeProfile.ussdCode}</p>
                            </div>
                            <div className="flex space-x-4">
                                <Link
                                    href="/company"
                                    className="text-white/80 hover:text-accent transition-colors"
                                    aria-label="Website"
                                >
                                    <Facebook size={20} />
                                </Link>
                                <Link
                                    href="/media"
                                    className="text-white/80 hover:text-accent transition-colors"
                                    aria-label="Media"
                                >
                                    <MonitorPlay size={20} />
                                </Link>
                                <a
                                    href={`mailto:${activeProfile.supportEmail}`}
                                    className="text-white/80 hover:text-accent transition-colors"
                                    aria-label="Email"
                                >
                                    <AtSign size={20} />
                                </a>
                            </div>
                        </div>

                        <div>
                            <h4 className="text-accent font-bold uppercase tracking-wider text-xs mb-6">
                                Solutions
                            </h4>
                            <ul className="space-y-3">
                                <li>
                                    <Link className="text-white/80 hover:text-white text-sm transition-colors" href="/personal-banking">
                                        Savings & Term Accounts
                                    </Link>
                                </li>
                                <li>
                                    <Link className="text-white/80 hover:text-white text-sm transition-colors" href="/business">
                                        Personnel & SME Loans
                                    </Link>
                                </li>
                                <li>
                                    <Link className="text-white/80 hover:text-white text-sm transition-colors" href="/business#collections">
                                        School Fee Collections
                                    </Link>
                                </li>
                                <li>
                                    <Link className="text-white/80 hover:text-white text-sm transition-colors" href="/business#esusu">
                                        Esusu & Co-op Wallets
                                    </Link>
                                </li>
                                <li>
                                    <Link className="text-white/80 hover:text-white text-sm transition-colors" href="/business#agency">
                                        Agency Banking Network
                                    </Link>
                                </li>
                                <li>
                                    <Link className="text-white/80 hover:text-white text-sm transition-colors" href="/business#cards">
                                        Contactless & Virtual Cards
                                    </Link>
                                </li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="text-accent font-bold uppercase tracking-wider text-xs mb-6">
                                Institution
                            </h4>
                            <ul className="space-y-3">
                                <li>
                                    <Link className="text-white/80 hover:text-white text-sm transition-colors" href="/company">
                                        About {activeProfile.shortName}
                                    </Link>
                                </li>
                                <li>
                                    <Link className="text-white/80 hover:text-white text-sm transition-colors" href="/company/leadership">
                                        Leadership
                                    </Link>
                                </li>
                                <li>
                                    <Link className="text-white/80 hover:text-white text-sm transition-colors" href="/internet-banking">
                                        Internet & Mobile Banking
                                    </Link>
                                </li>
                                <li>
                                    <Link className="text-white/80 hover:text-white text-sm transition-colors" href="/careers">
                                        Careers
                                    </Link>
                                </li>
                                <li>
                                    <Link className="text-white/80 hover:text-white text-sm transition-colors" href="/blog">
                                        News & Insights
                                    </Link>
                                </li>
                                <li>
                                    <Link className="text-white/80 hover:text-white text-sm transition-colors" href="/support">
                                        Help Center
                                    </Link>
                                </li>
                                <li>
                                    <Link className="text-white/80 hover:text-white text-sm transition-colors" href="/legal/code-of-conduct">
                                        Code of Conduct
                                    </Link>
                                </li>
                            </ul>
                        </div>

                        <div className="flex flex-col items-center justify-center md:items-end">
                            <div className="w-32 h-32 opacity-90 hover:opacity-100 transition-all duration-500 mb-4 relative bg-white/95 rounded-2xl p-2">
                                <Image
                                    src="https://ndic.gov.ng/wp-content/uploads/2020/08/ndic_small_logo-1.png"
                                    alt="NDIC Logo"
                                    fill
                                    sizes="128px"
                                    className="object-contain p-2"
                                />
                            </div>
                            <p className="text-white/80 text-xs text-center md:text-right leading-relaxed">
                                {activeProfile.licenseBadge}
                                <br /> {activeProfile.holdingEntity}
                            </p>
                        </div>
                    </div>

                    <div className="border-t border-white/10 dark:border-border pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                        <p className="text-white/75 text-xs">
                            © {new Date().getFullYear()} {activeProfile.legalName}. All rights reserved.
                        </p>
                        <div className="flex space-x-6">
                            <Link className="text-white/75 hover:text-white text-xs transition-colors" href="/legal/privacy">
                                Privacy Policy
                            </Link>
                            <Link className="text-white/75 hover:text-white text-xs transition-colors" href="/legal/terms">
                                Terms of Service
                            </Link>
                            <Link className="text-white/75 hover:text-white text-xs transition-colors" href="/legal/code-of-conduct">
                                Whistle Blower
                            </Link>
                        </div>
                    </div>
                </div>
            </footer>
        </>
    );
}
