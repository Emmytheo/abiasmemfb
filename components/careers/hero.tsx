export function CareersHero() {
    return (
        <section className="relative bg-primary dark:bg-black py-20 lg:py-32 pt-32 overflow-hidden">
            <div className="absolute inset-0 z-0">
                <div
                    className="w-full h-full bg-cover bg-center opacity-40 mix-blend-overlay"
                    style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuA7-Bt4UAGQ_Ex7sGViUFefkzwpFniOfJ3-zPks_pgAoeOajqK3oRN-sdGH8FmwmWN7DLRdjWOQaU4sKMzYTPazQ3P-mdAXnmbyDPXS1YxpnlUfbemT1g1XGXfS1NL0qXfcJopeRYkxtCD8_CQMkjH3SjNqe-c5t5CiCd8a3XeCZFjUAUc1qsS1-96h1wWITwjMb1L4pRycr5d0GpezZbBRi0Ui_Ar9fZsEcM-PMb6JxAfpDJXAoAT-QU36DGV5sg6Q9UANqm7SITDP')" }}
                ></div>
                <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary/90 to-transparent dark:from-black dark:via-black/90"></div>
            </div>
            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="max-w-3xl">
                    <span className="inline-block px-3 py-1 mb-6 text-xs font-bold tracking-wider text-accent uppercase bg-accent/10 rounded-full border border-accent/20">
                        Join Our Team
                    </span>
                    <h1 className="text-4xl sm:text-5xl lg:text-7xl font-display font-bold text-white leading-tight mb-6">
                        Build Your Future <br />
                        <span className="text-accent">With Excellence.</span>
                    </h1>
                    <p className="text-lg sm:text-xl text-gray-300 mb-10 max-w-2xl leading-relaxed">
                        Join a team dedicated to financial inclusion and innovation in Abia State. We are looking for visionaries ready to make an impact.
                    </p>
                    <div className="flex flex-wrap gap-4">
                        <a
                            href="#open-positions"
                            className="inline-flex items-center justify-center px-8 py-3.5 text-sm font-bold text-primary bg-accent rounded-lg hover:bg-white transition-all duration-300 shadow-lg shadow-primary/20"
                        >
                            View Open Positions
                        </a>
                        <a
                            href="#benefits"
                            className="inline-flex items-center justify-center px-8 py-3.5 text-sm font-bold text-white border border-white/20 rounded-lg hover:bg-white/10 transition-all duration-300"
                        >
                            Why AbiaSMEMFB?
                        </a>
                    </div>
                </div>
            </div>
        </section>
    );
}
