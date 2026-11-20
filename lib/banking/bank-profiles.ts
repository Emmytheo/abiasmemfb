import type { Palette } from "@/context/palette-context"

export type LogoVariant = "navy-anchor" | "asm-emblem" | "maxitrust-emblem" | "shield"

export type ModuleKey =
    | "retailAndSalary"
    | "schoolCollections"
    | "cooperativeEsusu"
    | "coptellerBridge"
    | "agencyPos"
    | "smartCards"
    | "merchantApiAndPayroll"
    | "workflowEngine"

export interface BankModuleDefinition {
    key: ModuleKey
    label: string
    description: string
    scopeHint: string
}

export const BANK_MODULE_DEFINITIONS: BankModuleDefinition[] = [
    {
        key: "retailAndSalary",
        label: "Retail & Salary Banking",
        description: "Savings, current accounts, standing orders, transfers, and personal lending.",
        scopeHint: "Core Retail Portal",
    },
    {
        key: "schoolCollections",
        label: "School & Institutional Collections",
        description: "Tuition billing rails, instant printable e-receipts, and bursary reconciliation.",
        scopeHint: "Enterprise / Public Portal",
    },
    {
        key: "cooperativeEsusu",
        label: "Cooperative & Esusu Engine",
        description: "Rotational thrift circles, group dividends, and cooperative admin ledgers.",
        scopeHint: "Admin & Client Sidebars",
    },
    {
        key: "coptellerBridge",
        label: "Copteller Cooperative Bridge",
        description: "Live modular integration with Copteller for union licensing, HP fleet assets, escrow vaults, and CBN reporting.",
        scopeHint: "Bank Superadmin Oversight",
    },
    {
        key: "agencyPos",
        label: "POS Agency Network",
        description: "Agent terminal provisioning, commission settlement, and cashpoint operations.",
        scopeHint: "Agency & Business Dashboards",
    },
    {
        key: "smartCards",
        label: "Contactless & Virtual Cards",
        description: "Physical Verve/Mastercard registry, virtual cards, and spend controls.",
        scopeHint: "Cards Registry & Client Hub",
    },
    {
        key: "merchantApiAndPayroll",
        label: "Merchant API & Bulk Payroll",
        description: "Developer checkouts, virtual accounts, invoicing, and HR batch salary runs.",
        scopeHint: "Business & Merchant Portals",
    },
    {
        key: "workflowEngine",
        label: "Automated Core Workflows",
        description: "Visual orchestration engine, provider mappings, secrets vault, and crons.",
        scopeHint: "Admin Command Suite",
    },
]

export type BankProfileOverride = Partial<
    Omit<BankProfile, "id" | "enabledModules" | "themeStyle">
> & {
    enabledModules?: Partial<BankProfile["enabledModules"]>
    themeStyle?: Partial<BankProfile["themeStyle"]>
}

export interface BankBranchInfo {
    name: string
    role: string
    location: string
    posTop: string
    posLeft: string
    featured?: boolean
}

export interface BankHeroSlide {
    id: string
    badge: string
    headlineTop: string
    headlineAccent: string
    body: string
    ctaLabel: string
    ctaHref: string
    ctaSecondaryLabel: string
    ctaSecondaryHref: string
    highlights: { value: string; label: string }[]
    orbA: string
    orbB: string
    accentGradient: string
    floatCardTitle: string
    floatCardSub: string
}

export interface BankAuthCycle {
    headline: string
    sub: string
    accent: string
    orbA: string
    orbB: string
    features: string[]
}

export interface BankMilestone {
    date: string
    title: string
    desc: string
}

export interface BankLeader {
    name: string
    role: string
}

export interface BankTestimonial {
    quote: string
    author: string
    role: string
}

export interface BankProfile {
    id: string
    shortName: string
    wordmarkPrimary: string
    wordmarkSecondary: string
    legalName: string
    tagline: string
    heroDescription: string
    licenseBadge: string
    foundedYear: string
    holdingEntity: string
    defaultPalette: Palette
    logoVariant: LogoVariant
    themeStyle: {
        useBrandedDarkNav: boolean
        useBrandedDarkHero: boolean
        showTopUtilityBar: boolean
        topBarBgHex: string
        heroBgHex: string
        accentHex: string
    }
    domain: string
    supportEmail: string
    whistleblowerEmail: string
    supportPhones: string[]
    addressLines: string[]
    regionLabel: string
    ussdCode: string
    internalBankCode: string
    internalPayBrand: string
    posBrandName: string
    demoAccountNumber: string
    demoAccountLabel: string
    demoCoopName: string
    taxSampleAuthority: string
    enabledModules: {
        retailAndSalary: boolean
        schoolCollections: boolean
        cooperativeEsusu: boolean
        coptellerBridge: boolean
        agencyPos: boolean
        smartCards: boolean
        merchantApiAndPayroll: boolean
        workflowEngine: boolean
    }
    heroSlides: BankHeroSlide[]
    whyChoose: {
        title: string
        subtitle: string
        cards: { title: string; desc: string }[]
    }
    spotlight: {
        badge: string
        headlineTop: string
        headlineItalic: string
        description: string
        ctaLabel: string
        ctaHref: string
        quoteHeading: string
        quoteSub: string
        quoteBody: string
        attributionName: string
        attributionRole: string
    }
    testimonials: BankTestimonial[]
    mandate: {
        badge: string
        titleTop: string
        titleAccent: string
        summary: string
        vision: string
        mission: string
        whoWeAre: string
        patronName: string
        patronRole: string
        patronStatement: string
        secondaryStatement: string
        hqImageSrc: string
        portraitImageSrc?: string
        historyMilestones: BankMilestone[]
        coreValues: { title: string; desc: string }[]
        leadership: BankLeader[]
        partners: string[]
    }
    branches: BankBranchInfo[]
    authCycles: BankAuthCycle[]
    authMetrics: { value: string; label: string }[]
    isCustom?: boolean
}

export const BANK_PROFILE_COOKIE = "banksuite_profile_id"
export const DEFAULT_BANK_PROFILE_ID = "nnmfb"

