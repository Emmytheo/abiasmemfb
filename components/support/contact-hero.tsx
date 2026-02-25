import { ArrowRight } from "lucide-react";

export function ContactHero() {
    return (
        <div className="relative w-full bg-primary overflow-hidden">
            {/* Abstract Navy Texture/Pattern */}
            <div
                className="absolute inset-0 opacity-20"
                style={{ backgroundImage: "radial-gradient(#334155 1px, transparent 1px)", backgroundSize: "32px 32px" }}
            ></div>
            <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary/90 to-transparent"></div>

            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28 flex flex-col justify-center items-start">
                <span className="text-accent font-bold tracking-wider text-sm mb-4 uppercase">Customer Care</span>
                <h1 className="text-white text-4xl lg:text-6xl font-display font-bold leading-tight tracking-tight max-w-3xl mb-6">
                    Premier Support & <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-[#fde047]">Inquiries</span>
                </h1>
                <p className="text-slate-300 text-lg lg:text-xl max-w-2xl font-light leading-relaxed mb-10">
                    Our dedicated concierge team is available around the clock to assist you with your premium banking needs. Experience support redefined.
                </p>
                <button className="h-12 px-8 rounded-lg bg-accent hover:bg-accent-dark text-primary text-base font-bold transition-colors shadow-lg shadow-primary/20 flex items-center gap-2 group">
                    <span>View Frequently Asked Questions</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
            </div>
        </div>
    );
}
