import { MapPin, Clock, ArrowRight } from "lucide-react";

export function EventsSection() {
    return (
        <section className="w-full bg-background py-24 px-6 lg:px-12 transition-colors duration-300">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-16">
                    <span className="text-accent text-xs font-bold uppercase tracking-widest mb-3 block">Events & Training</span>
                    <h2 className="text-3xl md:text-5xl text-foreground font-display">Upcoming Workshops</h2>
                </div>

                <div className="flex flex-col gap-4 max-w-4xl mx-auto">
                    {/* Event Card 1 */}
                    <div className="group relative bg-card border border-border hover:border-accent/50 p-6 md:p-8 rounded-xl transition-all duration-300 hover:shadow-lg">
                        <div className="flex flex-col md:flex-row items-center justify-between gap-6 md:gap-10">
                            <div className="flex flex-col md:flex-row items-center md:items-start text-center md:text-left gap-6 md:gap-8 w-full">
                                <div className="flex flex-col items-center justify-center w-20 h-20 md:w-24 md:h-24 bg-background border border-border rounded-lg shrink-0 group-hover:scale-105 transition-transform duration-300 shadow-sm">
                                    <span className="text-xs text-accent font-bold uppercase tracking-widest mb-1">OCT</span>
                                    <span className="text-3xl text-foreground font-serif font-medium">12</span>
                                </div>
                                <div className="flex flex-col justify-center">
                                    <h3 className="text-xl md:text-2xl text-foreground font-display group-hover:text-accent transition-colors mb-2">
                                        SME Financial Literacy Masterclass
                                    </h3>
                                    <div className="flex flex-wrap justify-center md:justify-start gap-4 text-sm text-muted-foreground">
                                        <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> Abia Innovation Hub</span>
                                        <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> 10:00 AM - 2:00 PM</span>
                                    </div>
                                </div>
                            </div>
                            <button className="w-full md:w-auto px-8 py-3 bg-accent text-primary font-bold text-sm uppercase tracking-wide rounded hover:bg-accent-dark transition-all shadow-md whitespace-nowrap">
                                Reserve Seat
                            </button>
                        </div>
                    </div>

                    {/* Event Card 2 */}
                    <div className="group relative bg-card border border-border hover:border-accent/50 p-6 md:p-8 rounded-xl transition-all duration-300 hover:shadow-lg">
                        <div className="flex flex-col md:flex-row items-center justify-between gap-6 md:gap-10">
                            <div className="flex flex-col md:flex-row items-center md:items-start text-center md:text-left gap-6 md:gap-8 w-full">
                                <div className="flex flex-col items-center justify-center w-20 h-20 md:w-24 md:h-24 bg-background border border-border rounded-lg shrink-0 group-hover:scale-105 transition-transform duration-300 shadow-sm">
                                    <span className="text-xs text-accent font-bold uppercase tracking-widest mb-1">NOV</span>
                                    <span className="text-3xl text-foreground font-serif font-medium">05</span>
                                </div>
                                <div className="flex flex-col justify-center">
                                    <h3 className="text-xl md:text-2xl text-foreground font-display group-hover:text-accent transition-colors mb-2">
                                        Export Readiness Seminar
                                    </h3>
                                    <div className="flex flex-wrap justify-center md:justify-start gap-4 text-sm text-muted-foreground">
                                        <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> Aba Chamber of Commerce</span>
                                        <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> 09:00 AM - 1:00 PM</span>
                                    </div>
                                </div>
                            </div>
                            <button className="w-full md:w-auto px-8 py-3 bg-accent text-primary font-bold text-sm uppercase tracking-wide rounded hover:bg-accent-dark transition-all shadow-md whitespace-nowrap">
                                Reserve Seat
                            </button>
                        </div>
                    </div>
                </div>

                <div className="text-center mt-12">
                    <a className="inline-flex items-center gap-2 text-muted-foreground hover:text-accent transition-colors border-b border-transparent hover:border-accent pb-1 cursor-pointer">
                        View Full Calendar <ArrowRight className="w-4 h-4" />
                    </a>
                </div>
            </div>
        </section>
    );
}
