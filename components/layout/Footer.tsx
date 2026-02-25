import Link from "next/link";
import Image from "next/image";
import { Facebook, MonitorPlay, AtSign } from "lucide-react"; // Using Lucide icons as replacement for Material Icons
import { Newsletter } from "../newsletter";
import { Logo } from "@/components/ui/logo";


export function Footer() {
    return (
        <>
            {/* Newsletter */}
            <Newsletter />
            <footer className="bg-primary-dark dark:bg-background text-white pt-20 pb-10 border-t border-white/10 dark:border-border">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
                        <div>
                            <div className="flex items-center gap-2 mb-6 hover:opacity-90 transition-opacity">
                                <Logo
                                    iconClassName="w-8 h-8 bg-accent text-primary text-xl"
                                    textClassName="text-xl text-white font-display"
                                />
                            </div>
                            <p className="text-white/80 text-sm leading-relaxed mb-6">
                                Plot 00 Avenue Street,
                                <br />
                                Town City, Abia State.
                                <br />
                                Nigeria.
                            </p>
                            <div className="flex space-x-4">
                                <Link
                                    href="#"
                                    className="text-white/80 hover:text-accent transition-colors"
                                    aria-label="Facebook"
                                >
                                    <Facebook size={20} />
                                </Link>
                                <Link
                                    href="#"
                                    className="text-white/80 hover:text-accent transition-colors"
                                    aria-label="Youtube"
                                >
                                    <MonitorPlay size={20} />
                                </Link>
                                <Link
                                    href="#"
                                    className="text-white/80 hover:text-accent transition-colors"
                                    aria-label="Email"
                                >
                                    <AtSign size={20} />
                                </Link>
                            </div>
                        </div>
                        <div>
                            <h4 className="text-accent font-bold uppercase tracking-wider text-xs mb-6">
                                Products
                            </h4>
                            <ul className="space-y-3">
                                <li>
                                    <Link
                                        className="text-white/80 hover:text-white text-sm transition-colors"
                                        href="/personal-banking"
                                    >
                                        Deposit Products
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        className="text-white/80 hover:text-white text-sm transition-colors"
                                        href="/business"
                                    >
                                        Personal Loans
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        className="text-white/80 hover:text-white text-sm transition-colors"
                                        href="/business"
                                    >
                                        SME Loans
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        className="text-white/80 hover:text-white text-sm transition-colors"
                                        href="/business"
                                    >
                                        Salary Advance
                                    </Link>
                                </li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="text-accent font-bold uppercase tracking-wider text-xs mb-6">
                                Company
                            </h4>
                            <ul className="space-y-3">
                                <li>
                                    <Link
                                        className="text-white/80 hover:text-white text-sm transition-colors"
                                        href="/company"
                                    >
                                        About Us
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        className="text-white/80 hover:text-white text-sm transition-colors"
                                        href="/company/leadership"
                                    >
                                        Leadership
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        className="text-white/80 hover:text-white text-sm transition-colors"
                                        href="/careers"
                                    >
                                        Careers
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        className="text-white/80 hover:text-white text-sm transition-colors"
                                        href="/blog"
                                    >
                                        Blog & News
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        className="text-white/80 hover:text-white text-sm transition-colors"
                                        href="/media"
                                    >
                                        Media & Events
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        className="text-white/80 hover:text-white text-sm transition-colors"
                                        href="/support"
                                    >
                                        Help Center
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        className="text-white/80 hover:text-white text-sm transition-colors"
                                        href="/legal/code-of-conduct"
                                    >
                                        Code of Conduct
                                    </Link>
                                </li>
                            </ul>
                        </div>
                        <div className="flex flex-col items-center justify-center md:items-end">
                            <div className="w-32 h-32 opacity-80 grayscale hover:grayscale-0 transition-all duration-500 mb-4 relative">
                                {/* Note: Using opacity/grayscale classes on parent for effect */}


                                <Image
                                    src="https://ndic.gov.ng/wp-content/uploads/2020/08/ndic_small_logo-1.png"
                                    alt="NDIC Logo"
                                    fill
                                    className="object-contain"
                                />


                            </div>
                            <p className="text-white/70 text-xs text-center md:text-right">
                                Licensed by the Central Bank of Nigeria
                                <br /> Insured by NDIC
                            </p>
                        </div>
                    </div>
                    <div className="border-t border-white/10 dark:border-border pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                        <p className="text-white/70 text-xs">
                            © 2024 Abia Microfinance Bank. All rights reserved.
                        </p>
                        <div className="flex space-x-6">
                            <Link
                                className="text-white/70 hover:text-white text-xs transition-colors"
                                href="/legal/privacy"
                            >
                                Privacy Policy
                            </Link>
                            <Link
                                className="text-white/70 hover:text-white text-xs transition-colors"
                                href="/legal/terms"
                            >
                                Terms of Service
                            </Link>
                            <Link
                                className="text-white/70 hover:text-white text-xs transition-colors"
                                href="/legal/code-of-conduct"
                            >
                                Whistle Blower
                            </Link>
                        </div>
                    </div>
                </div>
            </footer>
        </>
    );
}
