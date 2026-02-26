import { LegalSeeAlso } from "@/components/legal/see-also";

export default function TermsOfService() {
    return (
        <>
            <header className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 bg-primary overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary-dark to-background opacity-90"></div>
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-white mb-6">
                        Terms of Service
                    </h1>
                    <p className="max-w-3xl mx-auto text-lg md:text-xl text-gray-200 leading-relaxed">
                        Please read these terms carefully before using our services.
                    </p>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <article className="bg-card text-card-foreground shadow-2xl rounded-sm p-8 md:p-16 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-accent to-primary"></div>
                    <div className="prose prose-lg dark:prose-invert max-w-none prose-headings:font-display prose-headings:text-primary dark:prose-headings:text-white prose-a:text-accent hover:prose-a:text-primary prose-p:text-gray-600 dark:prose-p:text-gray-300 prose-p:leading-relaxed text-sm md:text-base">
                        <p className="lead text-lg md:text-xl font-display text-gray-800 dark:text-gray-200 border-l-4 border-accent pl-4 italic mb-8">
                            You understand and agree that the contents of this website include all audio, video, graphics, images and textual materials, downloadable files, pdfs, Microsoft word, etc. All contents are protected by international copyright law.
                        </p>
                        <p>
                            None of the contents on this website shall be used for any commercial purposes without the prior written consent of Abia Microfinance Bank (AbiaSMEMFB). You acknowledge and agree that the Service and any necessary software used in connection with the Service contain proprietary and confidential information that is protected by applicable intellectual property and other laws.
                        </p>
                        <p>
                            You further acknowledge and agree that the contents of sponsored advertisements or information presented to you through the Service or advertisers is protected by copyrights, trademarks, service marks, patents or other proprietary rights and laws. Except as expressly authorized by AbiaSMEMFB, you agree not to modify, rent, lease, loan, sell, distribute or create derivative works based on the Service or the Software, in whole or in part.
                        </p>

                        <div className="my-10 border-t border-gray-200 dark:border-gray-700 w-24 mx-auto"></div>

                        <h3>Description of Service</h3>
                        <p>
                            AbiaSMEMFB's website provides you with access to resources that are rich in content concerning the Bank and its services. You understand and agree that the Service is provided "AS-IS" and that AbiaSMEMFB assumes no responsibility for the timeliness, deletion, or failure to store any user communications. You are responsible for obtaining access to the Service and that access may involve third party fees (such as Internet service provider or airtime charges etc.). You agree to be responsible for those fees.
                        </p>

                        <h3>Requirement for Filling Online Form</h3>
                        <p>
                            In consideration of your use of the Service, you agree to provide true, accurate, current and complete information about yourself as indicated in the form's section. If you provide any information that is untrue, inaccurate, not current or incomplete, or AbiaSMEMFB has a reasonable ground to suspect that such information is untrue, inaccurate, not current, or incomplete, AbiaSMEMFB has the right to delete your form data from our server.
                        </p>

                        <h3>Web Account Opening</h3>
                        <p>
                            Your initiation of the web account opening process does not automatically guarantee that the account will be opened on your behalf. You agree that the account opening will be subject to the bank's internal processes and reviews which may require you to provide further confirmations or documents. You agree to comply with the standard account opening documentation requirements and to meet KYC requirements as stipulated by AbiaSMEMFB. AbiaSMEMFB reserves the right to accept or reject your application.
                        </p>

                        <h3>Indemnity</h3>
                        <p>
                            You agree to indemnify and hold AbiaSMEMFB, and its subsidiaries, affiliates, officers, agents, co-branders or other partners, and employees, harmless from any claim or demand, including reasonable attorneys' fees, made by any third party due to or arising out of any material you submit, post, transmit or make available through the Service, your use of the Service, your connection to the Service, your violation of the Terms Of Service, or your violation of any other rights howsoever.
                        </p>

                        <h3>Limitation of Liability</h3>
                        <p>
                            You expressly understand and agree that AbiaSMEMFB shall not be liable for any direct, indirect, incidental, special, consequential or exemplary damages, including but not limited to, damages for loss of profits, goodwill, use, data or other intangible losses resulting from:
                        </p>
                        <ol className="list-decimal pl-6 space-y-2 marker:text-accent marker:font-bold">
                            <li>The use or the inability to use the service;</li>
                            <li>The cost of procurement of substitute goods and services resulting from any goods, data, information or services purchased or obtained or messages received or transactions entered into through or from the service;</li>
                            <li>Unauthorized access to or alteration of your transmissions or data;</li>
                            <li>Statements or conduct of any third party on the service; or</li>
                            <li>Any other matter relating to the service.</li>
                        </ol>

                        <h3>Trademark Information</h3>
                        <p>
                            The name "Abia Microfinance Bank" and AbiaSMEMFB's logo are trademarks of Abia Microfinance Bank.
                        </p>

                        <h3>Copyrights</h3>
                        <p>
                            AbiaSMEMFB respects the intellectual property of others, and we ask our customers to do the same. If you believe that your work has been the subject of a copyright infringement, or your intellectual property rights have been otherwise violated, please provide our Webmaster the following information:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 marker:text-accent">
                            <li>An electronic or physical signature of the person authorized to act on behalf of the owner of the copyright or other intellectual property interest;</li>
                            <li>A description of the copyrighted work or other intellectual property that you claim has been infringed;</li>
                            <li>Your address, telephone number, and e-mail address;</li>
                        </ul>

                        <p className="text-xs text-gray-400 mt-8 pt-8 border-t dark:border-gray-700">
                            Last Updated: October 2023. By using this site, you agree to these terms.
                        </p>
                    </div>
                </article>
            </main>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
                <LegalSeeAlso />
            </div>
        </>
    );
}
