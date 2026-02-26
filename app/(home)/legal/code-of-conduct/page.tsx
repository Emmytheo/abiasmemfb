"use client";

import { useState } from "react";
import { Plus, Minus, Check } from "lucide-react";
import { LegalSeeAlso } from "@/components/legal/see-also";

export default function CodeOfConduct() {
    const [openIndex, setOpenIndex] = useState<number | null>(null);

    const toggleAccordion = (index: number) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    const accordions = [
        { title: "Code of Conduct Details", content: "Detailed code of conduct policies will be provided here." },
        { title: "Human Rights Policy", content: "Our commitment to human rights and associated policies will be outlined here." },
        { title: "Other Laws", content: "Compliance with other relevant laws and regulations." },
        { title: "Communication and Audit", content: "Procedures for communication and auditing of third-party compliance." },
        { title: "Framework for Review of Adherence", content: "The framework used to review and ensure adherence to this code." },
        { title: "Data Processing Consent Statement", content: "Statement regarding consent for data processing activities." }
    ];

    return (
        <>
            <header className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 bg-primary overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary-dark to-background opacity-90"></div>
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-white mb-6">
                        Third-Party Code of Conduct
                    </h1>
                    <p className="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed font-light">
                        AbiaSMEMFB is committed to working with third-party vendors to promote responsible practices in general and throughout our operations.
                    </p>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 -mt-10 relative z-20">
                <div className="bg-card text-card-foreground shadow-xl rounded-2xl p-8 md:p-12 mb-12 border border-border">
                    <h2 className="font-display text-3xl font-bold text-primary dark:text-white mb-8 text-center">Code of Conduct</h2>
                    <div className="prose prose-lg prose-slate dark:prose-invert max-w-none">
                        <p className="mb-6">
                            AbiaSMEMFB is committed to conducting business with the utmost level of integrity, transparency, and compliance with legal, ethical and regulatory standards. Our reputation and success as an organization is built upon this foundation as we strive to maintain our position as a leading organization both locally and internationally.
                        </p>
                        <p className="mb-6">
                            AbiaSMEMFB is committed to working with third-party vendors to promote responsible practices in general and throughout our operations. The Bank aims to ensure that all third-party vendors/ suppliers acknowledge its values and share its commitment to conduct business in an ethical, legal and socially responsible manner.
                        </p>
                        <div className="bg-blue-50 dark:bg-primary/30 border-l-4 border-accent p-6 my-8 rounded-r-lg">
                            <p className="mb-2 font-medium text-primary dark:text-white">Whistleblowing Hotline</p>
                            <p className="text-sm">
                                For reporting misconduct anonymously, call the hotline <strong className="text-primary dark:text-accent">0812716677, 09070366415</strong> or send an email to <a className="text-accent hover:underline" href="mailto:whistleblowing@AbiaSMEMFB.com">whistleblowing@AbiaSMEMFB.com</a>.
                            </p>
                        </div>
                        <p>
                            This Code of Conduct applies to all entities with whom AbiaSMEMFB does business with; these include suppliers, contractors, sub-contractors, consultants, service providers, agents, sub-agent or sub-representative and joint venture partners but for easy reference will be interchangeably called "Third Party Vendors", Third Parties" or "Suppliers" in this document.
                        </p>
                    </div>
                </div>

                {/* Accordions */}
                <div className="space-y-4 mb-16">
                    {accordions.map((item, index) => (
                        <div key={index} className="group bg-card text-card-foreground rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden border border-border">
                            <button
                                onClick={() => toggleAccordion(index)}
                                className="w-full px-6 py-5 flex justify-between items-center text-left focus:outline-none"
                            >
                                <span className="text-lg font-semibold text-primary dark:text-white group-hover:text-accent transition-colors">
                                    {item.title}
                                </span>
                                {openIndex === index ? (
                                    <Minus className="text-accent transition-colors" />
                                ) : (
                                    <Plus className="text-slate-400 group-hover:text-accent transition-colors" />
                                )}
                            </button>
                            {openIndex === index && (
                                <div className="px-6 pb-6 pt-0 text-muted-foreground animate-fade-in-up">
                                    <p>{item.content}</p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Acknowledgement Form */}
                <div className="bg-card text-card-foreground shadow-2xl rounded-2xl overflow-hidden border border-border relative mb-16">
                    <div className="h-2 bg-gradient-to-r from-primary via-accent to-primary"></div>
                    <div className="p-8 md:p-12">
                        <div className="text-center mb-10">
                            <h2 className="font-display text-3xl font-bold text-primary dark:text-white mb-4">
                                Acknowledgement of Compliance
                            </h2>
                            <div className="w-16 h-1 bg-accent mx-auto rounded-full"></div>
                        </div>
                        <div className="bg-gray-50 dark:bg-slate-800/50 rounded-xl p-6 md:p-8 mb-10 text-sm md:text-base leading-relaxed border border-border">
                            <p className="mb-4 font-medium text-primary dark:text-white">
                                The undersigned has reviewed AbiaSMEMFB's Third Party Code of Conduct and understands that as a Third Party or as a sub-agent or sub-representative of such Third Party, commits to:
                            </p>
                            <ul className="list-disc pl-5 space-y-2 marker:text-accent text-muted-foreground">
                                <li>Adhere to the AbiaSMEMFB's policies and standards of conduct included in the Third Party Code of Conduct.</li>
                                <li>Seek guidance if the undersigned is ever in doubt as to the proper course of conduct.</li>
                                <li>Use one of the options AbiaSMEMFB has made available to report any activities that the undersigned believes may be inconsistent with the law, or AbiaSMEMFB's Standards or policies.</li>
                                <li>Ensure that any and all directors, managers, officers, employees, agents and representatives of the undersigned that provide services to Abia Microfinance Bank Limited have read and understood the AbiaSMEMFB's Third Party Code of Conduct.</li>
                            </ul>
                        </div>
                        <form className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="relative">
                                    <label className="block text-sm font-medium text-muted-foreground mb-1" htmlFor="entity">
                                        Name of Entity/Organisation
                                    </label>
                                    <input
                                        className="block w-full rounded-lg border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-white shadow-sm focus:border-accent focus:ring-accent sm:text-sm py-3 px-4 transition-colors"
                                        id="entity" placeholder="e.g. Acme Corp Ltd." type="text"
                                    />
                                </div>
                                <div className="relative">
                                    <label className="block text-sm font-medium text-muted-foreground mb-1" htmlFor="rep">
                                        Name of Authorised Representative
                                    </label>
                                    <input
                                        className="block w-full rounded-lg border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-white shadow-sm focus:border-accent focus:ring-accent sm:text-sm py-3 px-4 transition-colors"
                                        id="rep" placeholder="Full Name" type="text"
                                    />
                                </div>
                                <div className="relative">
                                    <label className="block text-sm font-medium text-muted-foreground mb-1" htmlFor="title">
                                        Title/Position
                                    </label>
                                    <input
                                        className="block w-full rounded-lg border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-white shadow-sm focus:border-accent focus:ring-accent sm:text-sm py-3 px-4 transition-colors"
                                        id="title" placeholder="e.g. Director" type="text"
                                    />
                                </div>
                                <div className="relative">
                                    <label className="block text-sm font-medium text-muted-foreground mb-1" htmlFor="email">
                                        Email Address
                                    </label>
                                    <input
                                        className="block w-full rounded-lg border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-white shadow-sm focus:border-accent focus:ring-accent sm:text-sm py-3 px-4 transition-colors"
                                        id="email" placeholder="email@company.com" type="email"
                                    />
                                </div>
                            </div>
                            <div className="pt-6 space-y-4">
                                <div className="flex items-start">
                                    <div className="flex items-center h-5">
                                        <input
                                            className="focus:ring-accent h-5 w-5 text-accent border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800"
                                            id="terms1" name="terms1" type="checkbox"
                                        />
                                    </div>
                                    <div className="ml-3 text-sm">
                                        <label className="font-medium text-gray-700 dark:text-gray-300" htmlFor="terms1">
                                            I acknowledge that I have read, understood and agree to the Data Processing Consent Statement. I acknowledge that I have read, understood and agree to all the terms and conditions above.
                                        </label>
                                    </div>
                                </div>
                                <div className="flex items-start">
                                    <div className="flex items-center h-5">
                                        <input
                                            className="focus:ring-accent h-5 w-5 text-accent border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800"
                                            id="terms2" name="terms2" type="checkbox"
                                        />
                                    </div>
                                    <div className="ml-3 text-sm">
                                        <label className="font-medium text-gray-700 dark:text-gray-300" htmlFor="terms2">
                                            I acknowledge that I have read, understood and agree to the <a className="text-accent hover:underline font-bold" href="/legal/cookies">Privacy Policy</a>.
                                        </label>
                                    </div>
                                </div>
                            </div>
                            <div className="pt-8 text-center">
                                <button
                                    className="w-full md:w-auto md:min-w-[240px] inline-flex justify-center items-center py-3.5 px-6 border border-transparent shadow-md text-base font-bold rounded-lg text-white bg-accent hover:bg-accent-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent transition-all duration-300 uppercase tracking-wide"
                                    type="submit"
                                >
                                    Submit Acknowledgement
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                <LegalSeeAlso />
            </main>
        </>
    );
}
