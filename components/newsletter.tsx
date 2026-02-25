import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function Newsletter() {
    return (
        <section className="py-20 bg-background relative overflow-hidden text-foreground">
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-primary rounded-full opacity-5 blur-3xl"></div>
            <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 bg-primary rounded-full opacity-5 blur-3xl"></div>
            <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
                <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-6">Stay Ahead of the Curve</h2>
                <p className="text-muted-foreground mb-10 text-lg">
                    Subscribe to our newsletter for exclusive financial insights, product updates, and market trends.
                </p>
                <form className="flex flex-col sm:flex-row gap-4 justify-center max-w-lg mx-auto">
                    <input
                        className="w-full px-6 py-4 rounded-full bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent backdrop-blur-sm"
                        placeholder="Your email address"
                        type="email"
                    />
                    <button
                        className="px-8 py-4 rounded-full bg-primary text-primary-foreground font-bold hover:bg-accent hover:text-accent-foreground transition-colors shadow-lg"
                        type="button"
                    >
                        Subscribe
                    </button>
                </form>
            </div>
        </section>
    );
}