export const PRESET_BANK_PROFILES: BankProfile[] = [
    {
        id: "nnmfb",
        shortName: "NNMFB",
        wordmarkPrimary: "Nigerian Navy",
        wordmarkSecondary: "MFB",
        legalName: "Nigerian Navy Microfinance Bank Limited",
        tagline: "Banking with Naval Precision",
        heroDescription:
            "Nigerian Navy Microfinance Bank offers reliable financial services with the discipline and precision of the Nigerian Navy — serving personnel, defense families, schools, and the general public.",
        licenseBadge: "CBN Licensed (March 2015) · Insured by NDIC · NDP Act 2023 Compliant",
        foundedYear: "2015",
        holdingEntity: "Navy Holdings Limited",
        defaultPalette: "navy",
        logoVariant: "navy-anchor",
        themeStyle: {
            useBrandedDarkNav: true,
            useBrandedDarkHero: true,
            showTopUtilityBar: true,
            topBarBgHex: "#040836",
            heroBgHex: "#070D59",
            accentHex: "#F4C414",
        },
        domain: "nigerianavymfb.com",
        supportEmail: "info@nigerianavymfb.com",
        whistleblowerEmail: "compliance@nigerianavymfb.com",
        supportPhones: [
            "+234 (0) 903 091 8125",
            "+234 (0) 913 842 6989",
            "+234 (0) 815 612 0060",
            "+234 (0) 706 357 2386",
        ],
        addressLines: [
            "Duplex 4 Section 4, Shop 6",
            "Garki Int'l Market, Garki II",
            "Abuja, Nigeria",
        ],
        regionLabel: "Abuja HQ & Nationwide Naval Commands",
        ussdCode: "*614*186#",
        internalBankCode: "090263",
        internalPayBrand: "NNMFB Pay",
        posBrandName: "NNMFB POS TERMINAL",
        demoAccountNumber: "2048193701",
        demoAccountLabel: "Personnel Savings (2048...3701)",
        demoCoopName: "Naval Community & Welfare Co-op",
        taxSampleAuthority: "Naval Pay Office & FCT IRS Remittance",
        enabledModules: {
            retailAndSalary: true,
            schoolCollections: true,
            cooperativeEsusu: true,
            coptellerBridge: true,
            agencyPos: true,
            smartCards: true,
            merchantApiAndPayroll: true,
            workflowEngine: true,
        },
        heroSlides: [
            {
                id: "anchor",
                badge: "Nigerian Navy Microfinance Bank Limited",
                headlineTop: "Banking with",
                headlineAccent: "Naval Precision",
                body: "Nigerian Navy Microfinance Bank offers reliable financial services with the discipline and precision of the Nigerian Navy — trusted by service personnel, schools, and businesses across Nigeria.",
                ctaLabel: "Our Services",
                ctaHref: "/business",
                ctaSecondaryLabel: "Contact Us",
                ctaSecondaryHref: "/support",
                highlights: [
                    { value: "*614*186#", label: "Offline USSD" },
                    { value: "March 2015", label: "CBN Licensed" },
                    { value: "iOS & Android", label: "NNMFB Mobile" },
                ],
                orbA: "bg-blue-500/20",
                orbB: "bg-amber-400/15",
                accentGradient: "from-[#F4C414] via-amber-300 to-[#F4C414]",
                floatCardTitle: "Onward Together · Your Financial Anchor",
                floatCardSub: "Duplex 4 Section 4, Shop 6, Garki II Abuja",
            },
            {
                id: "schools",
                badge: "School Collection & Institutional Portal",
                headlineTop: "Simplified School",
                headlineAccent: "Fee Collection.",
                body: "Built for educational institutions and parents — pay term fees seamlessly through NNMFB web, mobile app, or *614*186# USSD with automated digital receipts and instant bursar reconciliation.",
                ctaLabel: "Explore School Collections",
                ctaHref: "/business#collections",
                ctaSecondaryLabel: "Digital Banking",
                ctaSecondaryHref: "/internet-banking",
                highlights: [
                    { value: "Instant", label: "Digital Receipts" },
                    { value: "Multi-School", label: "Term Reconciliation" },
                    { value: "*614*186#", label: "USSD & Web Pay" },
                ],
                orbA: "bg-amber-400/20",
                orbB: "bg-blue-500/20",
                accentGradient: "from-[#F4C414] via-yellow-200 to-[#F4C414]",
                floatCardTitle: "School Collection Service",
                floatCardSub: "Zero Paper Tellers · Verified Accounting",
            },
            {
                id: "digital",
                badge: "POS · Contactless Cards · USSD · Mobile App",
                headlineTop: "Complete Digital",
                headlineAccent: "Banking Suite.",
                body: "Enjoy 24/7 Internet Banking, contactless debit cards nationwide, Android & iOS Mobile App with biometric sign-in, and POS Terminals built for growing enterprises.",
                ctaLabel: "Explore Digital Banking",
                ctaHref: "/internet-banking",
                ctaSecondaryLabel: "Apply for Account",
                ctaSecondaryHref: "/auth/sign-up",
                highlights: [
                    { value: "POS Fleet", label: "Instant Settlement" },
                    { value: "Contactless", label: "Debit Cards" },
                    { value: "24/7 Fraud", label: "2FA Encryption" },
                ],
                orbA: "bg-blue-400/20",
                orbB: "bg-amber-400/15",
                accentGradient: "from-[#F4C414] via-white to-[#F4C414]",
                floatCardTitle: "NNMFB App Registration",
                floatCardSub: "BVN Verified Onboarding in Minutes",
            },
        ],
        whyChoose: {
            title: "Why Choose Nigerian Navy MFB?",
            subtitle: "We combine naval discipline with financial expertise to provide you with the best banking experience.",
            cards: [
                {
                    title: "Security & Trust",
                    desc: "With the backing of the Nigerian Navy, your finances are protected with military-grade security and reliability.",
                },
                {
                    title: "Community Focus",
                    desc: "We're committed to serving the Nigerian Navy community and beyond with personalized financial solutions.",
                },
                {
                    title: "Financial Growth",
                    desc: "Our innovative financial products are designed to help you grow your wealth and secure your future.",
                },
            ],
        },
        spotlight: {
            badge: "Our Mission & Vision",
            headlineTop: "Guided by discipline,",
            headlineItalic: "built for stability.",
            description:
                "From Abuja to coastal commands nationwide, Nigerian Navy Microfinance Bank delivers accessible, secure, and customer-centric banking for service personnel, schools, and the general public.",
            ctaLabel: "About Nigerian Navy MFB",
            ctaHref: "/company",
            quoteHeading: "CBN Licensed Microfinance Bank",
            quoteSub: "Serving Naval Personnel & General Public",
            quoteBody:
                "To be the most trusted and innovative microfinance bank, providing financial solutions that empower service personnel, their families, and the wider community towards economic stability and prosperity.",
            attributionName: "Dr. Agucha Okeoma",
            attributionRole: "MD/CEO · Nigerian Navy MFB Ltd.",
        },
        testimonials: [
            {
                quote: "I've been saving with Nigerian Navy MFB for five years now. The interest rates are competitive, and their customer service is exceptional. I highly recommend their savings products.",
                author: "John Eze",
                role: "Business Owner",
            },
            {
                quote: "The loan process was incredibly smooth and efficient. The staff was professional and guided me through every step. I received my business loan within days.",
                author: "Commander Okafor",
                role: "Nigerian Navy Officer",
            },
            {
                quote: "As a school administrator, the school collection service has made fee collection so much easier. Parents appreciate the convenience, and our accounting is now more accurate.",
                author: "Mrs. Adeyemi",
                role: "School Principal",
            },
        ],
        mandate: {
            badge: "About Nigerian Navy MFB",
            titleTop: "About",
            titleAccent: "Nigerian Navy MFB",
            summary:
                "Nigerian Navy Microfinance Bank (NNMFB) is a leading financial institution established to provide accessible and reliable banking services to members of the Nigerian Navy and the general public.",
            vision:
                "To be the most trusted and innovative microfinance bank, providing financial solutions that empower service personnel, their families, and the wider community towards economic stability and prosperity.",
            mission:
                "To deliver accessible, secure, and customer-centric financial services through innovation, integrity, and excellence, enhancing financial inclusion, supporting entrepreneurship, and fostering sustainable economic growth for stakeholders.",
            whoWeAre:
                "With strong naval heritage, NNMFB combines military precision and discipline with financial expertise to deliver dependable savings, loans, school collections, and omnichannel digital banking across Nigeria.",
            patronName: "R Adm H Ibrahim · Board & Management",
            patronRole: "Nigerian Navy Microfinance Bank Limited",
            patronStatement:
                "With our strong naval heritage, we combine military precision and discipline with financial expertise to deliver exceptional banking services that meet the unique needs of service personnel, families, and the general public.",
            secondaryStatement:
                "Headquartered at Garki II, Abuja, our commitment to excellence, integrity, and customer satisfaction makes us a trusted financial partner for individuals, schools, and businesses across Nigeria.",
            hqImageSrc: "/images/abia-tower.jpg",
            historyMilestones: [
                {
                    date: "Foundation",
                    title: "NNMFBL Establishment",
                    desc: "Nigerian Navy Microfinance Bank was established to serve the financial welfare of naval personnel and the general public.",
                },
                {
                    date: "March 17, 2015",
                    title: "CBN Operating License",
                    desc: "Licensed under the Central Bank of Nigeria microfinance framework, expanding inclusive financial services nationwide.",
                },
                {
                    date: "February 2025",
                    title: "10-Year Digital Banking Launch",
                    desc: "Celebrated 10 years of service with modernized digital banking rails, mobile app, USSD *614*186#, and automated collections.",
                },
                {
                    date: "April 2025",
                    title: "30,000+ Customer Growth",
                    desc: "Achieved over 30,000 customers and expanded reach across commands and commercial corridors in Nigeria.",
                },
            ],
            coreValues: [
                { title: "Integrity", desc: "We uphold the highest ethical standards in all dealings, ensuring transparency, honesty, and accountability." },
                { title: "Customer Focus", desc: "We place customers at the center of everything we do, tailoring solutions to exceed expectations." },
                { title: "Excellence", desc: "We pursue excellence across operations, continuously improving service speed and digital reliability." },
                { title: "Teamwork", desc: "We value collaboration across commands and departments to deliver seamless customer outcomes." },
                { title: "Innovation", desc: "We embrace modern banking technology, mobile apps, and USSD channels to simplify finance." },
                { title: "Community Impact", desc: "We support financial empowerment across both military communities and civilian enterprises." },
            ],
            leadership: [
                { name: "R Adm H Ibrahim", role: "Board Leadership · NNMFB" },
                { name: "R Adm AP Kayode", role: "Chief of Naval Staff Rep · Director" },
                { name: "R Adm BH Sabo", role: "Director · Nigerian Navy MFB" },
                { name: "Dr. Agucha Okeoma", role: "MD / CEO" },
                { name: "Mr. Nelson Okuru", role: "Head of Operations" },
                { name: "Joseph Agboola", role: "Head, Risk & Compliance" },
            ],
            partners: ["FCMB", "Remita", "NIBSS", "Interswitch", "NDIC"],
        },
        branches: [
            { name: "Garki II HQ (Abuja)", role: "Headquarters & Executive Desk", location: "Duplex 4 Section 4, Shop 6, Garki Int'l Market, Abuja", posTop: "38%", posLeft: "50%", featured: true },
            { name: "Lagos Naval Command Desk", role: "Western Fleet & Maritime Hub", location: "Apapa / Victoria Island Corridor, Lagos", posTop: "68%", posLeft: "28%" },
            { name: "Port Harcourt Station", role: "Eastern / Delta Command Hub", location: "Rivers Commercial District", posTop: "74%", posLeft: "56%" },
            { name: "Calabar Command Desk", role: "Eastern Naval Command Point", location: "Cross River Naval Service Desk", posTop: "68%", posLeft: "72%" },
        ],
        authCycles: [
            {
                headline: "Banking with Naval Precision.",
                sub: "Secure digital banking built with military-grade custody for naval personnel, defense families, schools, and the general public.",
                accent: "from-[#F4C414] via-white to-[#F4C414]",
                orbA: "bg-blue-600/30",
                orbB: "bg-amber-400/20",
                features: ["CBN Licensed (March 2015) & NDIC Insured", "USSD *614*186# + Mobile App (iOS & Android)"],
            },
            {
                headline: "School Collection & Salary Credit.",
                sub: "Simplified school fee collections, bursar reconciliation, and structured personnel or SME financing.",
                accent: "from-[#F4C414] via-amber-200 to-white",
                orbA: "bg-amber-500/25",
                orbB: "bg-blue-600/25",
                features: ["School Fee Collections with E-Receipts", "Personal, Salary & MSME Business Loans"],
            },
            {
                headline: "Omnichannel E-Banking Access.",
                sub: "Contactless debit cards, POS terminals, 24/7 Internet Banking, and cooperative thrift wallets.",
                accent: "from-white via-[#F4C414] to-amber-300",
                orbA: "bg-blue-500/25",
                orbB: "bg-amber-400/20",
                features: ["Biometric Mobile App & Web Portal", "2FA Protected Real-Time Transfers"],
            },
        ],
        authMetrics: [
            { value: "2015", label: "CBN Licensed" },
            { value: "*614*186#", label: "USSD Rail" },
            { value: "30K+", label: "Customers" },
            { value: "24/7", label: "iBank & App" },
        ],
    },
    {
        id: "abiasmemfb",
        shortName: "AbiaSMEMFB",
        wordmarkPrimary: "AbiaSME",
        wordmarkSecondary: "MFB",
        legalName: "Abia State Microfinance Bank Limited",
        tagline: "Empowering Abia's Financial Future.",
        heroDescription:
            "Providing accessible credit, digital Esusu trade union wallets, agent cashpoints, and smart payment infrastructure for MSMEs and entrepreneurs across Abia State.",
        licenseBadge: "Licensed by the Central Bank of Nigeria · Insured by NDIC",
        foundedYear: "2006",
        holdingEntity: "Abia State MSME Growth Initiative",
        defaultPalette: "nature",
        logoVariant: "asm-emblem",
        themeStyle: {
            useBrandedDarkNav: false,
            useBrandedDarkHero: false,
            showTopUtilityBar: false,
            topBarBgHex: "#004d24",
            heroBgHex: "#006B33",
            accentHex: "#EAB308",
        },
        domain: "abiasmemfb.com",
        supportEmail: "concierge@AbiaSMEMFB.com",
        whistleblowerEmail: "whistleblowing@AbiaSMEMFB.com",
        supportPhones: ["0700 444 1 444", "0700 444 0 444"],
        addressLines: [
            "AbiaSMEMFB Tower",
            "Umuahia & Aba Commercial Corridor",
            "Abia State, Nigeria",
        ],
        regionLabel: "Abia State Trade & MSME Corridors",
        ussdCode: "*5125#",
        internalBankCode: "090110",
        internalPayBrand: "Abia Pay",
        posBrandName: "ABIA MFB POS",
        demoAccountNumber: "3086167603",
        demoAccountLabel: "Savings (3086...7603)",
        demoCoopName: "Abia Tricycle Operators Association",
        taxSampleAuthority: "Abia State IRS (PAYE)",
        enabledModules: {
            retailAndSalary: true,
            schoolCollections: true,
            cooperativeEsusu: true,
            coptellerBridge: true,
            agencyPos: true,
            smartCards: true,
            merchantApiAndPayroll: true,
            workflowEngine: true,
        },
        heroSlides: [
            {
                id: "pillar",
                badge: "Abia State's Financial Pillar",
                headlineTop: "Abia State's",
                headlineAccent: "Financial Pillar.",
                body: "Backing thousands of entrepreneurs across Aba and Umuahia with accessible micro-credit, savings wallets, and fast digital banking infrastructure.",
                ctaLabel: "Open Your Account",
                ctaHref: "/auth/sign-up",
                ctaSecondaryLabel: "Explore Banking",
                ctaSecondaryHref: "/personal-banking",
                highlights: [
                    { value: "Umuahia & Aba", label: "Core Trade Hubs" },
                    { value: "CBN Licensed", label: "Regulated Custody" },
                    { value: "Single-Digit", label: "MSME Support" },
                ],
                orbA: "bg-primary/25",
                orbB: "bg-emerald-500/20",
                accentGradient: "from-primary via-primary/80 to-accent",
                floatCardTitle: "Umuahia Head Office",
                floatCardSub: "MSME & Trade Union Banking",
            },
            {
                id: "trade",
                badge: "State-of-the-Art Banking",
                headlineTop: "Modernizing Abia Trade.",
                headlineAccent: "Seeding Co-ops.",
                body: "AbiaSME MFB powers digitized Esusu thrifts, local trade unions, and market merchants with secure loans, smart cards, and agency banking solutions.",
                ctaLabel: "Unions & Business Suite",
                ctaHref: "/business",
                ctaSecondaryLabel: "Esusu Calculator",
                ctaSecondaryHref: "/business#esusu",
                highlights: [
                    { value: "Esusu Vaults", label: "Rotational Thrift" },
                    { value: "Instant", label: "Bank Clearing" },
                    { value: "API Ready", label: "Merchant Pay" },
                ],
                orbA: "bg-emerald-500/25",
                orbB: "bg-primary/20",
                accentGradient: "from-emerald-500 via-primary/80 to-primary",
                floatCardTitle: "Digital Esusu Live",
                floatCardSub: "Automated Cooperative Rotations",
            },
        ],
        whyChoose: {
            title: "Why Choose AbiaSME MFB?",
            subtitle: "Dedicated financial rails engineered for Abia entrepreneurs, trade associations, and artisans.",
            cards: [
                { title: "Single-Digit MSME Focus", desc: "Structured capital tailored to help traders, leatherworks, and agro processors scale." },
                { title: "Digital Esusu & Guilds", desc: "Automated rotational thrift cycles and multi-signature union treasuries." },
                { title: "Neighborhood POS Agency", desc: "Licensed banking cashpoints placed right inside commercial markets." },
            ],
        },
        spotlight: {
            badge: "Community Impact",
            headlineTop: "More than a bank,",
            headlineItalic: "a partner in growth.",
            description:
                "Backing artisans, market merchants, and trade cooperatives across Abia State with modern liquidity rails and accessible enterprise credit.",
            ctaLabel: "Read Our Mission Story",
            ctaHref: "/company",
            quoteHeading: "State-of-the-Art Banking",
            quoteSub: "Security you can trust",
            quoteBody:
                "Our goal is to ensure every micro-entrepreneur has access to the digital tools and capital needed to compete regionally and globally.",
            attributionName: "Management Team",
            attributionRole: "AbiaSMEMFB",
        },
        testimonials: [
            { quote: "Our leather guild runs all weekly thrift contributions transparently through AbiaSME MFB.", author: "Chukwuemeka O.", role: "Trade Guild Chairman" },
            { quote: "Agent POS settlements clear reliably without manual reconciliation.", author: "Blessing N.", role: "POS Super-Agent" },
            { quote: "Fast SME working capital helped expand our inventory ahead of peak season.", author: "Uchenna K.", role: "Merchant Partner" },
        ],
        mandate: {
            badge: "Visionary Leadership",
            titleTop: "The Mandate:",
            titleAccent: "Fueling Economic Growth",
            summary:
                "Abia State Microfinance Bank Limited (AbiaSMEMFB) integrates entrepreneurs and SMEs into a shared digital platform with accessible enterprise finance.",
            vision:
                "To be a model in people empowerment and wealth creation, setting the standard for microfinance excellence.",
            mission:
                "To provide banking services in an efficient manner in order to add lasting value to customers and stakeholders.",
            whoWeAre:
                "A CBN licensed microfinance bank established to provide comprehensive banking services integrating state and trade economies.",
            patronName: "H.E. Alex Otti",
            patronRole: "Governor, Abia State",
            patronStatement:
                "Strategic positioning, infrastructure development, access to finance, and digital transformation for Abia MSMEs and artisans.",
            secondaryStatement:
                "Creating jobs, strengthening local trade unions, and driving sustained regional economic prosperity.",
            hqImageSrc: "/images/elephant-1.png",
            portraitImageSrc: "/images/otti.png",
            historyMilestones: [
                { date: "Inception", title: "AbiaMSME Foundation", desc: "Established to provide grassroots financial access across Abia commercial belts." },
                { date: "Digital Transformation", title: "Esusu & Core Upgrade", desc: "Launched digitized cooperative wallets, merchant checkouts, and Qore core sync." },
            ],
            coreValues: [
                { title: "Integrity", desc: "Transparent microfinance governance." },
                { title: "MSME Growth", desc: "Dedicated support for traders and artisans." },
                { title: "Innovation", desc: "Digital Esusu, POS agency, and instant settlement." },
            ],
            leadership: [
                { name: "Executive Management", role: "AbiaSMEMFB Leadership" },
            ],
            partners: ["Qore", "NIBSS", "Interswitch", "NDIC"],
        },
        branches: [
            { name: "Umuahia HQ", role: "Executive Lounge & Treasury", location: "Government Station Layout, Umuahia", posTop: "32%", posLeft: "52%", featured: true },
            { name: "Aba Ariaria Hub", role: "MSME & Artisan Trade Desk", location: "Ariaria Market Corridor, Aba", posTop: "65%", posLeft: "40%" },
            { name: "Ekeoha Shopping Centre", role: "Merchant & POS Service Point", location: "Aba Central Commercial District", posTop: "56%", posLeft: "62%" },
        ],
        authCycles: [
            {
                headline: "Your Financial Future Starts Here.",
                sub: "Empowering entrepreneurs and artisans with secure, modern, and accessible banking rails.",
                accent: "from-emerald-400 via-white to-amber-300",
                orbA: "bg-emerald-500/30",
                orbB: "bg-amber-500/20",
                features: ["CBN Licensed & NDIC Insured", "PCI-DSS Secure Transactions"],
            },
        ],
        authMetrics: [
            { value: "Esusu", label: "Co-op Wallets" },
            { value: "*5125#", label: "USSD Banking" },
            { value: "POS", label: "Agency Fleet" },
            { value: "24/7", label: "Web & App" },
        ],
    },
    {
        id: "apex-union",
        shortName: "APEX MFB",
        wordmarkPrimary: "Apex Union",
        wordmarkSecondary: "MFB",
        legalName: "Apex Union Microfinance Bank Limited",
        tagline: "Modern Digital Banking for Enterprises & Communities.",
        heroDescription:
            "A clean national white-label template demonstrating instant digital onboarding, salary & MSME credit, school & enterprise collections, and multi-channel agency banking.",
        licenseBadge: "Licensed by the Central Bank of Nigeria · Insured by NDIC",
        foundedYear: "2018",
        holdingEntity: "Apex Financial Holdings",
        defaultPalette: "ocean",
        logoVariant: "shield",
        themeStyle: {
            useBrandedDarkNav: false,
            useBrandedDarkHero: true,
            showTopUtilityBar: true,
            topBarBgHex: "#0c4a6e",
            heroBgHex: "#075985",
            accentHex: "#fb923c",
        },
        domain: "apexunionmfb.ng",
        supportEmail: "hello@apexunionmfb.ng",
        whistleblowerEmail: "compliance@apexunionmfb.ng",
        supportPhones: ["+234 (0) 700 APEX MFB"],
        addressLines: [
            "Plot 18 Central Business District",
            "Victoria Island",
            "Lagos, Nigeria",
        ],
        regionLabel: "National Commercial Corridors",
        ussdCode: "*829*100#",
        internalBankCode: "090500",
        internalPayBrand: "Apex Pay",
        posBrandName: "APEX AGENCY POS",
        demoAccountNumber: "1004928170",
        demoAccountLabel: "Current Business (1004...8170)",
        demoCoopName: "National Commerce & Trade Guild",
        taxSampleAuthority: "FIRS / State IRS Payroll Remittance",
        enabledModules: {
            retailAndSalary: true,
            schoolCollections: true,
            cooperativeEsusu: true,
            coptellerBridge: true,
            agencyPos: true,
            smartCards: true,
            merchantApiAndPayroll: true,
            workflowEngine: true,
        },
        heroSlides: [
            {
                id: "core",
                badge: "White-Label BankSuite Template",
                headlineTop: "Complete Banking.",
                headlineAccent: "Ready to Deploy.",
                body: "Omnichannel retail accounts, school collections, bulk payroll, cooperative thrift vaults, agency POS, and smart debit cards tailored to your institution's identity.",
                ctaLabel: "Open Account",
                ctaHref: "/auth/sign-up",
                ctaSecondaryLabel: "Explore Suite",
                ctaSecondaryHref: "/business",
                highlights: [
                    { value: "*829*100#", label: "USSD Rail" },
                    { value: "PCI-DSS", label: "Card Engine" },
                    { value: "API Core", label: "Qore / NIBSS" },
                ],
                orbA: "bg-sky-500/25",
                orbB: "bg-orange-500/20",
                accentGradient: "from-sky-300 via-white to-orange-300",
                floatCardTitle: "Apex Union CBD",
                floatCardSub: "Full-Stack White-Label Demo",
            },
        ],
        whyChoose: {
            title: "Why Partner with Apex Union MFB?",
            subtitle: "Enterprise microfinance infrastructure designed for high-growth teams and institutions.",
            cards: [
                { title: "Fast Deployment", desc: "White-label web, mobile, and agency banking ready out of the box." },
                { title: "Institutional Custody", desc: "Segregated settlement accounts for schools, associations, and SMEs." },
                { title: "Full Omnichannel", desc: "App, Web, Contactless Cards, USSD, and API Webhooks on one core." },
            ],
        },
        spotlight: {
            badge: "Digital Inclusion",
            headlineTop: "Built for speed,",
            headlineItalic: "trusted for custody.",
            description:
                "Equipping regional microfinance banks with turnkey mobile, web, USSD, agency banking, and collection rails in weeks instead of years.",
            ctaLabel: "Company Profile",
            ctaHref: "/company",
            quoteHeading: "Turnkey MFB Suite",
            quoteSub: "CBN & NDIC Aligned",
            quoteBody:
                "Every module — from core ledger synchronization to school fee portals and POS agent settlement — runs seamlessly on a single white-label platform.",
            attributionName: "Executive Architecture Team",
            attributionRole: "Apex Union MFB",
        },
        testimonials: [
            { quote: "Deploying our branded web and mobile portal transformed customer onboarding turnaround.", author: "Adaeze O.", role: "Head of Digital Banking" },
            { quote: "Automated settlements reduced manual back-office reconciliation across branches.", author: "Tunde B.", role: "Finance Controller" },
            { quote: "Parents and school bursars adopted the digital fee portal in days.", author: "Mrs. Danjuma", role: "Institutional Administrator" },
        ],
        mandate: {
            badge: "Institutional Overview",
            titleTop: "The Mandate:",
            titleAccent: "Inclusive Prosperity",
            summary:
                "Apex Union MFB combines prudent credit risk governance with real-time digital distribution for individuals, schools, cooperatives, and SMEs.",
            vision: "To deliver frictionless financial access to every community and growing business.",
            mission: "Reliable digital banking backed by responsive relationship officers and transparent fees.",
            whoWeAre: "A digital-first national microfinance institution powered by the BankSuite Core.",
            patronName: "Apex Union Board of Directors",
            patronRole: "Governance & Risk Committee",
            patronStatement: "Engineered for rapid branch expansion, automated reconciliations, and institutional treasury clarity.",
            secondaryStatement: "Seamless onboarding from BVN lookup to physical/virtual debit card issuance.",
            hqImageSrc: "/images/abia-tower.jpg",
            historyMilestones: [
                { date: "2018", title: "Apex Union Incorporated", desc: "Launched commercial microfinance services across Lagos and Abuja." },
            ],
            coreValues: [
                { title: "Speed", desc: "Rapid digital account opening and credit decisions." },
                { title: "Clarity", desc: "Zero hidden charges across personal and business accounts." },
            ],
            leadership: [
                { name: "Apex Board & Management", role: "Victoria Island HQ" },
            ],
            partners: ["NIBSS", "Remita", "Interswitch", "NDIC"],
        },
        branches: [
            { name: "Victoria Island HQ", role: "Headquarters & Corporate Desk", location: "Victoria Island, Lagos", posTop: "55%", posLeft: "36%", featured: true },
            { name: "Abuja Regional Hub", role: "FCT Institutional Desk", location: "Wuse II, Abuja", posTop: "32%", posLeft: "56%" },
            { name: "Port Harcourt Lounge", role: "South-South Enterprise Desk", location: "GRA Phase II", posTop: "70%", posLeft: "60%" },
        ],
        authCycles: [
            {
                headline: "Modern Microfinance, Reimagined.",
                sub: "Accounts, credit, collections, and merchant tools orchestrated cleanly under one roof.",
                accent: "from-sky-400 via-white to-amber-300",
                orbA: "bg-sky-500/30",
                orbB: "bg-orange-500/20",
                features: ["CBN Licensed & NDIC Insured", "Real-Time Core Banking Sync"],
            },
        ],
        authMetrics: [
            { value: "Core", label: "Qore / NIBSS" },
            { value: "Cards", label: "Visa / MC / Verve" },
            { value: "Esusu", label: "Co-op Engine" },
            { value: "POS", label: "Agent Fleet" },
        ],
    },
    {
        id: "maxitrust",
        shortName: "Maxitrust MFB",
        wordmarkPrimary: "Maxitrust",
        wordmarkSecondary: "MFB",
        legalName: "Maxitrust Microfinance Bank Limited",
        tagline: "Trusted Capital for Fast-Growing Enterprises",
        heroDescription:
            "Maxitrust Microfinance Bank delivers accessible savings, MSME working capital, specialized impact credit (including Maxi-Wash), agency cashpoints, and 24/7 digital banking across Port Harcourt and Nigeria.",
        licenseBadge: "CBN Licensed Microfinance Bank (Est. Oct 2008) · NDIC Insured",
        foundedYear: "2008",
        holdingEntity: "Maxitrust Financial Holdings",
        defaultPalette: "nature",
        logoVariant: "maxitrust-emblem",
        themeStyle: {
            useBrandedDarkNav: true,
            useBrandedDarkHero: true,
            showTopUtilityBar: true,
            topBarBgHex: "#032615",
            heroBgHex: "#064E29",
            accentHex: "#F59E0B",
        },
        domain: "maxitrustbank.com",
        supportEmail: "info@maxitrustbank.com",
        whistleblowerEmail: "compliance@maxitrustbank.com",
        supportPhones: ["+234 803 740 1500", "+234 84 461 820"],
        addressLines: [
            "No. 15B Agudama Street, D-Line",
            "Port Harcourt, Rivers State",
        ],
        regionLabel: "Port Harcourt HQ & Rivers Corridor",
        ussdCode: "*614*204#",
        internalBankCode: "090302",
        internalPayBrand: "Maxitrust Pay",
        posBrandName: "MAXITRUST AGENT POS",
        demoAccountNumber: "2040118932",
        demoAccountLabel: "MSME Working Capital Current",
        demoCoopName: "Port Harcourt SME Traders Cooperative",
        taxSampleAuthority: "Rivers State Internal Revenue",
        enabledModules: {
            retailAndSalary: true,
            schoolCollections: true,
            cooperativeEsusu: true,
            coptellerBridge: true,
            agencyPos: true,
            smartCards: true,
            merchantApiAndPayroll: true,
            workflowEngine: true,
        },
        heroSlides: [
            {
                id: "msme-growth",
                badge: "Maxitrust Digital Core · Port Harcourt HQ",
                headlineTop: "Empowering MSMEs With",
                headlineAccent: "Trusted Capital.",
                body: "Serving Port Harcourt entrepreneurs, traders, salaried workers, cooperatives, and underserved communities with instant accounts, working capital, and agency cashpoints since 2008.",
                ctaLabel: "Open Account",
                ctaHref: "/auth/register",
                ctaSecondaryLabel: "Explore Digital Channels",
                ctaSecondaryHref: "/internet-banking",
                highlights: [
                    { value: "Since 2008", label: "CBN Licensed Operations" },
                    { value: "D-Line PH", label: "Port Harcourt Head Office" },
                    { value: "MSME + WASH", label: "Targeted Credit Suites" },
                    { value: "*614*204#", label: "24/7 Offline USSD" },
                ],
                orbA: "bg-emerald-500/25",
                orbB: "bg-amber-400/20",
                accentGradient: "from-[#F59E0B] via-white to-emerald-200",
                floatCardTitle: "Maxitrust Collect Live",
                floatCardSub: "Instant merchant, cooperative & utility settlements across Rivers State",
            },
            {
                id: "impact-credit",
                badge: "Maxi-Wash & Enterprise Credit",
                headlineTop: "Structured Credit.",
                headlineAccent: "Rapid Turnaround.",
                body: "Access MSME restocking loans, targeted WASH community infrastructure facilities, and payroll-backed personal credit with transparent repayment schedules.",
                ctaLabel: "Apply for Facility",
                ctaHref: "/business",
                ctaSecondaryLabel: "About Maxitrust",
                ctaSecondaryHref: "/company",
                highlights: [
                    { value: "24–48h", label: "SME Underwriting Speed" },
                    { value: "NDIC", label: "Protected Depositor Vaults" },
                    { value: "Maxi-Wash", label: "Impact Lending Partner" },
                    { value: "Zero", label: "Hidden Fee Maintenance" },
                ],
                orbA: "bg-amber-400/25",
                orbB: "bg-emerald-400/20",
                accentGradient: "from-amber-300 via-white to-emerald-300",
                floatCardTitle: "Automated Credit Ledger",
                floatCardSub: "Real-time behavioral scoring connected to NIBSS & BVN clearing",
            },
        ],
        whyChoose: {
            title: "Why Bank With Maxitrust MFB?",
            subtitle: "Over 15 years of prudential stewardship fueling MSMEs, cooperatives, and households across Port Harcourt and beyond.",
            cards: [
                {
                    title: "Proven Since October 2008",
                    desc: "Built on disciplined microfinance governance, CBN licensing, NDIC deposit protection, and deep roots in Rivers State commerce.",
                },
                {
                    title: "Inclusive MSME & Impact Credit",
                    desc: "From market restocking and artisan equipment to Maxi-Wash community water initiatives, credit is tailored for real-world cashflow.",
                },
                {
                    title: "Unified Omnichannel Core",
                    desc: "Instant bank accounts, POS agent float, contactless cards, bulk payroll, and *614*204# USSD unified on one platform.",
                },
            ],
        },
        spotlight: {
            badge: "Flagship MSME & Impact Suite",
            headlineTop: "Banking That Meets",
            headlineItalic: "Every Trader Where They Work.",
            description:
                "Whether operating out of D-Line, Igwuruta, Trans-Amadi, or digital storefronts nationwide, Maxitrust MFB equips businesses with collections, payroll, and rapid credit.",
            ctaLabel: "Open a Maxitrust Account",
            ctaHref: "/auth/register",
            quoteHeading: "Enterprise Focus",
            quoteSub: "Inclusive Growth Charter",
            quoteBody:
                "\"Expanding reliable credit and low-friction digital payments to micro-entrepreneurs and productive households across our communities.\"",
            attributionName: "Maxitrust Leadership",
            attributionRole: "No. 15B Agudama Street, D-Line",
        },
        testimonials: [
            {
                quote: "Maxitrust financed our inventory expansion within 48 hours of submitting our business cashflow records.",
                author: "Chidi E.",
                role: "D-Line Wholesale Distributor",
            },
            {
                quote: "Our Igwuruta traders cooperative collects daily thrift seamlessly without cash leakages using Maxitrust digital vaults.",
                author: "Blessing W.",
                role: "Cooperative Treasurer",
            },
            {
                quote: "Customer alerts, agency POS settlement, and relationship officer support have been rock-solid.",
                author: "Tamuno I.",
                role: "Port Harcourt Pharmacy Owner",
            },
        ],
        mandate: {
            badge: "Institutional Profile",
            titleTop: "The Charter:",
            titleAccent: "Inclusive Prosperity",
            summary:
                "Commencing operations in October 2008, Maxitrust Microfinance Bank Limited bridges capital gaps for micro-enterprises, artisans, salary earners, and underserved markets.",
            vision: "To be a benchmark community-focused microfinance institution empowering sustainable livelihoods across Nigeria.",
            mission: "Delivering responsive credit, safe savings, and inclusive digital banking services with integrity and speed.",
            whoWeAre:
                "Maxitrust Microfinance Bank Limited is a CBN-licensed microfinance institution headquartered at No. 15B Agudama Street, D-Line, Port Harcourt, with branch and agent outreach spanning Igwuruta and regional commercial corridors.",
            patronName: "Board & Executive Management",
            patronRole: "Maxitrust MFB Limited",
            patronStatement:
                "We combine disciplined risk underwriting with accessible field relationship banking so viable MSMEs never stall for lack of working capital.",
            secondaryStatement:
                "From developmental programs like Maxi-Wash to automated cooperative thrift and merchant APIs, every rail prioritizes measurable community prosperity.",
            hqImageSrc: "/images/abia-tower.jpg",
            historyMilestones: [
                {
                    date: "October 2008",
                    title: "Commencement of Banking Operations",
                    desc: "Licensed to carry out microfinance banking operations, opening doors to Port Harcourt traders, artisans, and households.",
                },
                {
                    date: "2016",
                    title: "D-Line Headquarters & Igwuruta Outreach",
                    desc: "Strengthened anchor presence on Agudama Street, D-Line alongside peri-urban credit expansion across Igwuruta.",
                },
                {
                    date: "2022",
                    title: "Specialized Impact Lending (Maxi-Wash)",
                    desc: "Partnered on targeted developmental facilities expanding access to clean water, sanitation, and small business resilience.",
                },
                {
                    date: "Present",
                    title: "Next-Gen White-Label Digital Core",
                    desc: "Full NIBSS instant transfers, cooperative Esusu automation, smart cards, agency POS fleet, and 24/7 digital banking.",
                },
            ],
            coreValues: [
                { title: "Trust", desc: "Earned daily through transparent pricing and zero hidden deductions." },
                { title: "Enterprise", desc: "Dedicated focus on productive micro, small, and medium businesses." },
                { title: "Integrity", desc: "Full compliance with CBN prudential guidelines and NDIC safeguards." },
                { title: "Accessibility", desc: "Serving D-Line, Igwuruta, and remote hubs via POS and *614*204# USSD." },
                { title: "Agility", desc: "Fast credit assessment tailored to real business turnover." },
                { title: "Community Impact", desc: "Support for household resilience and clean infrastructure credit." },
            ],
            leadership: [
                { name: "Board of Directors", role: "Governance & Strategy" },
                { name: "Executive Management", role: "D-Line Head Office, PH" },
                { name: "Credit & Impact Desk", role: "MSME & Maxi-Wash Underwriting" },
            ],
            partners: ["NIBSS", "Interswitch", "Remita", "NDIC"],
        },
        branches: [
            { name: "D-Line Head Office", role: "Corporate HQ & MSME Desk", location: "15B Agudama St, D-Line, PH", posTop: "56%", posLeft: "46%", featured: true },
            { name: "Igwuruta Branch", role: "Retail & Cooperative Center", location: "Igwuruta, Rivers State", posTop: "38%", posLeft: "56%" },
            { name: "Trans-Amadi Hub", role: "Industrial & SME Desk", location: "Port Harcourt", posTop: "68%", posLeft: "36%" },
            { name: "FCT Liaison Desk", role: "Institutional & Regulatory", location: "Abuja", posTop: "24%", posLeft: "48%" },
        ],
        authCycles: [
            {
                headline: "Fueling Growth Across Port Harcourt & Beyond.",
                sub: "From D-Line merchants to national SMEs, manage liquidity, cooperative thrift, and credit on one platform.",
                accent: "from-emerald-400 via-white to-amber-300",
                orbA: "bg-emerald-500/30",
                orbB: "bg-amber-500/20",
                features: ["CBN Licensed Since Oct 2008", "Instant BVN Onboarding & Transfers"],
            },
            {
                headline: "MSME Credit & Community Impact.",
                sub: "Rapid working-capital scoring, cooperative pools, and agency POS liquidity synced 24/7.",
                accent: "from-amber-300 via-white to-emerald-400",
                orbA: "bg-amber-500/25",
                orbB: "bg-emerald-500/25",
                features: ["Maxi-Wash & SME Facilities", "Automated Payroll & Remittance"],
            },
        ],
        authMetrics: [
            { value: "Oct 2008", label: "Est. Charter" },
            { value: "D-Line", label: "Port Harcourt HQ" },
            { value: "*614*204#", label: "USSD Banking" },
            { value: "NDIC", label: "Insured Deposits" },
        ],
    },
]

export function mergeBankProfile(
    base: BankProfile,
    override?: BankProfileOverride | null
): BankProfile {
    if (!override) return base
    return {
        ...base,
        ...override,
        id: base.id,
        enabledModules: {
            ...base.enabledModules,
            ...(override.enabledModules || {}),
            coptellerBridge:
                override.enabledModules?.coptellerBridge ??
                base.enabledModules?.coptellerBridge ??
                true,
        },
        themeStyle: {
            ...base.themeStyle,
            ...(override.themeStyle || {}),
        },
    }
}

export function resolveBankProfile(
    profileId?: string | null,
    customProfiles: BankProfile[] = [],
    profileOverrides: Record<string, BankProfileOverride> = {},
    fallbackId: string = DEFAULT_BANK_PROFILE_ID
): BankProfile {
    const all = [...PRESET_BANK_PROFILES, ...customProfiles]
    const base =
        all.find((p) => p.id === profileId) ||
        all.find((p) => p.id === fallbackId) ||
        PRESET_BANK_PROFILES[0]
    return mergeBankProfile(base, profileOverrides[base.id])
}
