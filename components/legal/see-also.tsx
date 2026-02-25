import Link from "next/link";

export function LegalSeeAlso() {
    return (
        <div className="mt-20">
            <h2 className="text-3xl font-bold text-center text-foreground">See also</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Link href="#" className="group block bg-card text-card-foreground rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden transform hover:-translate-y-1">
                    <div className="h-56 overflow-hidden">
                        <img
                            alt="Customer service representative"
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDnnhc5KGo6T9Kjw8jwaf4JYomE7IQtm9DM5LnSFazgarDeYK_kDX4nrnjDDyDDXKydhjTgBlbzohk9eYQw4loZ1mFsbpXIHxv8mUSU6R0YqnAiPIWld73enuahGCxunQOh3yBAkn6i79yi9X0h8-x1h1V6tFqs_J7OTkTQ0f7QI_VlEx2Vp6NtzcCZag7hVCq10YPObwPelZj_pNiuDVI_2v7bpkBLQcQCzMHYa75PornXlKi91SJZVPRimWtQwUTkQxTRZxtqteWm"
                        />
                    </div>
                    <div className="p-6 text-center">
                        <h3 className="text-lg font-bold text-foreground">
                            Contact Us
                        </h3>
                    </div>
                </Link>

                <Link href="/legal/cookies" className="group block bg-card text-card-foreground rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden transform hover:-translate-y-1">
                    <div className="h-56 overflow-hidden">
                        <img
                            alt="Secure padlock on keyboard"
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            src="https://lh3.googleusercontent.com/aida-public/AB6AXuB7XWitrxRxDSMoDrGj-yUqf7LmP2RAcPXxKG4P0OpFfYpGKfVSEuFpFOIfO8cuYfVlcE4WPvG6gclWnMKYURF9-H8KokyJFEcuQJ5LyC5j5TbEWrePPzBRFgvOFbn7vA5W0FJGnD0GIKkxBgxU8Ls427KFlHHyEmbJHb1JE72MxAokJMc7vKmwzxp3b4BGk1YN1fGb8NBHbraltqbMjRsE4__I_xcQbenO6rNpMsDIzrX0coojxvlmYmsqwqnetLaBvdtBJluq82z-"
                        />
                    </div>
                    <div className="p-6 text-center">
                        <h3 className="text-lg font-bold text-foreground">
                            Privacy Policy
                        </h3>
                    </div>
                </Link>

                <Link href="/legal/terms" className="group block bg-card text-card-foreground rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden transform hover:-translate-y-1">
                    <div className="h-56 overflow-hidden">
                        <img
                            alt="Signing a document"
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDRfg1YkL6NcrhqN3Nai4LpaZvUB405nEKiAlU9_nL7_oa_1InoqHICiOU2X2olr89gG1GFiTNyLwB6GJrdG5LtQdczASsM0aDV0P31flxOenQ6WeTYkAuIXSGSThPtpwDcM4h7ioncNZHvTSNYz8cx6qbkwgKlNbQS_7625KTXTG9cT2Lk4LPqDcT53KIPy5kzZNGv9C8Jw1bjnMO8Jp2S82tj8rm7QjdABR2NK5LaDxVk6PSzcB0AcxIhBQ1VuBq0k9Be4ZbURbSl"
                        />
                    </div>
                    <div className="p-6 text-center">
                        <h3 className="text-lg font-bold text-foreground">
                            Terms of Use
                        </h3>
                    </div>
                </Link>

                <Link href="/legal/code-of-conduct" className="group block bg-card text-card-foreground rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden transform hover:-translate-y-1">
                    <div className="h-56 overflow-hidden">
                        <img
                            alt="Stack of documents"
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            src="https://lh3.googleusercontent.com/aida-public/AB6AXuAzF0EnzNwKDy_rHsNuib6zWOrzhJrV8NKIs8QQRNKy783fgsL8N9ulabEXvGmoviPF87F2cld5YK6CF_ilJYLFEY80hfDzsCixSuDvuqLqyjBDNQdK9ecwsfUIZsGIOkUWo2yGxI0H27ECQw4UZuJzvKk8aIYyfBZ9kLcj_E1qzJZDGxAKrXUzoXxvU4PnJqD09syxHEMIMFslmlQClBobn-qZGyGpbvCeE_Vrz1R4Ob6-jMF6OeeLXxIWATlaUSKDcZe3ASr-Na3u"
                        />
                    </div>
                    <div className="p-6 text-center">
                        <h3 className="text-lg font-bold text-foreground">
                            Third-Party Code of Conduct
                        </h3>
                    </div>
                </Link>
            </div>
        </div>
    );
}
