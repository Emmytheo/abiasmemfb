import Link from "next/link";
import { Shield, BarChart, Settings, Megaphone } from "lucide-react";
import { LegalSeeAlso } from "@/components/legal/see-also";

export default function CookiesPolicy() {
    return (
        <>
            <header className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 bg-primary overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary-dark to-background opacity-90"></div>
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-white mb-6">
                        Cookies Policy
                    </h1>
                    <p className="max-w-3xl mx-auto text-lg md:text-xl text-gray-200 leading-relaxed">
                        This Policy explains how cookies are used enterprise-wide on AbiaSMEMFB website(s) to ensure transparency and trust.
                    </p>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <div className="bg-card text-card-foreground shadow-lg rounded-2xl p-8 md:p-12 mb-12 transition-colors duration-300">
                    <h2 className="text-3xl font-bold text-primary dark:text-white mb-6">Introduction</h2>
                    <p className="text-base text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
                        When you browse our website, we use cookies to ensure a seamless user experience across all the functions you access. The contents of this page are meant to explain to you in clear terms what cookies mean and how we use them on our site.
                    </p>
                    <h2 className="text-3xl font-bold text-primary dark:text-white mb-6">What are Cookies?</h2>
                    <p className="text-base text-gray-600 dark:text-gray-300 leading-relaxed">
                        A "cookie" is a small text file that is stored on your computer, tablet, or phone when you visit a website. Some cookies are deleted when you close your browser. These are known as session cookies. Others remain on your device until they expire, or you delete them from your cache. These are known as persistent cookies and enable us to remember things about you as a returning visitor.
                    </p>
                </div>

                <div className="mb-16">
                    <h2 className="text-3xl font-bold text-primary dark:text-white mb-8 px-2">Types of Cookies</h2>
                    <div className="grid gap-6 md:grid-cols-1">
                        {/* Necessary */}
                        <div className="bg-card text-card-foreground rounded-xl shadow-md overflow-hidden border-l-4 border-accent transition-colors duration-300">
                            <div className="p-6 md:flex md:items-start">
                                <div className="md:w-1/4 mb-4 md:mb-0">
                                    <h3 className="text-lg font-bold text-primary dark:text-white flex items-center">
                                        <Shield className="mr-2 text-accent" />
                                        Necessary or Session Cookies
                                    </h3>
                                </div>
                                <div className="md:w-3/4">
                                    <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                                        These cookies are essential for you to browse the Bank’s website and use its features, such as accessing secure areas of the site. Without these, services you have asked for cannot be provided.
                                    </p>
                                </div>
                            </div>
                        </div>
                        {/* Performance */}
                        <div className="bg-card text-card-foreground rounded-xl shadow-md overflow-hidden border-l-4 border-blue-500 transition-colors duration-300">
                            <div className="p-6 md:flex md:items-start">
                                <div className="md:w-1/4 mb-4 md:mb-0">
                                    <h3 className="text-lg font-bold text-primary dark:text-white flex items-center">
                                        <BarChart className="mr-2 text-blue-500" />
                                        Performance or Analytics Cookies
                                    </h3>
                                </div>
                                <div className="md:w-3/4">
                                    <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                                        These cookies collect information about how you use the Bank’s website, like which pages you visited, and which links you clicked on. None of this information can be used to identify you. It is all aggregated and, therefore, anonymized. Their sole purpose is to improve website functions.
                                    </p>
                                </div>
                            </div>
                        </div>
                        {/* Functional */}
                        <div className="bg-card text-card-foreground rounded-xl shadow-md overflow-hidden border-l-4 border-green-500 transition-colors duration-300">
                            <div className="p-6 md:flex md:items-start">
                                <div className="md:w-1/4 mb-4 md:mb-0">
                                    <h3 className="text-lg font-bold text-primary dark:text-white flex items-center">
                                        <Settings className="mr-2 text-green-500" />
                                        Functional Cookies
                                    </h3>
                                </div>
                                <div className="md:w-3/4">
                                    <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                                        These cookies allow the Bank’s website to remember choices you have made in the past, like what language you prefer, what region or what your username and password are so you can automatically log in.
                                    </p>
                                </div>
                            </div>
                        </div>
                        {/* Marketing */}
                        <div className="bg-card text-card-foreground rounded-xl shadow-md overflow-hidden border-l-4 border-purple-500 transition-colors duration-300">
                            <div className="p-6 md:flex md:items-start">
                                <div className="md:w-1/4 mb-4 md:mb-0">
                                    <h3 className="text-lg font-bold text-primary dark:text-white flex items-center">
                                        <Megaphone className="mr-2 text-purple-500" />
                                        Marketing Cookies
                                    </h3>
                                </div>
                                <div className="md:w-3/4">
                                    <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                                        These cookies track your online activity to help the Bank deliver more relevant advertising or to limit how many times you see an ad. They can share that information with other organizations or advertisers.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-card text-card-foreground shadow-lg rounded-2xl p-8 md:p-12 my-12 relative transition-colors duration-300">
                        {/* <div className="absolute -top-6 right-8 hidden lg:flex items-center bg-white dark:bg-gray-800 shadow-xl rounded-full pr-6 pl-2 py-2 border border-gray-100 dark:border-gray-700 animate-bounce-slow">
                            <img
                                alt="Fibani Assistant"
                                className="w-12 h-12 rounded-full mr-3 bg-blue-100"
                                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAPcDYR23QJkQVtsK7vMJriLu8Yl0z7rfxcFqXFw3lNSoP1qjs1Bj-LgLSUUyJ6-Q-BfhhF3I9BThi7AmugzIX8AofFxZb0wUJasMkr_gjErgCsmzrgNCPd6Inq8SQY_r8-iHT6yYRC47rQh10uxkQ9qifPLA9Nc6OCTbv_HhLIfo0I1_DW6tNqXNHwIqSTCiJ2SAUjYcbVJZeI6H1mK_H5rLgcj9EAlw6iHW2NaroLS2IRveRhF2CBObUt1BXiBR-OrHV4__Lk9bfJ"
                            />
                            <div>
                                <p className="text-xs font-bold text-primary dark:text-white">Fibani</p>
                                <p className="text-[10px] text-gray-500 dark:text-gray-400">Your virtual assistant</p>
                            </div>
                        </div> */}

                        <h2 className="text-3xl font-bold text-primary dark:text-white mb-6">What We Use Cookies For</h2>
                        <p className="text-base text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                            We use cookies to optimize your user experience when you browse our website. If you navigate away from our site, we will use cookies to manage the signup process and general administration and management of your account while you are logged in. These cookies will usually be deleted when you log out. They may, however, in some cases remain afterwards to remember your site preferences when you are logged out.
                        </p>
                        <ul className="space-y-3 mb-8">
                            <li className="flex items-start">
                                <Shield className="text-green-500 mr-2 mt-1 w-5 h-5 flex-shrink-0" />
                                <span className="text-gray-600 dark:text-gray-300">
                                    Provide products and services that you request and to provide a secure online environment.
                                </span>
                            </li>
                            <li className="flex items-start">
                                <Shield className="text-green-500 mr-2 mt-1 w-5 h-5 flex-shrink-0" />
                                <span className="text-gray-600 dark:text-gray-300">
                                    Manage our marketing relationships.
                                </span>
                            </li>
                            <li className="flex items-start">
                                <Shield className="text-green-500 mr-2 mt-1 w-5 h-5 flex-shrink-0" />
                                <span className="text-gray-600 dark:text-gray-300">
                                    Improve the performance of our services.
                                </span>
                            </li>
                            <li className="flex items-start">
                                <Shield className="text-green-500 mr-2 mt-1 w-5 h-5 flex-shrink-0" />
                                <span className="text-gray-600 dark:text-gray-300">
                                    Help us decide which of our products, services and offers may be relevant for your need.
                                </span>
                            </li>
                            <li className="flex items-start">
                                <Shield className="text-green-500 mr-2 mt-1 w-5 h-5 flex-shrink-0" />
                                <span className="text-gray-600 dark:text-gray-300">
                                    Give you a better online experience and track website performance.
                                </span>
                            </li>
                        </ul>

                        <h3 className="text-2xl font-bold text-primary dark:text-white mb-4">Turn Off or Opt-Out of Cookies</h3>
                        <p className="text-base text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
                            You can manually disable cookies on your computer and devices or delete existing cookies. Disabling cookies may restrict your browsing experience on FirstBank Enterprise-wide websites to important features such as logging in to your profile, navigating webpages etc. FirstBank of Nigeria Limited does not share cookie information with any other website nor do we sell this data to any third party without your consent. To find out more about cookies, including how to see what cookies have been set and how to manage and delete them, visit <Link className="text-accent hover:underline font-medium" href="#">All About Cookies</Link>.
                        </p>

                        <h3 className="text-2xl font-bold text-primary dark:text-white mb-4">More Information</h3>
                        <p className="text-base text-gray-600 dark:text-gray-300 leading-relaxed">
                            Hopefully, this has clarified things for you. As was previously mentioned, if there is something you aren't sure you need, it is usually safer to leave cookies enabled in case it does interact with one of the features you use on our site. Please feel free to contact us if you have any questions. (<a className="text-accent hover:underline font-medium" href="mailto:dataprotectionoffice@firstbankgroup.com">dataprotectionoffice@firstbankgroup.com</a>)
                        </p>
                    </div>

                </div>

                <LegalSeeAlso />
            </main>
        </>
    );
}
