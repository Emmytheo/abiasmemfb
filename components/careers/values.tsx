import { Lightbulb, ShieldCheck, TrendingUp, Users } from "lucide-react";

const benefits = [
    {
        id: 1,
        title: "Innovation",
        description: "We embrace new ideas to solve financial challenges and stay ahead of the curve.",
        icon: Lightbulb,
    },
    {
        id: 2,
        title: "Integrity",
        description: "Upholding the highest standards of trust, transparency, and ethical conduct.",
        icon: ShieldCheck,
    },
    {
        id: 3,
        title: "Growth",
        description: "Continuous learning opportunities and clear paths to advance your career.",
        icon: TrendingUp,
    },
    {
        id: 4,
        title: "Community",
        description: "Making a tangible difference in the lives of Abians through impactful service.",
        icon: Users,
    },
];

export function CareersValues() {
    return (
        <section className="py-24 bg-white dark:bg-card-dark transition-colors duration-300" id="benefits">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col md:flex-row gap-12 md:items-end justify-between mb-16">
                    <div className="max-w-2xl">
                        <h2 className="text-3xl md:text-4xl font-display font-bold text-gray-900 dark:text-white mb-4">
                            Our Culture & Benefits
                        </h2>
                        <p className="text-lg text-gray-600 dark:text-gray-300">
                            We believe in fostering an environment where innovation thrives and every employee is empowered to grow both personally and professionally.
                        </p>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {benefits.map((benefit) => (
                        <div
                            key={benefit.id}
                            className="group p-8 rounded-xl bg-white/60 dark:bg-white/5 backdrop-blur-md border border-gray-200 dark:border-white/10 hover:border-accent/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1"
                        >
                            <div className="w-12 h-12 flex items-center justify-center rounded-lg bg-white dark:bg-white/10 text-accent mb-6 shadow-sm group-hover:scale-110 transition-transform">
                                <benefit.icon className="w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{benefit.title}</h3>
                            <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                                {benefit.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
