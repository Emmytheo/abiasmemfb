import Link from "next/link";
import { PiggyBank, Baby, GraduationCap, User, Banknote, Store, Building2, Briefcase, Clock, ArrowRight } from "lucide-react";

export default function PersonalBanking() {
    return (
        <>
            <header className="relative pt-32 pb-20 lg:pt-40 lg:pb-32 overflow-hidden">
                <div className="absolute inset-0 z-0 bg-primary">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/90 to-primary-dark"></div>
                    <div className="absolute top-0 right-0 w-96 h-96 bg-primary-foreground opacity-5 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
                    <div className="absolute bottom-0 left-0 w-72 h-72 bg-accent opacity-5 rounded-full blur-3xl transform -translate-x-1/3 translate-y-1/3"></div>
                </div>
                <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-white mb-6 tracking-tight">
                        Deposit Products
                    </h1>
                    <p className="max-w-2xl mx-auto text-lg md:text-xl text-blue-100 font-light leading-relaxed">
                        We offer varieties of accounts that suit every stage of your life, with unique benefits designed to match your
                        personal banking needs as you grow.
                    </p>
                </div>
            </header>

            <main className="relative z-20 -mt-16 pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {/* ABSME Esusu */}
                    <div className="group bg-card text-card-foreground rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 border border-border flex flex-col relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-accent to-primary transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
                        <div className="w-14 h-14 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                            <PiggyBank className="text-primary group-hover:text-white transition-colors" size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-foreground mb-3 font-display">ABSME Esusu</h3>
                        <p className="text-muted-foreground text-sm leading-relaxed mb-8 flex-grow">
                            ABSME Esusu is a traditional African banking system. It is an account targeted at encouraging daily/weekly savings.
                        </p>
                        <Link className="inline-flex items-center text-primary font-semibold text-sm hover:text-accent transition-colors mt-auto" href="#">
                            Learn more <ArrowRight className="ml-1" size={16} />
                        </Link>
                    </div>

                    {/* ABSME Kiddies */}
                    <div className="group bg-card text-card-foreground rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 border border-border flex flex-col relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-accent to-primary transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
                        <div className="w-14 h-14 rounded-xl bg-orange-50 dark:bg-orange-900/30 flex items-center justify-center mb-6 group-hover:bg-accent group-hover:text-white transition-colors duration-300">
                            <Baby className="text-accent group-hover:text-white transition-colors" size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-foreground mb-3 font-display">ABSME Kiddies</h3>
                        <p className="text-muted-foreground text-sm leading-relaxed mb-8 flex-grow">
                            This account allows parents/guardians to save on behalf of their wards until they are of age. Start their financial future early.
                        </p>
                        <Link className="inline-flex items-center text-primary font-semibold text-sm hover:text-accent transition-colors mt-auto" href="#">
                            Learn more <ArrowRight className="ml-1" size={16} />
                        </Link>
                    </div>

                    {/* ABSME Save for School */}
                    <div className="group bg-card text-card-foreground rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 border border-border flex flex-col relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-accent to-primary transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
                        <div className="w-14 h-14 rounded-xl bg-green-50 dark:bg-green-900/30 flex items-center justify-center mb-6 group-hover:bg-green-600 group-hover:text-white transition-colors duration-300">
                            <GraduationCap className="text-green-600 group-hover:text-white transition-colors" size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-foreground mb-3 font-display">ABSME Save for School</h3>
                        <p className="text-muted-foreground text-sm leading-relaxed mb-8 flex-grow">
                            This type of account is meant to encourage saving culture in students. Secure your education with smart planning.
                        </p>
                        <Link className="inline-flex items-center text-primary font-semibold text-sm hover:text-accent transition-colors mt-auto" href="#">
                            Learn more <ArrowRight className="ml-1" size={16} />
                        </Link>
                    </div>

                    {/* ABSME Individual Savings */}
                    <div className="group bg-card text-card-foreground rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 border border-border flex flex-col relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-accent to-primary transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
                        <div className="w-14 h-14 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                            <User className="text-primary group-hover:text-white transition-colors" size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-foreground mb-3 font-display">ABSME Individual Savings</h3>
                        <p className="text-muted-foreground text-sm leading-relaxed mb-8 flex-grow">
                            A regular savings account for individuals or unregistered small businesses. Flexible and secure for your daily needs.
                        </p>
                        <Link className="inline-flex items-center text-primary font-semibold text-sm hover:text-accent transition-colors mt-auto" href="#">
                            Learn more <ArrowRight className="ml-1" size={16} />
                        </Link>
                    </div>

                    {/* ABSME Individual Current */}
                    <div className="group bg-card text-card-foreground rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 border border-border flex flex-col relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-accent to-primary transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
                        <div className="w-14 h-14 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center mb-6 group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300">
                            <Banknote className="text-indigo-600 group-hover:text-white transition-colors" size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-foreground mb-3 font-display">ABSME Individual Current</h3>
                        <p className="text-muted-foreground text-sm leading-relaxed mb-8 flex-grow">
                            A current account is for individuals/businesses owned and operated under their personal names or in partnerships.
                        </p>
                        <Link className="inline-flex items-center text-primary font-semibold text-sm hover:text-accent transition-colors mt-auto" href="#">
                            Learn more <ArrowRight className="ml-1" size={16} />
                        </Link>
                    </div>

                    {/* ABSME Business Savings */}
                    <div className="group bg-card text-card-foreground rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 border border-border flex flex-col relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-accent to-primary transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
                        <div className="w-14 h-14 rounded-xl bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center mb-6 group-hover:bg-purple-600 group-hover:text-white transition-colors duration-300">
                            <Store className="text-purple-600 group-hover:text-white transition-colors" size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-foreground mb-3 font-display">ABSME Business Savings</h3>
                        <p className="text-muted-foreground text-sm leading-relaxed mb-8 flex-grow">
                            An account for small traders who can not afford the cost of administrative charges. Grow your trade with us.
                        </p>
                        <Link className="inline-flex items-center text-primary font-semibold text-sm hover:text-accent transition-colors mt-auto" href="#">
                            Learn more <ArrowRight className="ml-1" size={16} />
                        </Link>
                    </div>

                    {/* ABSME Corporate Current */}
                    <div className="group bg-card text-card-foreground rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 border border-border flex flex-col relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-accent to-primary transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
                        <div className="w-14 h-14 rounded-xl bg-gray-50 dark:bg-gray-700 flex items-center justify-center mb-6 group-hover:bg-gray-600 group-hover:text-white transition-colors duration-300">
                            <Building2 className="text-gray-600 dark:text-gray-300 group-hover:text-white transition-colors" size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-foreground mb-3 font-display">ABSME Corporate Current</h3>
                        <p className="text-muted-foreground text-sm leading-relaxed mb-8 flex-grow">
                            An account targeted at business owners such as limited liability companies, registered business names, and NGOs.
                        </p>
                        <Link className="inline-flex items-center text-primary font-semibold text-sm hover:text-accent transition-colors mt-auto" href="#">
                            Learn more <ArrowRight className="ml-1" size={16} />
                        </Link>
                    </div>

                    {/* ABSME Salary Account */}
                    <div className="group bg-card text-card-foreground rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 border border-border flex flex-col relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-accent to-primary transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
                        <div className="w-14 h-14 rounded-xl bg-teal-50 dark:bg-teal-900/30 flex items-center justify-center mb-6 group-hover:bg-teal-600 group-hover:text-white transition-colors duration-300">
                            <Briefcase className="text-teal-600 group-hover:text-white transition-colors" size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-foreground mb-3 font-display">ABSME Salary Account</h3>
                        <p className="text-muted-foreground text-sm leading-relaxed mb-8 flex-grow">
                            A product designed to offer services for staffers of companies, organizations in the private and public sectors.
                        </p>
                        <Link className="inline-flex items-center text-primary font-semibold text-sm hover:text-accent transition-colors mt-auto" href="#">
                            Learn more <ArrowRight className="ml-1" size={16} />
                        </Link>
                    </div>

                    {/* ABSME Fixed Deposit */}
                    <div className="group bg-card text-card-foreground rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 border border-border flex flex-col relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-accent to-primary transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
                        <div className="w-14 h-14 rounded-xl bg-rose-50 dark:bg-rose-900/30 flex items-center justify-center mb-6 group-hover:bg-rose-600 group-hover:text-white transition-colors duration-300">
                            <Clock className="text-rose-600 group-hover:text-white transition-colors" size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-foreground mb-3 font-display">ABSME Fixed Deposit</h3>
                        <p className="text-muted-foreground text-sm leading-relaxed mb-8 flex-grow">
                            Long-term investment account for you or your business. Enjoy competitive interest rates on your secure deposit.
                        </p>
                        <Link className="inline-flex items-center text-primary font-semibold text-sm hover:text-accent transition-colors mt-auto" href="#">
                            Learn more <ArrowRight className="ml-1" size={16} />
                        </Link>
                    </div>
                </div>
            </main>
        </>
    );
}
