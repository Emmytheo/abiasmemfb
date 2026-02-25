import Link from "next/link";
import { CheckCircle, ArrowRight, HeartHandshake, Store, Users, Bike, Rocket, Banknote, Sprout, ScrollText } from "lucide-react";

export default function Business() {
    return (
        <>
            {/* Hero Section */}
            <div className="relative bg-hero-pattern bg-cover bg-center h-[650px] pt-16 lg:pt-24 flex items-center justify-center text-center px-4 sm:px-6 lg:px-8">
                <div className="absolute inset-0 bg-primary/80 mix-blend-multiply"></div>
                <div className="relative max-w-4xl mx-auto z-10">
                    <h1 className="text-4xl sm:text-5xl md:text-6xl font-display font-bold text-white mb-6 leading-tight">
                        Empowering Growth with <br /><span className="text-accent">Flexible Financing</span>
                    </h1>
                    <p className="mt-4 max-w-2xl mx-auto text-xl text-white/80">
                        Tailored financial solutions designed to support your personal ambitions and business expansion across Abia State and beyond.
                    </p>
                    <div className="mt-10 flex flex-col lg:flex-row items-center justify-center gap-4">
                        <Link className="inline-flex items-center px-8 py-3 border border-transparent text-base font-medium rounded-full text-primary bg-white hover:bg-gray-100 transition-colors shadow-lg" href="#featured">
                            View Featured Loan
                        </Link>
                        <Link className="inline-flex items-center px-8 py-3 border border-white text-base font-medium rounded-full text-white hover:bg-white/10 transition-colors" href="#all-loans">
                            Explore All Products
                        </Link>
                    </div>
                </div>
            </div>

            {/* Featured Loan Section */}
            <div className="py-16 sm:py-24 bg-card text-card-foreground" id="featured">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
                        <div className="relative rounded-2xl overflow-hidden shadow-2xl group">
                            <div className="absolute inset-0 bg-primary/10 group-hover:bg-transparent transition-colors duration-500 z-10"></div>
                            <img
                                alt="Local market vendor"
                                className="w-full h-[500px] object-cover transform group-hover:scale-105 transition-transform duration-700"
                                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAto5HIA57sWDkS1urfyLiCEY4rFWIlYJdH9J-krLK21mmA_EUKNM_sRE0MS72jzd8si1-dGyVf4R4eciKoxrCwvftGMwkWS9hNZCG3pzkxWvBiDXBrZ2Ix1rU13exWRbwYENBXZe0lhOohyQ0PqMOJbVaSm4egxTLvVSm6BwU4OpUTwL3s_sCspTWKMSDA_n_E1KSke8g00Q9nXmTzf-4m-ArkM53KrtwV4wTX1-PSevOMultb9LXw00lhgSR_MQX1_9zSvtTTFzLj"
                            />
                        </div>
                        <div className="space-y-8">
                            <div className="inline-flex items-center space-x-2">
                                <span className="h-px w-8 bg-accent"></span>
                                <span className="text-accent font-bold uppercase tracking-wider text-sm">Featured Product</span>
                            </div>
                            <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground">
                                Abia MFB Easy Buy Loan
                            </h2>
                            <p className="text-lg text-muted-foreground leading-relaxed">
                                Designed to enable customers to purchase personal assets for their own use, including Motorcycles, Motor Vehicles, Television Sets, Generating Sets, and Personal Computers. We bridge the gap between your needs and your purchasing power.
                            </p>
                            <div className="bg-muted p-6 rounded-xl border-l-4 border-accent">
                                <h3 className="font-display font-bold text-xl mb-4 text-foreground">Key Features</h3>
                                <ul className="space-y-3">
                                    <li className="flex items-start">
                                        <CheckCircle className="text-accent mr-2 flex-shrink-0" size={20} />
                                        <span className="text-muted-foreground">Customer provides at least 40% of asset cost</span>
                                    </li>
                                    <li className="flex items-start">
                                        <CheckCircle className="text-accent mr-2 flex-shrink-0" size={20} />
                                        <span className="text-muted-foreground">Pro-forma invoice required from approved vendors</span>
                                    </li>
                                    <li className="flex items-start">
                                        <CheckCircle className="text-accent mr-2 flex-shrink-0" size={20} />
                                        <span className="text-muted-foreground">Flexible loan tenure between 12 to 18 months</span>
                                    </li>
                                    <li className="flex items-start">
                                        <CheckCircle className="text-accent mr-2 flex-shrink-0" size={20} />
                                        <span className="text-muted-foreground">Interest applies only on the amount provided by the bank</span>
                                    </li>
                                </ul>
                            </div>
                            <button className="inline-flex items-center px-8 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-lg transition-colors shadow-lg shadow-primary/30">
                                Apply Now <ArrowRight className="ml-2" size={16} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* All Loans Grid */}
            <div className="py-16 bg-background" id="all-loans">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">Other Loan Products</h2>
                        <p className="text-muted-foreground max-w-2xl mx-auto">Comprehensive financial solutions tailored to every stage of your personal and business journey.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Poverty Alleviation Loan */}
                        <div className="bg-card text-card-foreground p-8 rounded-2xl shadow-lg hover:-translate-y-1 transition-transform duration-300">
                            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center text-green-600 dark:text-green-400 mb-6">
                                <HeartHandshake size={24} />
                            </div>
                            <h4 className="text-xl font-bold text-foreground mb-3">Poverty Alleviation Loan</h4>
                            <p className="text-muted-foreground leading-relaxed">
                                A fund set aside by Governments & NGOs for onward disbursement to vulnerable groups like women and widows.
                            </p>
                        </div>
                        {/* Business Loan */}
                        <div className="bg-card text-card-foreground p-8 rounded-2xl shadow-lg hover:-translate-y-1 transition-transform duration-300">
                            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center text-primary dark:text-blue-400 mb-6">
                                <Store size={24} />
                            </div>
                            <h4 className="text-xl font-bold text-foreground mb-3">Abia MFB Business Loan</h4>
                            <p className="text-muted-foreground leading-relaxed">
                                Temporary overdrafts and loans to finance working capital needs as well as fixed assets. Tenor ranges from 30 to 365 days.
                            </p>
                        </div>
                        {/* Group Loan */}
                        <div className="bg-card text-card-foreground p-8 rounded-2xl shadow-lg hover:-translate-y-1 transition-transform duration-300">
                            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center text-purple-600 dark:text-purple-400 mb-6">
                                <Users size={24} />
                            </div>
                            <h4 className="text-xl font-bold text-foreground mb-3">Abia MFB Group Loan</h4>
                            <p className="text-muted-foreground leading-relaxed">
                                Credit facility available to members of groups, unions, or co-operatives without collateral. Security is the guarantee from other members.
                            </p>
                        </div>
                        {/* Easy Ride Loan */}
                        <div className="bg-card text-card-foreground p-8 rounded-2xl shadow-lg hover:-translate-y-1 transition-transform duration-300">
                            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center text-orange-600 dark:text-orange-400 mb-6">
                                <Bike size={24} />
                            </div>
                            <h4 className="text-xl font-bold text-foreground mb-3">Abia MFB Easy Ride Loan</h4>
                            <p className="text-muted-foreground leading-relaxed">
                                Designed to enable customers to purchase bicycles, tricycles, motorcycles, or buses for business purposes.
                            </p>
                        </div>
                        {/* Easy Start Loan */}
                        <div className="bg-card text-card-foreground p-8 rounded-2xl shadow-lg hover:-translate-y-1 transition-transform duration-300">
                            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center text-red-600 dark:text-red-400 mb-6">
                                <Rocket size={24} />
                            </div>
                            <h4 className="text-xl font-bold text-foreground mb-3">Abia MFB Easy Start Loan</h4>
                            <p className="text-muted-foreground leading-relaxed">
                                Assist small scale entrepreneurs and corpers with viable business ideas but lacking finance. Security is NYSC or Degree Certificate.
                            </p>
                        </div>
                        {/* Salary Advance */}
                        <div className="bg-card text-card-foreground p-8 rounded-2xl shadow-lg hover:-translate-y-1 transition-transform duration-300">
                            <div className="w-12 h-12 bg-teal-100 dark:bg-teal-900/30 rounded-xl flex items-center justify-center text-teal-600 dark:text-teal-400 mb-6">
                                <Banknote size={24} />
                            </div>
                            <h4 className="text-xl font-bold text-foreground mb-3">Abia MFB Salary Advance</h4>
                            <p className="text-muted-foreground leading-relaxed">
                                Designed to assist civil servants meet their pressing needs before payday. Borrow in advance of monthly salary.
                            </p>
                        </div>
                        {/* Agricultural Loan */}
                        <div className="bg-card text-card-foreground p-8 rounded-2xl shadow-lg hover:-translate-y-1 transition-transform duration-300">
                            <div className="w-12 h-12 bg-lime-100 dark:bg-lime-900/30 rounded-xl flex items-center justify-center text-lime-600 dark:text-lime-500 mb-6">
                                <Sprout size={24} />
                            </div>
                            <h4 className="text-xl font-bold text-foreground mb-3">Agricultural Loan Scheme</h4>
                            <p className="text-muted-foreground leading-relaxed">
                                Designed to enable farmers fund their farming projects. Loan is for a period of 6-12 months with three months moratorium.
                            </p>
                        </div>
                        {/* LPO Scheme */}
                        <div className="bg-card text-card-foreground p-8 rounded-2xl shadow-lg hover:-translate-y-1 transition-transform duration-300">
                            <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-6">
                                <ScrollText size={24} />
                            </div>
                            <h4 className="text-xl font-bold text-foreground mb-3">Abia MFB LPO Scheme</h4>
                            <p className="text-muted-foreground leading-relaxed">
                                Designed to assist you finance LPO from reputable companies who met the bank's risk acceptable criteria.
                            </p>
                        </div>
                        {/* Contact Card */}
                        <div className="bg-primary p-8 rounded-2xl shadow-lg hover:-translate-y-1 transition-transform duration-300 flex flex-col justify-center items-center text-center">
                            <h3 className="text-xl font-display font-bold text-white mb-4">Need Something Else?</h3>
                            <p className="text-blue-100 text-sm leading-relaxed mb-6">
                                We have customized solutions for unique financial situations. Talk to our loan officers today.
                            </p>
                            <button className="bg-white text-primary font-medium px-6 py-2.5 rounded-full hover:bg-gray-100 transition-colors w-full shadow-md">
                                Contact Us
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
