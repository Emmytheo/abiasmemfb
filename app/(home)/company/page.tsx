import Link from "next/link";
import { CheckCircle, ArrowRight, Eye, Rocket, HeartHandshake, Phone, Headset } from "lucide-react";
import { Newsletter } from "@/components/newsletter";

export default function Company() {
    return (
        <>
            <section className="relative flex items-center bg-gray-900 overflow-hidden">
                <div className="absolute inset-0 z-0">
                    <img
                        alt="Executive Meeting Background"
                        className="w-full h-full object-cover opacity-60 dark:opacity-60 mix-blend-multiply"
                        src="/images/abia-tower.jpg"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/90 to-primary/80"></div>
                </div>
                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-24 md:pt-32 md:pb-24 z-10 w-full">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                        <div className="space-y-8">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/50 border border-secondary text-secondary-foreground text-xs font-semibold tracking-wider uppercase backdrop-blur-sm">
                                <span className="w-2 h-2 rounded-full bg-accent"></span>
                                Visionary Leadership
                            </div>
                            <h1 className="text-4xl md:text-6xl font-display font-bold text-white leading-tight">
                                The Mandate: <br />
                                <span className="text-primary-foreground/80 italic font-light">Fueling Economic Growth</span>
                            </h1>
                            <div className="prose prose-lg prose-invert text-primary-foreground/90 border-l-4 border-accent pl-6">
                                <p>
                                    Governor Alex Otti’s administration aims to support Abia MSMEs' growth through strategic positioning,
                                    infrastructure development, access to finance, and digital transformation.
                                </p>
                                <p className="font-medium text-white pt-2">
                                    The goal is to achieve $1 billion/N1.7 trillion annual growth by 2028, creating jobs and driving
                                    economic prosperity.
                                </p>
                            </div>
                        </div>
                        <div className="relative lg:h-full flex items-center justify-center lg:justify-end">
                            <div className="relative w-full max-w-md aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl border-4 border-white/10 group">
                                <img
                                    alt="Leadership Portrait"
                                    className="w-full h-full object-cover transform transition-transform duration-700 group-hover:scale-105"
                                    src="/images/otti.png"
                                />
                                <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
                                    <p className="text-white font-display text-xl">H.E. Alex Otti</p>
                                    <p className="text-white/80 text-sm">Governor, Abia State</p>
                                </div>
                            </div>
                            <div className="absolute -z-10 top-10 -right-10 w-64 h-64 bg-accent/20 rounded-full blur-3xl"></div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="py-20 bg-background pattern-dots">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <h2 className="text-accent font-semibold tracking-wide uppercase text-sm mb-3">About Us</h2>
                        <h3 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-6">
                            Powering Dreams with Digital Banking Solutions
                        </h3>
                        <p className="text-lg text-muted-foreground">
                            Abia State Microfinance Bank Limited (AbiaSMEMFB) integrates entrepreneurs and SMEs within Abia State into a
                            common platform, providing access to funds at single-digit interest rates.
                        </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
                        <div className="bg-card text-card-foreground p-8 rounded-2xl shadow-xl hover:-translate-y-1 transition-transform duration-300">
                            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-6">
                                <Eye size={24} />
                            </div>
                            <h4 className="text-xl font-bold text-foreground mb-3">Our Vision</h4>
                            <p className="text-muted-foreground leading-relaxed">
                                To be a model in people empowerment and wealth creation, setting the standard for microfinance excellence.
                            </p>
                        </div>
                        <div className="bg-card text-card-foreground p-8 rounded-2xl shadow-xl hover:-translate-y-1 transition-transform duration-300 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-accent/5 rounded-bl-full transition-transform group-hover:scale-150 duration-500"></div>
                            <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center text-accent mb-6 relative z-10">
                                <Rocket size={24} />
                            </div>
                            <h4 className="text-xl font-bold text-foreground mb-3 relative z-10">Our Mission</h4>
                            <p className="text-muted-foreground leading-relaxed relative z-10">
                                To provide banking services in an efficient manner in order to add value to customers and stakeholders.
                            </p>
                        </div>
                        <div className="bg-card text-card-foreground p-8 rounded-2xl shadow-xl hover:-translate-y-1 transition-transform duration-300">
                            <div className="w-12 h-12 bg-secondary/10 rounded-xl flex items-center justify-center text-secondary mb-6">
                                <HeartHandshake size={24} />
                            </div>
                            <h4 className="text-xl font-bold text-foreground mb-3">Who We Are</h4>
                            <p className="text-muted-foreground leading-relaxed">
                                A CBN licensed unit microfinance bank established to provide comprehensive banking services integrating state economies.
                            </p>
                        </div>
                    </div>
                    <div className="bg-primary rounded-3xl p-8 md:p-12 text-primary-foreground relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
                        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-primary-foreground/10 rounded-full blur-3xl"></div>
                        <div className="max-w-2xl relative z-10">
                            <h3 className="text-2xl md:text-3xl font-display font-bold mb-4">Join the AbiaSMEMFB Family</h3>
                            <p className="text-primary-foreground/90 text-lg mb-6">
                                Talent, imagination, and a can-achieve attitude will take you places here. Join us to see more of what's possible.
                            </p>
                            <div className="flex flex-wrap gap-4 text-sm font-medium text-primary-foreground/80">
                                <span className="flex items-center gap-1">
                                    <CheckCircle size={16} /> Innovative Environment
                                </span>
                                <span className="flex items-center gap-1">
                                    <CheckCircle size={16} /> Career Growth
                                </span>
                                <span className="flex items-center gap-1">
                                    <CheckCircle size={16} /> Competitive Benefits
                                </span>
                            </div>
                        </div>
                        <div className="flex-shrink-0 relative z-10">
                            <Link
                                className="inline-flex items-center justify-center px-8 py-3 bg-white text-primary font-bold rounded-lg shadow-lg hover:bg-gray-50 transition-colors"
                                href="/careers"
                            >
                                View Openings
                                <ArrowRight className="ml-2" size={16} />
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            <section className="py-20 bg-background border-y border-border">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
                        <div className="relative order-2 lg:order-1">
                            <div className="relative h-96 lg:h-full min-h-[500px] rounded-3xl overflow-hidden shadow-2xl">
                                <img
                                    alt="AbiaSMEMFB Headquarters"
                                    className="absolute inset-0 w-full h-full object-cover"
                                    src="/images/elephant-1.png"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex flex-col justify-end p-8">
                                    <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/20">
                                        <h4 className="text-white font-bold text-xl mb-2">Abia Microfinance Bank Ltd.</h4>
                                        <p className="text-white/80 text-sm flex items-start gap-2">
                                            # 00, Avenue Street, Town City, Abia State, Nigeria
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="absolute -top-6 -left-6 w-24 h-24 border-t-4 border-l-4 border-accent rounded-tl-3xl"></div>
                        </div>
                        <div className="flex flex-col justify-center order-1 lg:order-2 space-y-10">
                            <div>
                                <h2 className="text-accent font-semibold tracking-wide uppercase text-sm mb-3">Get in Touch</h2>
                                <h3 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-6">
                                    We'd love to hear from you
                                </h3>
                                <p className="text-lg text-muted-foreground">
                                    Whether you have a question about features, pricing, need a demo, or anything else, our team is ready to answer all your questions.
                                </p>
                            </div>
                            <div className="space-y-6">
                                <div className="flex items-center gap-6 p-4 rounded-xl hover:bg-muted/50 transition-colors">
                                    <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center text-primary flex-shrink-0">
                                        <Phone className="text-primary text-2xl" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground font-medium">Contact No</p>
                                        <p className="text-xl font-bold text-foreground">0700 444 1 444</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-6 p-4 rounded-xl hover:bg-muted/50 transition-colors">
                                    <div className="w-14 h-14 bg-accent/10 rounded-full flex items-center justify-center text-accent flex-shrink-0">
                                        <Headset className="text-accent text-2xl" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground font-medium">Customer Care Line</p>
                                        <p className="text-xl font-bold text-foreground">0700 444 0 444</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
}
