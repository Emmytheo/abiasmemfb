import Link from "next/link";
import { ChevronDown, MapPin, Headset, HeartHandshake, Contact } from "lucide-react";

export default function Media() {
    return (
        <>
            <header className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 bg-primary overflow-hidden">
                <div className="absolute inset-0">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary-dark to-background opacity-90"></div>
                    <div className="absolute top-0 right-0 w-96 h-96 bg-accent opacity-5 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
                    <div className="absolute bottom-0 left-0 w-72 h-72 bg-primary-foreground opacity-5 rounded-full blur-3xl transform -translate-x-1/3 translate-y-1/3"></div>
                </div>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
                    <Link className="inline-block text-accent text-xs font-bold tracking-widest uppercase mb-4 hover:underline" href="#">
                        Back to: Sponsorships / Partnerships / Events
                    </Link>
                    <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
                        Our Impact & Events
                    </h1>
                    <p className="max-w-2xl mx-auto text-lg text-blue-100 font-light leading-relaxed">
                        View all past and be the first to know about upcoming AbiaSMEMFB events you can register for and attend.
                        Connecting communities through impactful experiences.
                    </p>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-24">
                {/* Featured Event */}
                <section className="relative rounded-2xl overflow-hidden shadow-2xl bg-secondary">
                    <div className="flex flex-col md:flex-row items-center">
                        <div className="w-full md:w-1/2 h-64 md:h-80 relative">
                            <img
                                alt="Cinematic banner representing BluTV series"
                                className="absolute inset-0 w-full h-full object-cover"
                                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDyhF8UjvWbGT2ppKLPya3AMgR1udQ6eKS5Je4XsR4khK10cjR-9KFx1QByJgwg0sFQx1566UcJ5nWVyvRPEQUDfjxG1Kkk4M8MIlDvKpHwL36Qxnmwm-lsh8cfiCOlRy5m6K6E5OevHnkpVtyil97ehqnDpa6N3dOZ0TUDPBfaJSxEkKUGixQcOTn42GgnPK5g195wBRy6O4OqL7OAyjg33EbSpCUrthtsa6EQVpb5jCHqFLz5-K9ZwQgi4R0-1GXHC5-hYquYAhSn"
                            />
                            <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-transparent md:hidden"></div>
                        </div>
                        <div className="w-full md:w-1/2 p-8 md:p-12 text-center md:text-left">
                            <span className="text-xs font-bold tracking-widest text-muted-foreground uppercase mb-2 block">Original Series</span>
                            <h2 className="text-3xl font-display font-bold text-foreground mb-4">A Heart On The Line</h2>
                            <p className="text-muted-foreground mb-8 max-w-md">Experience the drama and passion in our latest exclusive series. Streaming now on BluuTV.</p>
                            <Link className="inline-block bg-primary text-primary-foreground px-8 py-3 rounded-lg font-semibold shadow-lg hover:bg-opacity-90 transition-all hover:shadow-xl" href="#">
                                Subscribe Now
                            </Link>
                        </div>
                    </div>
                </section>

                {/* Events Grid */}
                <section>
                    <div className="flex items-center justify-between mb-12">
                        <h2 className="text-3xl font-bold text-foreground">Upcoming & Past Events</h2>
                        <div className="h-1 bg-border flex-grow ml-8 rounded-full hidden md:block"></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {/* Event 1 */}
                        <div className="group bg-card text-card-foreground border-border">
                            <div className="h-56 overflow-hidden relative">
                                <img
                                    alt="FinTech Summit"
                                    className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuAPWcGf-QqdG9KUOC-ikWt_hGee4zlg32NDatAHVzBB2RAEOyI75N9YOh_2FctyaitFmjywAnDLohARDhny5dix8odk4mUbdcMXRYkhJgwQzhc8y-68kmQKN5z19gbRkCY-IIcdaasKwpmYDRiPhddqW7-044UtYbWQkl27lcuugduztjeOeF2AsotP1QxebapZjkBVZvWgF0CLS2MEOkvogSgUhqsZIQx4BIyg0q1TG-rYBWkycqTTw54gjJ8Q3WX2dJ1cPmBFayyN"
                                />
                                <div className="absolute top-4 right-4 bg-background/90 backdrop-blur text-xs font-bold px-3 py-1 rounded-full text-foreground">
                                    TECH
                                </div>
                            </div>
                            <div className="p-6">
                                <h3 className="text-xl font-bold text-foreground mb-2">FinTech Summit</h3>
                                <p className="text-sm text-muted-foreground">Exploring the future of financial technology and digital banking solutions.</p>
                            </div>
                        </div>
                        {/* Event 2 */}
                        <div className="group bg-card text-card-foreground border-border">
                            <div className="h-56 overflow-hidden relative">
                                <img
                                    alt="Golf Championship"
                                    className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuBSz4wrv4IHxJ0pLi2nTbte0ohwo_pJHJXtIKIL_vBELcwOg6QzhF6_0voUvfQhrB2dvIdOoDQuuo7tnoZ36Xol2CHITihM8C5BTb6kRDFPSugeYuCt8arvETn4e3AaatPFx-kk3MaVZqd4cXv5JNQ9katF_cnKKkUcxqQQRF1wEnn36gqCp-ZPVpLRL3lqeXm-_yWQSkhLNje0MQyQxNiQjq0NUKeTRDY5idIWyKKl8hLCHok9_bbu5gJV3FP_UXebGNCW4Pfb8nwJ"
                                />
                                <div className="absolute top-4 right-4 bg-background/90 backdrop-blur text-xs font-bold px-3 py-1 rounded-full text-foreground">
                                    SPORTS
                                </div>
                            </div>
                            <div className="p-6">
                                <h3 className="text-xl font-bold text-foreground mb-2">Golf Championship</h3>
                                <p className="text-sm text-muted-foreground">Annual championship bringing together top executives and golf enthusiasts.</p>
                            </div>
                        </div>
                        {/* Event 3 */}
                        <div className="group bg-card text-card-foreground border-border">
                            <div className="h-56 overflow-hidden relative">
                                <img
                                    alt="CAIBA"
                                    className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuD9RoSJQycEuxtXIH097MoXq08FoUKMX300ywH3FiyoLUn7UOxcmbNvzE5fKmSH1nhrLyQfZ9wG-92uZSrddwjr-IhbOb2frrvwhrW30ixXBulTW6zCrX-GFBj1HzSR4jr8wmS134PBQiuof5NtFX4MVYVjDBLIk5ZWjB0KnqufmjPufqTqzZlzdqLWPrfhGasDUrLLbom6JQ76-1UZCfro363s8qFZfxDlPMMcZYItP5bGWl0bhnnYk_qnWFJNDkOjYK8EcQRBz4eN"
                                />
                                <div className="absolute top-4 right-4 bg-background/90 backdrop-blur text-xs font-bold px-3 py-1 rounded-full text-foreground">
                                    CULTURE
                                </div>
                            </div>
                            <div className="p-6">
                                <h3 className="text-xl font-bold text-foreground mb-2">CAIBA</h3>
                                <p className="text-sm text-muted-foreground">Celebrating African International Business Achievements and partnerships.</p>
                            </div>
                        </div>
                        {/* Event 4 */}
                        <div className="group bg-card text-card-foreground border-border">
                            <div className="h-56 overflow-hidden relative">
                                <img
                                    alt="First@Arts"
                                    className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuCWPMwSiq3gJewEE_8Q3lpBjKNuyI0LBHkY0dutXROzBjkkJ7USnqvlxGSBhL8_vzx7jCpTD9l4BNJi7pdz4tiKfb7g8OoLJdIjzF25S_efP5oMlAIqMfYXKu46BKJwI_Y7an93krFnM1TAmxMA4jpE1HeoPRnzuZRf5SSl0A2JgotR_lbitfxFG7VgKqbJewA2x8-uka3-JqcbYYIqm156TrQR8anDvRdfICNii2oe-g19CJn3OYpPtv_SQUUFPVFMEXsIAqwkVpzs"
                                />
                            </div>
                            <div className="p-6">
                                <h3 className="text-xl font-bold text-foreground mb-2">First@Arts</h3>
                                <p className="text-sm text-muted-foreground">Supporting the creative industry and showcasing exceptional artistic talent.</p>
                            </div>
                        </div>
                        {/* Event 5 */}
                        <div className="group bg-card text-card-foreground border-border">
                            <div className="h-56 overflow-hidden relative">
                                <img
                                    alt="LITF"
                                    className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuAXGumN9GDIKLtGuJop8J-wefxaHpZR36-EVMqzUIMLTTV9ARZ1valgrZPe7C8BYOIpaRsozW6XkYVNOd4uKNM2oLtZlWGS_wkeHD--_yniOjBop85DUpT33Vx7NGIiCx1oyi1SfZ_OG8Gq8aCGdJSlWU1DHtGK3ooIsrjex_cdNLpnuem-WtyXbkeMNLQUcJ_25ngmXbQ2lnVYbnmhblE5bsONXIEmv244eDc7A4hPbnVCE5pzvSfS22Gk-8jFqcG0juMHhWx013LI"
                                />
                            </div>
                            <div className="p-6">
                                <h3 className="text-xl font-bold text-foreground mb-2">LITF</h3>
                                <p className="text-sm text-muted-foreground">Lagos International Theatre Festival 2024. A stage for world-class performances.</p>
                            </div>
                        </div>
                        {/* Event 6 */}
                        <div className="group bg-card text-card-foreground border-border">
                            <div className="h-56 overflow-hidden relative">
                                <img
                                    alt="Oxymoron"
                                    className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuAqhlEM-lXLOvNVhp01wWyq8LRPNXMasRCzjsuA3E9EXZYLSKNA9fvh-ob-0N0953rmS-xdqfyLTMdTk-jrmo4mcFEvTG3Al8nBZS6k7CbzBGo8M-VlWsDzJ2ohdMiL7DiCHQhrZmu4GBSJ36FIyBuqnDYA8pSNwueoDf3FVstupBwYESU8r5Zjup2Vs3U-EB_H_thJyBzUp1b-4_LsoTSYGyUcv0Pn1lGSSQP_JEh-YMxS2p5kN0SqVLibkNBzNNXEPJhkqSSktMMP"
                                />
                            </div>
                            <div className="p-6">
                                <h3 className="text-xl font-bold text-foreground mb-2">Oxymoron</h3>
                                <p className="text-sm text-muted-foreground">The Oxymoron of Kennyblaq. A night of music, comedy, and pure entertainment.</p>
                            </div>
                        </div>
                    </div>
                    <div className="mt-12 text-center">
                        <button className="inline-flex items-center space-x-2 text-foreground font-semibold hover:text-accent transition-colors">
                            <span>Load More Events</span>
                            <ChevronDown />
                        </button>
                    </div>
                </section>

                {/* CTA Section */}
                <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Link className="group relative overflow-hidden rounded-2xl bg-primary p-8 md:p-12 transition-all hover:shadow-2xl hover:shadow-primary/30" href="#">
                        <div className="relative z-10 flex items-center space-x-6">
                            <div className="p-4 bg-white/10 rounded-xl group-hover:bg-accent transition-colors duration-300">
                                <MapPin className="text-white" size={32} />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-white mb-1">Find A Branch</h3>
                                <p className="text-blue-200 text-sm group-hover:text-white transition-colors">Locate the nearest service point to you</p>
                            </div>
                        </div>
                        <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/5 rounded-full group-hover:scale-150 transition-transform duration-700 ease-in-out"></div>
                    </Link>
                    <Link className="group relative overflow-hidden rounded-2xl bg-primary p-8 md:p-12 transition-all hover:shadow-2xl hover:shadow-primary/30" href="#">
                        <div className="relative z-10 flex items-center space-x-6">
                            <div className="p-4 bg-white/10 rounded-xl group-hover:bg-accent transition-colors duration-300">
                                <Headset className="text-white" size={32} />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-white mb-1">Contact SPEC</h3>
                                <p className="text-blue-200 text-sm group-hover:text-white transition-colors">Dedicated support for premium customers</p>
                            </div>
                        </div>
                        <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/5 rounded-full group-hover:scale-150 transition-transform duration-700 ease-in-out"></div>
                    </Link>
                </section>

                {/* See Also */}
                <section>
                    <div className="text-center mb-12">
                        <span className="text-accent font-bold tracking-widest text-sm uppercase">Explore More</span>
                        <h2 className="text-3xl font-bold text-foreground mt-2">See Also</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="group relative h-80 rounded-2xl overflow-hidden cursor-pointer">
                            <img
                                alt="Sponsorships"
                                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBkSLoYOHjCToy_eGmI2aPZd1scvDQ6NPb_Bj1IVnpSAuiqtNS6fbIGMD8b3BG4Uzor34UA3_m2z7ahpIfihYHs8Kxusn8VheihQDA5IQ5FPmIjhTU1qXrLP5Rp2z_673VaNUh3Wv0uu0pWSG8th6Kx3Pe3hP9Wcmb8SefXtkwR6nST8vtvMTkvRGUP_FHAMwx0Rg__paGDpD2APLyILQ3WbH8rr-94KLltY9HdEOMt9NN3L4g50NMX5cNgnrq064qZH8GfU_rCeTjx"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                            <div className="absolute bottom-0 left-0 w-full p-8 text-center transform translate-y-2 group-hover:translate-y-0 transition-transform">
                                <h3 className="text-2xl font-bold text-white mb-2">Sponsorships</h3>
                                <p className="text-gray-300 text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300">Driving impact through strategic alliances</p>
                            </div>
                        </div>
                        <div className="group relative h-80 rounded-2xl overflow-hidden cursor-pointer">
                            <img
                                alt="Contact CR&S"
                                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDprv2zo25QNYGsMoS7jQouqpN4A03NQVkg-_JMHWwwQDbuAV8ubR2_Db6KeoNgyWvtjGZQ_5ONYOZQttQTVwXNOS8vxbdJBKbizwdwlgAOwaPvUm1oy5iJ4McTlKaFmsF22TZAcbC37SSbWcNv5xtj9OKL-LlnTwqCauLcmw2VUvFiMDqv3FCpNWVxAlS6Gdt9agGZufaWd2FGjoMe2Jqv0xS8v7EwrnsasvMS7rplzMHuKokqvp7xu7x25h06K3uFtB5NG8jd1Ha1"
                            />
                            <div className="absolute inset-0 bg-primary/90 opacity-90 group-hover:opacity-80 transition-opacity"></div>
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                                <HeartHandshake size={64} className="mb-4 text-accent" />
                                <h3 className="text-2xl font-bold">Contact CR&S</h3>
                                <span className="mt-4 px-6 py-2 border border-white/30 rounded-full text-sm group-hover:bg-white group-hover:text-primary transition-all">Get in Touch</span>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
        </>
    );
}
