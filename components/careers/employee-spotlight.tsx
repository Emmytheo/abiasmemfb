import { Quote } from "lucide-react";

export function EmployeeSpotlight() {
    return (
        <section className="py-20 bg-background border-y border-border transition-colors duration-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="bg-primary dark:bg-card rounded-2xl overflow-hidden shadow-2xl">
                    <div className="flex flex-col lg:flex-row">
                        <div
                            className="lg:w-1/2 min-h-[400px] relative bg-cover bg-center"
                            style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuD5YwoMWa6b09LfTLvdQGnvVd_56GkEmcjZzJuUjSDvR92Vg9k7pUpYISJHWyq5jC7xChScvi45YJEo4N9YwwewkWfYyrqKIR9_wkt25ZdByg4-Xyc2iiYN4rXwLXMWz-qGCEcGF4vmoAzlYp5hxEsUvOoH-oE-0Ch-z-c2PZ8_kKLtSG3XhnRD-3H8D6QPqEcZDlRCX0E_Y8YMoQS3NiGqXNxc5FtmdISU03iRz6FJvV4uIisGza-wSMtI41bXdBkB0pQbnGAPNn-k')" }}
                        >
                            <div className="absolute inset-0 bg-gradient-to-t from-primary/80 to-transparent lg:bg-gradient-to-r"></div>
                        </div>
                        <div className="lg:w-1/2 p-10 lg:p-16 flex flex-col justify-center">
                            <div className="mb-6 text-accent">
                                <Quote className="w-12 h-12 fill-current" />
                            </div>
                            <blockquote className="text-2xl font-medium text-white mb-8 leading-relaxed">
                                "Working at AbiaSMEMFB has been the most rewarding chapter of my career. The focus on community impact combined with a supportive team makes every challenge worth tackling."
                            </blockquote>
                            <div>
                                <cite className="not-italic text-lg font-bold text-white block">Amara Ndukwe</cite>
                                <span className="text-accent/90 text-sm font-medium tracking-wide uppercase">
                                    Branch Manager, Umuahia
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
