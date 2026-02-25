"use client";

import { Send } from "lucide-react";

export function ContactForm() {
    return (
        <div className="lg:col-span-7">
            <div className="bg-card border-border rounded-2xl p-8 lg:p-10 shadow-lg">
                <div className="mb-8">
                    <h3 className="text-foreground text-2xl font-bold mb-2">Send a Secure Message</h3>
                    <p className="text-muted-foreground text-sm">Your details are encrypted and secure.</p>
                </div>
                <form className="flex flex-col gap-6" onSubmit={(e) => e.preventDefault()}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <label className="flex flex-col gap-2">
                            <span className="text-foreground text-sm font-semibold">Full Name</span>
                            <input
                                className="w-full h-12 px-4 rounded-lg bg-background border-border text-foreground placeholder:text-muted-foreground"
                                placeholder="John Doe"
                                type="text"
                            />
                        </label>
                        <label className="flex flex-col gap-2">
                            <span className="text-foreground text-sm font-semibold">Email Address</span>
                            <input
                                className="w-full h-12 px-4 rounded-lg bg-background border-border text-foreground placeholder:text-muted-foreground"
                                placeholder="john@company.com"
                                type="email"
                            />
                        </label>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <label className="flex flex-col gap-2">
                            <span className="text-foreground text-sm font-semibold">
                                Account Number <span className="text-accent font-normal">(Optional)</span>
                            </span>
                            <input
                                className="w-full h-12 px-4 rounded-lg bg-background border-border text-foreground placeholder:text-muted-foreground"
                                placeholder="10 Digits"
                                type="text"
                            />
                        </label>
                        <label className="flex flex-col gap-2">
                            <span className="text-foreground text-sm font-semibold">Subject</span>
                            <select className="w-full h-12 px-4 rounded-lg bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-foreground">
                                <option>General Inquiry</option>
                                <option>Loan Application</option>
                                <option>Investment Advice</option>
                                <option>Technical Support</option>
                            </select>
                        </label>
                    </div>
                    <label className="flex flex-col gap-2">
                        <span className="text-foreground text-sm font-semibold">Message</span>
                        <textarea
                            className="w-full h-32 p-4 rounded-lg bg-background border-border text-foreground placeholder:text-muted-foreground resize-none"
                            placeholder="How can we help you today?"
                        ></textarea>
                    </label>
                    <div className="flex items-center gap-2 mb-2">
                        <input
                            className="w-4 h-4 rounded border-border text-accent focus:ring-primary"
                            id="privacy"
                            type="checkbox"
                        />
                        <label className="text-sm text-muted-foreground" htmlFor="privacy">
                            I agree to the processing of my personal data.
                        </label>
                    </div>
                    <button
                        className="h-14 w-full rounded-lg bg-accent hover:bg-accent-dark text-primary text-base font-bold transition-all shadow-md transform active:scale-[0.99] flex items-center justify-center gap-3"
                        type="submit"
                    >
                        <span>Send Message</span>
                        <Send className="w-5 h-5" />
                    </button>
                </form>
            </div>
        </div>
    );
}
