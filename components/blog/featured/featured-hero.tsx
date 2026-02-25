import { ArrowRight } from "lucide-react";

export function FeaturedHero() {
    return (
        <section
            className="relative w-full h-[90vh] min-h-[600px] flex items-end pb-20 px-6 lg:px-12 bg-cover bg-center bg-no-repeat group"
            style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuDpXbNchngtGc_podGmTen9OMletT5qqE4ldxSy7Z38BhJUGrtPk0GWFu0lHTIQDY5YRvlZcHBBVi2u7oynM2tCGZyJE6J3eQV432uwooB7psVPrifUabGPRULr0DPv6Wi7RNtORI1x1gncDjHLF7eSK3QlGsmy_tnim4PRAcpCOBk6026x9M081REIs2_t32n9WNS7biUPrYYChOTDQBHTq_n5AAvnbVnLtkgjms5ELFTTzUi-gf-8lxs_1u7DjDO1AHvaExsVA1vs')" }}
        >
            <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/60 to-black"></div>

            <div className="relative w-full max-w-7xl mx-auto flex flex-col md:flex-row items-end justify-between gap-10">
                <div className="max-w-3xl flex flex-col gap-6">
                    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-accent/30 bg-accent/10 text-accent text-xs font-bold uppercase tracking-widest backdrop-blur-sm w-fit">
                        Featured Story
                    </span>
                    <h1 className="text-white text-5xl md:text-7xl lg:text-8xl font-display font-medium leading-[0.95] tracking-tight">
                        Building <span className="text-accent italic">Abia’s Future</span>, One Story at a Time.
                    </h1>
                    <p className="text-gray-300 text-lg md:text-xl font-light max-w-xl leading-relaxed">
                        Exclusive insights into wealth management and local enterprise in the heart of the east.
                    </p>
                    <div className="pt-4">
                        <button className="flex items-center gap-3 text-white group-hover:gap-5 transition-all duration-300">
                            <span className="text-lg font-medium border-b border-accent pb-1">Read The Feature</span>
                            <ArrowRight className="text-accent w-6 h-6" />
                        </button>
                    </div>
                </div>

                <div className="hidden md:flex flex-col gap-2 border-l border-white/20 pl-6 pb-2">
                    <span className="text-accent text-3xl font-serif italic">12k+</span>
                    <span className="text-gray-400 text-sm uppercase tracking-wider">Readers this week</span>
                </div>
            </div>
        </section>
    );
}
