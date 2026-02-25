import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function Leadership() {
    const leadership = [
        {
            name: "Tony O. Elumelu, CFR",
            title: "Chairman",
            bio: "Tony O. Elumelu is a visionary entrepreneur and philanthropist. Born, raised and educated in Africa, Mr. Elumelu has been responsible for creation of businesses across the continent.",
            image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAOY8yaIQpx5Nui_zWYFm0Jfw_4XpTJrbRkxRxp-Lqxvlt7JdiwcZWOdxieKStAcyml8VR2DwTAPE1GVma_vB_MQMyMKq0GO-nhaNeNq-0qgttJFy5U5HgcPwQksPpM0TuwFp7KlJj5PhAv2OIvpdsom2UHchJFYqGlzL7NKr8RnMjcmgkXeF-LTPgItjSHk_5tluDgZlqqN0Rqv9Q6pLxZTFd18aoHQ0BM8QIfDLleuXvd0ErVFp4ulHGXHQaenT5bwuT4HzH5ZDja",
        },
        {
            name: "Oliver Alawuba",
            title: "Managing Director",
            bio: "Oliver, a seasoned banking professional, comes on board with a broad range of strategic and well-grounded experience in Corporate and Institutional Banking.",
            image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDh1cQi92g373Rn0k5WVZEP9-2i4Y7qZt_3TyImR3RHEafzohRD7cTVmJrV6nW4-_vkeoFo7FS6W-xf6dv9jnRlvD344n_IlFb5RW6NbvMmlgycgx1qzy89PPhW9fRSmwE7C1ssCQe2GpdAuCIjJfjZfglJKWwrdMW4pCb3HOY6v853Rdi5xQiZBH_NZttT-aZ6MvygI8R7OYvQRRo5i7KnFk8-n8ZKmMmjye9kCFNpkhP8058wviOGGGsZ9VR0ZqCrkuLT8S4ybRZ9",
        },
        {
            name: "Muyiwa Akinyemi",
            title: "Deputy Managing Director",
            bio: "Muyiwa is the Deputy Managing Director. He oversees the Bank's business in Rest of Nigeria (excluding North Bank and East Bank).",
            image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDWeOUZ9qCNQzKHq8o_aOOjug4DoUqyeh-qhn7qkOa7Ofu96lCUmenK-jA0eNhroL_f8sXnh6-OtBu4495p1wVN5zkxOkQ_DPasHk7QlaimGluvHfqBaAHk4DkA4XAD5X7fs7OsM-7zop9QIpRnqYAL1Q5bLJgQn1bar9SPUd9C0avThT793LolbM6C-uns1Scg58f5pn1JMrb8Z2cZx4vtazaHAsF3KzrgnzigscUKCkyMrGwXXELdL0TbPF68ijeriUjM8yYJo0wB",
        },
        {
            name: "Chukwuma Nweke",
            title: "Executive Director",
            bio: "He holds a B.Sc degree in Accountancy and an MBA from the University of Nigeria, Nsukka. He is an Associate Member of the Institute of Chartered Accountants of Nigeria.",
            image: "https://lh3.googleusercontent.com/aida-public/AB6AXuC0wrv1k3GqzZ9tR3jFV1kpy1NXAX3jQ8h9dkfoJVBJiBgC2Pf6yd4lAndVF1AdcBT-E3PWnuYZFcaHRS_PxHzww6SGuGghPXQo5EJ0Y3_OQrDerbUV8AZRnxfkPKny01rvJMTi1YLBChjURioRpKuqTUmlkyNDQfKYIHx01o7cp87FYTESw8LQhJ6eWW5TRO6chinSQfqH_8p88H6iNaWGwjBYY7YV8XQKlV4TADyCwLt1ofImta5NAU7mtS5MPSfR3zEOPDOSHu3F",
        },
        {
            name: "Erelu Angela Adebayo",
            title: "Non-Executive Director",
            bio: "Erelu Angela Adebayo obtained a BSC (Hons) Social Science from the University of Ibadan, an MBA from the University of Lagos, and a MPhil (Cantab) in Land Economy.",
            image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBSYa3SENIb2OuBcn06bf-7uqCCjc2dt_kbBBl_VQbsLd0llCsZW1ivbnXvHqGdVKTEkIopko4NyOhxdaQDsB4RjKXg2oEV9WBdlWJFWK1rG6WxfbkT0lNzhHPnrElFqpY2fhnfJBm7y84mdr8mE8zeZDy1bEnrsdo2X3WrotknIJFTHjDKLtjqr8xmOKI7APZxO4EStfQNnxqu3VXgS8Gz-87p32gNHxYJlV0trSSgDzRRxfyRtFzmLz3L88Gu1pD-puhYRq0f4HCs",
        },
        {
            name: "Caroline Anyanwu",
            title: "Independent Director",
            bio: "Mrs. Caroline Anyanwu is a First Class graduate of Statistics, a Fellow of the Institute of Chartered Accountants of Nigeria (ICAN), and a Prize Winner.",
            image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAQy8C7oTgrgU0vEbC_FcBSo7KSxdeuv7UVdX5P2x-EsqgMyBck9UZgN1YN-L8ouTs0GJmhgLq7DH-9imNhmY-x5lihhojlAGGM16iF-bGxNmI9qOzQ_7qTRAPtNDQdt1CV1Yrd0Fnn7Y4E0CAz-9P564-Dp2RgMDBk25jSi0QRLC635wHuPXBwPMrwr57q7xfq3DP9IVHOJJGUZheGg0MwYRA6-2KIWy0fWbBuKuaRAxghfxTcjsXqm2Zu01g_yJdD3e4IMhz2GtdL",
        },
        {
            name: "Alhaji Abdulqadir J. Bello",
            title: "Non-Executive Director",
            bio: "Mr. Abdulqadir J. Bello, a Chartered Accountant, has over 30 years' corporate experience in the banking sector, during which period he held several senior management positions.",
            image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAC0flfR8yxFPwF-zx5nwgE5neBJzd9Izf48EMF_WbNJMX7bAIFTPkj76OHMmxRd0lcnu-rtnjVBZQEhxIhlhvdPdpRBqQVf6SgsPPZOOY8gbA3nnMYyL4a-Gd4dGau-OfI-zLWgb18xIO4_G0IUGhNHLmdiBb7O1ccMupArXIS6jClCeggkgV3-H7qC3bXjdFrtvhxwVSDNqq22hRRsNw7NapUmlrRUdmYo4SfAiHa4piRe9AW_buW4rZlJWgYXPQu9GcQt-Xrc9Q0",
        },
        {
            name: "Angela Aneke",
            title: "Independent Director",
            bio: "Ms. Angela Aneke is a board advisor, banker and strategic thinker with over 30 years' experience in financial services, in the areas of Financial Control, Strategy, and Governance.",
            image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCuO9d3GKwlxpiPBDK4BaKQCaTpeD_R5JWVKCdy30jKLlFg5wMxB2tk0OHXroxtCRkAp20y3FEORqg6VUfUDLEVo7PXhoNwFg1nTlTBgqn9OkVkcdwWqPhRMYjnLXsat6pA-3mvqrAaYKAWxF3RM_l5VbmXuHc_fXUDTchIRSs53ZM-NFwXH10Z7owF0IiC9DdzYcYgRj6KGaXemrWggP2JKz8DWPbjdTUmLoMm35p9CYRem-uSEAbnU1sx-am6rQjl9scblyzya2Sw",
        },
        {
            name: "Emmanuel N. Nnorom",
            title: "Non-Executive Director",
            bio: "Emmanuel N. Nnorom has over 40 years work experience in financial services and audit, including significant board experience with listed companies.",
            image: "https://lh3.googleusercontent.com/aida-public/AB6AXuA5qokoGHScWcxm-2-uM9BqzRmxOmZJCPMLK_qrruQVjAf9kXuDygNQcZEAYDqeN7qZ2ORM2SBth6qMnjU43H_6U7zGpYT153kiC9_HPY2KaA0hotw1sWKkLJ_3ETlyuo34vBuS2NCGD_cyFcsz96_y8e5N6GQQvDG6Jo3ua1p0j6_5t9lbnEiLaHTUHZdPkOCfilxDcQ8vGHup7Qg1CaIz40YsKxkOx6WPvQxkkULsqr62et53qtmnkJYHYRJA9Ko-XHvP9ZULs9Be",
        },
    ];

    return (
        <>
            <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-32 bg-primary overflow-hidden">
                <div className="absolute inset-0">
                    <svg className="h-full w-full" preserveAspectRatio="none" viewBox="0 0 100 100">
                        <path d="M0 100 C 20 0 50 0 100 100 Z" fill="white" className="opacity-10"></path>
                    </svg>
                </div>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
                    <nav aria-label="Breadcrumb" className="flex justify-center mb-6">
                        <ol className="flex items-center space-x-2 text-xs uppercase tracking-widest font-medium text-slate-400">
                            <li><Link className="hover:text-accent transition-colors" href="/">Home</Link></li>
                            <li><span className="text-slate-600 dark:text-slate-600">/</span></li>
                            <li><Link className="hover:text-accent transition-colors" href="/company">Company</Link></li>
                            <li><span className="text-slate-600 dark:text-slate-600">/</span></li>
                            <li aria-current="page" className="text-accent">Board of Directors</li>
                        </ol>
                    </nav>
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-white mb-6">
                        Meet our <span className="text-accent italic">Leadership</span>
                    </h1>
                    <p className="max-w-2xl mx-auto text-lg text-slate-300 font-light leading-relaxed">
                        Our board of directors brings together a wealth of experience, integrity, and vision to guide AbiaSMEMFB
                        towards sustainable growth and excellence.
                    </p>
                </div>
            </section>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 -mt-10 relative z-20">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16">
                    {leadership.map((leader, index) => (
                        <article key={index} className="group fade-in-up">
                            <div className="relative overflow-hidden rounded-t-2xl aspect-[4/5] mb-6 shadow-xl bg-slate-200 dark:bg-slate-800">
                                <img
                                    alt={leader.name}
                                    className="object-cover w-full h-full transform group-hover:scale-105 transition-transform duration-700 ease-in-out grayscale-[20%] group-hover:grayscale-0"
                                    src={leader.image}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                                    <span className="text-white text-sm font-medium">View Full Profile →</span>
                                </div>
                            </div>
                            <div className="pr-4">
                                <div className="flex items-center space-x-2 mb-2">
                                    <span className="h-px w-8 bg-accent"></span>
                                    <p className="text-xs font-bold text-accent uppercase tracking-widest">{leader.title}</p>
                                </div>
                                <h3 className="text-2xl font-display font-bold text-primary dark:text-white mb-3 group-hover:text-accent transition-colors">
                                    {leader.name}
                                </h3>
                                <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-4 line-clamp-3">
                                    {leader.bio}
                                </p>
                                <Link
                                    className="inline-flex items-center text-primary dark:text-slate-200 font-medium text-sm hover:text-accent transition-colors group"
                                    href="#"
                                >
                                    Read Biography <ArrowRight className="ml-1 transition-transform group-hover:translate-x-1" size={16} />
                                </Link>
                            </div>
                        </article>
                    ))}
                </div>
                <div className="mt-20 text-center">
                    <button className="bg-accent hover:bg-orange-700 text-white font-medium py-3 px-8 rounded-full transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1">
                        View All Board Members
                    </button>
                </div>
            </main>
        </>
    );
}
