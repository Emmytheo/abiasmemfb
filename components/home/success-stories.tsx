"use client";

import { Splide, SplideSlide } from '@splidejs/react-splide';
import '@splidejs/react-splide/css';

export function SuccessStories() {
    return (
        <section className="py-24 bg-background">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12">
                    <h2 className="text-accent font-bold tracking-wider uppercase text-sm mb-3">Success Stories</h2>
                </div>
                <div className="relative max-w-5xl mx-auto">
                    <div className="absolute -top-10 -left-10 md:-left-16 text-muted-foreground/20 pointer-events-none select-none">
                        <span className="text-[12rem] leading-none font-serif opacity-50">“</span>
                    </div>

                    <Splide
                        options={{
                            type: 'loop',
                            autoplay: true,
                            interval: 5000,
                            arrows: false,
                            pagination: true,
                            perPage: 1,
                            gap: '2rem',
                        }}
                        className="z-10"
                    >
                        <SplideSlide>
                            <div className="bg-card text-card-foreground border-border">
                                <div className="flex flex-col md:flex-row items-center gap-10 md:gap-16">
                                    <div className="flex-shrink-0 relative">
                                        <div className="w-32 h-32 md:w-48 md:h-48 rounded-full overflow-hidden border-4 border-primary dark:border-accent shadow-lg relative z-10">
                                            <img
                                                alt="Customer Portrait"
                                                className="w-full h-full object-cover"
                                                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCyLlrgEk47n7Vq0ysTxy3TofcKbdmlEucJN5am4TvSis_1iwH5Pj7IUY6RHJl9jHgANO0vu0h6de6Q9SYImRg6bi-v5Usmsh7ShOBIQ8JGCxo_efnmJDpXCWF9UyTiCNqW1HRBUMMj4NK5AhcCzEwyEJUmO4y4JfUBrrq1anikeUAadXryzYc5vUfo1FXS3S9KNke7snnsv_is2ALC8PZ_X9Du60ONHhusEWImOwfox03A3Abn5dV9Pc0UbOxKn0RXfJJsuSTlOAl1"
                                            />
                                        </div>
                                        <div className="absolute inset-0 bg-accent rounded-full blur-xl opacity-20 transform translate-x-2 translate-y-4 -z-10"></div>
                                    </div>
                                    <div className="flex-1 text-center md:text-left">
                                        <blockquote className="mb-8">
                                            <p className="text-xl md:text-3xl font-display font-medium text-primary dark:text-white leading-relaxed italic">
                                                "AbiaSMEMFB provided the capital I needed to expand my textile business when no one else would.
                                                Their personalized approach and flexible repayment terms were a game changer for my company's
                                                growth."
                                            </p>
                                        </blockquote>
                                        <div>
                                            <h4 className="text-xl font-bold text-foreground">Mrs. Nkechi Adebayo</h4>
                                            <p className="text-accent font-semibold text-sm uppercase tracking-wide mt-1">
                                                CEO, Adebayo Textiles Ltd.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </SplideSlide>

                        <SplideSlide>
                            <div className="bg-card text-card-foreground border-border">
                                <div className="flex flex-col md:flex-row items-center gap-10 md:gap-16">
                                    <div className="flex-shrink-0 relative">
                                        <div className="w-32 h-32 md:w-48 md:h-48 rounded-full overflow-hidden border-4 border-primary dark:border-accent shadow-lg relative z-10">
                                            <img
                                                alt="Customer Portrait"
                                                className="w-full h-full object-cover"
                                                src="https://plus.unsplash.com/premium_photo-1689539137236-b68e436248de?q=80&w=2071&auto=format&fit=crop"
                                            />
                                        </div>
                                        <div className="absolute inset-0 bg-accent rounded-full blur-xl opacity-20 transform translate-x-2 translate-y-4 -z-10"></div>
                                    </div>
                                    <div className="flex-1 text-center md:text-left">
                                        <blockquote className="mb-8">
                                            <p className="text-xl md:text-3xl font-display font-medium text-primary dark:text-white leading-relaxed italic">
                                                "The mobile banking app is incredibly user-friendly. I can manage my business finances from anywhere, which gives me great peace of mind."
                                            </p>
                                        </blockquote>
                                        <div>
                                            <h4 className="text-xl font-bold text-foreground">Mr. John Okafor</h4>
                                            <p className="text-accent font-semibold text-sm uppercase tracking-wide mt-1">
                                                Founder, Okafor Electronics
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </SplideSlide>

                        <SplideSlide>
                            <div className="bg-card text-card-foreground border-border">
                                <div className="flex flex-col md:flex-row items-center gap-10 md:gap-16">
                                    <div className="flex-shrink-0 relative">
                                        <div className="w-32 h-32 md:w-48 md:h-48 rounded-full overflow-hidden border-4 border-primary dark:border-accent shadow-lg relative z-10">
                                            <img
                                                alt="Customer Portrait"
                                                className="w-full h-full object-cover"
                                                src="https://images.unsplash.com/photo-1531123897727-8f129e1688ce?q=80&w=1974&auto=format&fit=crop"
                                            />
                                        </div>
                                        <div className="absolute inset-0 bg-accent rounded-full blur-xl opacity-20 transform translate-x-2 translate-y-4 -z-10"></div>
                                    </div>
                                    <div className="flex-1 text-center md:text-left">
                                        <blockquote className="mb-8">
                                            <p className="text-xl md:text-3xl font-display font-medium text-primary dark:text-white leading-relaxed italic">
                                                "Their SME loan rates are the best in the market. The application process was smooth and the disbursement was instant."
                                            </p>
                                        </blockquote>
                                        <div>
                                            <h4 className="text-xl font-bold text-foreground">Ms. Grace Eze</h4>
                                            <p className="text-accent font-semibold text-sm uppercase tracking-wide mt-1">
                                                Director, Grace Farms
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </SplideSlide>
                    </Splide>
                </div>
            </div>
        </section>
    );
}
