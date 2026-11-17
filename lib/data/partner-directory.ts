/**
 * lib/data/partner-directory.ts
 * Master Registry of Institutional Partners, Government Bodies, NGOs, and Accredited Facilities.
 * Multi-sector: Healthcare, Mobility/Transport, Agriculture, Enterprise Development, and Corporate OEMs.
 */

export interface PartnerSubscope {
    id: string;
    code: string;
    name: string;
    description: string;
    zone?: 'Aba' | 'Umuahia' | 'Ohafia' | 'Osisioma' | 'Ukwa' | 'Statewide';
    activeBeneficiaries: number;
    deployedFloatKobo: number;
}

export interface DeskOfficer {
    id: string;
    name: string;
    title: string;
    email: string;
    phone: string;
    isLead: boolean;
}

export interface EscrowAccount {
    accountNumber: string;
    bankName: string;
    accountName: string;
    availableFloatKobo: number;
}

export interface InstitutionalPartner {
    id: string;
    slug: string;
    name: string;
    shortName: string;
    category: 'government_agency' | 'development_parastatal' | 'multilateral_ngo' | 'corporate_oem' | 'financial_institution';
    sector: 'health' | 'transport' | 'agriculture' | 'commerce' | 'energy' | 'multi_sector';
    regNumber: string;
    mandate: string;
    badgeLabel: string;
    badgeColor: string;
    hqAddress: string;
    contactEmail: string;
    contactPhone: string;
    escrowAccount: EscrowAccount;
    deskOfficers: DeskOfficer[];
    subscopes: PartnerSubscope[];
    totalCommittedKobo: number;
    totalDisbursedKobo: number;
    activeBeneficiariesCount: number;
    activeProgramsCount: number;
    verifiedStatus: 'verified' | 'active' | 'pending_mou';
    logoIcon: string;
    accreditedProviderCount: number;
}

export interface AccreditedProvider {
    id: string;
    partnerId: string;
    partnerSlug: string;
    name: string;
    category: 'tertiary_hospital' | 'general_hospital' | 'primary_health_centre' | 'specialist_clinic' | 'fleet_inspection_workshop' | 'agro_inputs_depot';
    sector: 'health' | 'transport' | 'agriculture';
    facilityCode: string;
    zone: 'Aba' | 'Umuahia' | 'Ohafia' | 'Osisioma' | 'Ukwa';
    lga: string;
    address: string;
    headOfFacility?: string;
    phone: string;
    capacityBedsOrBays: number;
    status: 'accredited' | 'active' | 'under_review';
    servicesOffered: string[];
}

export const INSTITUTIONAL_PARTNERS: InstitutionalPartner[] = [
    {
        id: "partner_abshia",
        slug: "abshia",
        name: "Abia State Health Insurance Agency (ABSHIA)",
        shortName: "ABSHIA",
        category: "government_agency",
        sector: "health",
        regNumber: "ABSHIA/LAW-NO4/2019",
        mandate: "Universal, affordable social health insurance coverage and primary care access for Abia State informal sector cooperatives.",
        badgeLabel: "Abia State Social Health",
        badgeColor: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
        hqAddress: "State Secretariat Complex, Ogurube Layout, Umuahia, Abia State",
        contactEmail: "enrolment@abshia.abia.gov.ng",
        contactPhone: "0803 400 9281",
        escrowAccount: {
            accountNumber: "3000881920",
            bankName: "Abia State Microfinance Bank",
            accountName: "ABSHIA Social Health Statutory Escrow",
            availableFloatKobo: 10150000000
        },
        deskOfficers: [
            { id: "off_ab_1", name: "Dr. Kalu Ndukwe", title: "Executive Secretary & CMD Desk", email: "kndukwe@abshia.abia.gov.ng", phone: "0803 400 9281", isLead: true },
            { id: "off_ab_2", name: "Mrs. Chinyere Nwosu", title: "Head of Informal Sector Enrollment", email: "cnwosu@abshia.abia.gov.ng", phone: "0803 551 2891", isLead: false },
            { id: "off_ab_3", name: "Pharm. Obinna Eze", title: "Provider Claims & Hospital Audit Lead", email: "claims@abshia.abia.gov.ng", phone: "0814 220 8910", isLead: false }
        ],
        subscopes: [
            { id: "sub_abshia_apex", code: "ABSHIA-APEX", name: "Statewide Apex Pool", description: "Consolidated macro statutory float pool and state underwriting", zone: "Statewide", activeBeneficiaries: 3820, deployedFloatKobo: 4850000000 },
            { id: "sub_abshia_aba", code: "ABSHIA-ABA", name: "Aba Urban Commercial Desk", description: "Artisan, shoemaker & market guild enrollees (ABSUTH, Living Word, St. Anthony's)", zone: "Aba", activeBeneficiaries: 2240, deployedFloatKobo: 2950000000 },
            { id: "sub_abshia_umuahia", code: "ABSHIA-UMU", name: "Umuahia Capital Directorate", description: "Civil service dependents and Umuahia North/South cooperatives (FMC Umuahia)", zone: "Umuahia", activeBeneficiaries: 1080, deployedFloatKobo: 1380000000 },
            { id: "sub_abshia_rural", code: "ABSHIA-RUR", name: "Rural Primary Care Desk", description: "Ohafia, Bende & Ukwa farming clusters (Cottage hospitals & PHCs)", zone: "Ukwa", activeBeneficiaries: 500, deployedFloatKobo: 520000000 }
        ],
        totalCommittedKobo: 15000000000, // ₦150M statutory risk float
        totalDisbursedKobo: 4850000000,  // ₦48.5M active float
        activeBeneficiariesCount: 3820,
        activeProgramsCount: 3,
        verifiedStatus: "verified",
        logoIcon: "HeartPulse",
        accreditedProviderCount: 10
    },
    {
        id: "partner_abia_transport",
        slug: "abia-transport",
        name: "Abia State Ministry of Transport & ATMA",
        shortName: "Ministry of Transport",
        category: "government_agency",
        sector: "transport",
        regNumber: "AB/MOT/PAR-2022/19",
        mandate: "Urban mobility formalization, commercial vehicle inspection telemetry, and clean commercial tricycle lease subventions.",
        badgeLabel: "Abia State Ministry of Transport",
        badgeColor: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
        hqAddress: "Ministry of Transport Block, Government Secretariat, Umuahia",
        contactEmail: "mobility@abia.gov.ng",
        contactPhone: "0812 390 1192",
        escrowAccount: {
            accountNumber: "3000882104",
            bankName: "Abia State Microfinance Bank",
            accountName: "Ministry of Transport ATMA Transit Escrow",
            availableFloatKobo: 26800000000
        },
        deskOfficers: [
            { id: "off_mot_1", name: "Engr. Chidi Amadi", title: "Director of Transport Telemetry", email: "amadi@transport.abia.gov.ng", phone: "0812 390 1192", isLead: true },
            { id: "off_mot_2", name: "Chief Mike Onuoha", title: "ATMA Zonal Commander Aba", email: "aba-command@atma.abia.gov.ng", phone: "0805 771 2019", isLead: false }
        ],
        subscopes: [
            { id: "sub_mot_apex", code: "MOT-APEX", name: "Central Mobility Command", description: "Statewide transport permit licensing and roadworthiness telemetry", zone: "Statewide", activeBeneficiaries: 1450, deployedFloatKobo: 18200000000 },
            { id: "sub_mot_aba_fleet", code: "MOT-ABA", name: "Aba Commercial Fleet Command", description: "Commercial tricycle and intra-city minibus inspection and speed governor telemetry", zone: "Aba", activeBeneficiaries: 1100, deployedFloatKobo: 14200000000 },
            { id: "sub_mot_umuahia", code: "MOT-UMU", name: "Umuahia Capital Fleet Command", description: "Inter-state bus terminal and urban taxi inspection telemetry", zone: "Umuahia", activeBeneficiaries: 350, deployedFloatKobo: 4000000000 }
        ],
        totalCommittedKobo: 45000000000, // ₦450M
        totalDisbursedKobo: 18200000000, // ₦182M
        activeBeneficiariesCount: 1450,
        activeProgramsCount: 2,
        verifiedStatus: "verified",
        logoIcon: "Truck",
        accreditedProviderCount: 3
    },
    {
        id: "partner_smedan",
        slug: "smedan",
        name: "Small & Medium Enterprises Development Agency of Nigeria (SMEDAN)",
        shortName: "SMEDAN",
        category: "development_parastatal",
        sector: "commerce",
        regNumber: "SMEDAN/ACT/2003-FED",
        mandate: "National enterprise capacity acceleration, artisan tooling matching grants, and informal sector micro-credit matching tranches.",
        badgeLabel: "SMEDAN Federal Facility",
        badgeColor: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
        hqAddress: "SMEDAN Abia Industrial Development Centre, Old Express Rd, Aba",
        contactEmail: "southeast@smedan.gov.ng",
        contactPhone: "0802 881 0021",
        escrowAccount: {
            accountNumber: "3000883391",
            bankName: "Abia State Microfinance Bank",
            accountName: "SMEDAN / Abia Artisan Matching Grant Facility",
            availableFloatKobo: 13000000000
        },
        deskOfficers: [
            { id: "off_sm_1", name: "Dr. Grace Okpara", title: "South-East Regional Coordinator", email: "gokpara@smedan.gov.ng", phone: "0802 881 0021", isLead: true },
            { id: "off_sm_2", name: "Engr. Kalu Udensi", title: "IDC Tooling Technical Manager", email: "kudensi@smedan.gov.ng", phone: "0803 881 2940", isLead: false }
        ],
        subscopes: [
            { id: "sub_smedan_apex", code: "SMEDAN-APEX", name: "National MSME Matching Facility", description: "Federal artisan tooling grants and enterprise subventions", zone: "Statewide", activeBeneficiaries: 2190, deployedFloatKobo: 12000000000 },
            { id: "sub_smedan_artisan", code: "SMEDAN-ABA", name: "Aba IDC Artisan Tooling Desk", description: "Machinery matching for leather-workers, shoe manufacturers and metal fabricators", zone: "Aba", activeBeneficiaries: 1650, deployedFloatKobo: 9100000000 },
            { id: "sub_smedan_women", code: "SMEDAN-WOMEN", name: "Women in Trade Revolving Desk", description: "Micro-working capital matching for retail cooperative guilds", zone: "Umuahia", activeBeneficiaries: 540, deployedFloatKobo: 2900000000 }
        ],
        totalCommittedKobo: 25000000000, // ₦250M
        totalDisbursedKobo: 12000000000, // ₦120M
        activeBeneficiariesCount: 2190,
        activeProgramsCount: 4,
        verifiedStatus: "verified",
        logoIcon: "Award",
        accreditedProviderCount: 2
    },
    {
        id: "partner_usaid_agro",
        slug: "usaid-agro",
        name: "USAID / Feed the Future Agribusiness Alliance",
        shortName: "USAID Agribusiness",
        category: "multilateral_ngo",
        sector: "agriculture",
        regNumber: "USAID-NIG-AGRO-2021",
        mandate: "Smallholder agro-input matching grants, climate-smart drip irrigation tranches, and grain aggregation storage subventions.",
        badgeLabel: "USAID Feed the Future",
        badgeColor: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
        hqAddress: "Regional Agricultural Resource Office, Bende Road, Umuahia",
        contactEmail: "abia-grants@feedthefuture-nigeria.org",
        contactPhone: "0807 990 4421",
        escrowAccount: {
            accountNumber: "3000884019",
            bankName: "Abia State Microfinance Bank",
            accountName: "Feed the Future Smallholder Input Escrow",
            availableFloatKobo: 28600000000
        },
        deskOfficers: [
            { id: "off_us_1", name: "Dr. Nkechi Nwosu", title: "Abia ADP Extension Coordinator", email: "nwosu@feedthefuture-nigeria.org", phone: "0807 990 4421", isLead: true },
            { id: "off_us_2", name: "Mark Thompson", title: "USAID Chief of Party", email: "mthompson@usaid.gov", phone: "0800 74622 887", isLead: false }
        ],
        subscopes: [
            { id: "sub_usaid_apex", code: "USAID-APEX", name: "Agribusiness Alliance Statewide", description: "Smallholder agro-input subventions and grain aggregation guarantees", zone: "Statewide", activeBeneficiaries: 1140, deployedFloatKobo: 9400000000 },
            { id: "sub_usaid_seeds", code: "USAID-INPUTS", name: "Certified Seed & Fertilizer Voucher Desk", description: "50% non-repayable input grants for cassava and grain clusters", zone: "Umuahia", activeBeneficiaries: 850, deployedFloatKobo: 7100000000 },
            { id: "sub_usaid_irrigation", code: "USAID-IRRIG", name: "Climate-Smart Irrigation Desk", description: "Dry-season solar drip irrigation subvention tranches", zone: "Ohafia", activeBeneficiaries: 290, deployedFloatKobo: 2300000000 }
        ],
        totalCommittedKobo: 38000000000, // ₦380M
        totalDisbursedKobo: 9400000000,  // ₦94M
        activeBeneficiariesCount: 1140,
        activeProgramsCount: 2,
        verifiedStatus: "verified",
        logoIcon: "Wheat",
        accreditedProviderCount: 2
    },
    {
        id: "partner_simba_tvs",
        slug: "simba-tvs",
        name: "Simba Group & TVS Motors Nigeria",
        shortName: "Simba / TVS Alliance",
        category: "corporate_oem",
        sector: "transport",
        regNumber: "RC-204918-SIMBA",
        mandate: "Manufacturer asset warranty underwriting, first-loss commercial hire-purchase guarantees, and authorized fleet repair networks.",
        badgeLabel: "TVS OEM Certified",
        badgeColor: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20",
        hqAddress: "Simba Assembly & Service Hub, Port Harcourt Expressway, Aba",
        contactEmail: "fleet-alliance@simba.com.ng",
        contactPhone: "0800 74622 887",
        escrowAccount: {
            accountNumber: "3000885542",
            bankName: "Abia State Microfinance Bank",
            accountName: "Simba TVS Hire-Purchase First-Loss Escrow",
            availableFloatKobo: 35500000000
        },
        deskOfficers: [
            { id: "off_sim_1", name: "Sunday Kalu", title: "Micro-Financing Operations Manager", email: "skalu@simba.com.ng", phone: "0800 74622 887", isLead: true },
            { id: "off_sim_2", name: "Engr. Rajesh Patel", title: "General Manager Fleet Engineering", email: "rpatel@simba.com.ng", phone: "0803 881 2940", isLead: false }
        ],
        subscopes: [
            { id: "sub_tvs_apex", code: "TVS-APEX", name: "OEM Commercial Asset Desk", description: "Statewide commercial tricycle acquisition and factory warranty underwriting", zone: "Statewide", activeBeneficiaries: 890, deployedFloatKobo: 24500000000 },
            { id: "sub_tvs_aba_hub", code: "TVS-ABA", name: "Aba Light Industrial Hub Desk", description: "Operator hire-purchase leases and certified repairs at Faulks Road Hub", zone: "Aba", activeBeneficiaries: 680, deployedFloatKobo: 19100000000 },
            { id: "sub_tvs_umuahia_hub", code: "TVS-UMU", name: "Umuahia Capital Service Desk", description: "Central transit corridor fleet leasing and telemetry calibration", zone: "Umuahia", activeBeneficiaries: 210, deployedFloatKobo: 5400000000 }
        ],
        totalCommittedKobo: 60000000000, // ₦600M
        totalDisbursedKobo: 24500000000, // ₦245M
        activeBeneficiariesCount: 890,
        activeProgramsCount: 3,
        verifiedStatus: "verified",
        logoIcon: "ShieldCheck",
        accreditedProviderCount: 3
    }
];

export const ACCREDITED_PROVIDERS: AccreditedProvider[] = [
    // ── Healthcare Providers (ABSHIA Network) ──────────────────────────────────
    {
        id: "hosp_absuth",
        partnerId: "partner_abshia",
        partnerSlug: "abshia",
        name: "Abia State University Teaching Hospital (ABSUTH)",
        category: "tertiary_hospital",
        sector: "health",
        facilityCode: "ABSHIA-FAC-001",
        zone: "Aba",
        lga: "Aba South",
        address: "ABSUTH Complex, Umuoba Road, Aba",
        headOfFacility: "Dr. Kalu Ndukwe (CMD)",
        phone: "0803 112 4490",
        capacityBedsOrBays: 350,
        status: "accredited",
        servicesOffered: ["Comprehensive Trauma", "Maternal Care", "Surgery", "ICU", "Specialist OPD", "Radiology"]
    },
    {
        id: "hosp_fmc_umuahia",
        partnerId: "partner_abshia",
        partnerSlug: "abshia",
        name: "Federal Medical Centre Umuahia (FMC)",
        category: "tertiary_hospital",
        sector: "health",
        facilityCode: "ABSHIA-FAC-002",
        zone: "Umuahia",
        lga: "Umuahia North",
        address: "Bende Road / Queen Elizabeth Hospital Rd, Umuahia",
        headOfFacility: "Prof. Azubuike Onyebuchi (MD)",
        phone: "0803 552 1893",
        capacityBedsOrBays: 480,
        status: "accredited",
        servicesOffered: ["Tertiary Clinical Care", "Cardiology", "Orthopaedics", "Emergency Care", "Diagnostics"]
    },
    {
        id: "hosp_gen_aba",
        partnerId: "partner_abshia",
        partnerSlug: "abshia",
        name: "Aba General Hospital",
        category: "general_hospital",
        sector: "health",
        facilityCode: "ABSHIA-FAC-003",
        zone: "Aba",
        lga: "Aba South",
        address: "Hospital Road, Adjacent Post Office, Aba",
        headOfFacility: "Dr. Okey Chigozie",
        phone: "0802 991 3821",
        capacityBedsOrBays: 120,
        status: "accredited",
        servicesOffered: ["Outpatient Medicine", "Maternity", "Pediatrics", "Emergency Stabilization", "Laboratory"]
    },
    {
        id: "hosp_living_word",
        partnerId: "partner_abshia",
        partnerSlug: "abshia",
        name: "Living Word Mission Hospital Aba",
        category: "specialist_clinic",
        sector: "health",
        facilityCode: "ABSHIA-FAC-004",
        zone: "Aba",
        lga: "Aba North",
        address: "5/7 Ukaegbu Road, Ogbor Hill, Aba",
        headOfFacility: "Dr. Emeka Ikoro",
        phone: "0803 728 1190",
        capacityBedsOrBays: 85,
        status: "accredited",
        servicesOffered: ["Day Surgery", "Opthalmology", "Dental", "General Medicine", "Pediatrics"]
    },
    {
        id: "hosp_st_anthony",
        partnerId: "partner_abshia",
        partnerSlug: "abshia",
        name: "St. Anthony's Specialist Hospital & Maternity",
        category: "specialist_clinic",
        sector: "health",
        facilityCode: "ABSHIA-FAC-005",
        zone: "Aba",
        lga: "Aba South",
        address: "24 Pound Road / Clifford Rd Junction, Aba",
        headOfFacility: "Dr. Anthony Eze",
        phone: "0803 331 4982",
        capacityBedsOrBays: 60,
        status: "accredited",
        servicesOffered: ["Antenatal Care", "Delivery", "General OPD", "Ultrasound Scanning", "Pharmacy"]
    },
    {
        id: "hosp_osisioma_phc",
        partnerId: "partner_abshia",
        partnerSlug: "abshia",
        name: "Osisioma Comprehensive Primary Health Centre",
        category: "primary_health_centre",
        sector: "health",
        facilityCode: "ABSHIA-FAC-006",
        zone: "Osisioma",
        lga: "Osisioma Ngwa",
        address: "Osisioma Junction, Expressway Expressway Corridor",
        headOfFacility: "Matron Nkechi Nwosu",
        phone: "0814 220 8910",
        capacityBedsOrBays: 25,
        status: "accredited",
        servicesOffered: ["Primary Healthcare", "Immunization", "Rapid Malaria Diagnosis", "Family Planning", "Basic First Aid"]
    },
    {
        id: "hosp_gen_okikpe",
        partnerId: "partner_abshia",
        partnerSlug: "abshia",
        name: "General Hospital Okeikpe (Ukwa West)",
        category: "general_hospital",
        sector: "health",
        facilityCode: "ABSHIA-FAC-007",
        zone: "Ukwa",
        lga: "Ukwa West",
        address: "Okeikpe Civic Road, Ukwa West",
        headOfFacility: "Dr. Sunday Agwu",
        phone: "0806 441 9021",
        capacityBedsOrBays: 50,
        status: "accredited",
        servicesOffered: ["General Inpatient", "Surgical Minor", "Maternity", "Blood Transfusion"]
    },
    {
        id: "hosp_cottage_ohafia",
        partnerId: "partner_abshia",
        partnerSlug: "abshia",
        name: "Ohafia District Cottage Hospital",
        category: "general_hospital",
        sector: "health",
        facilityCode: "ABSHIA-FAC-008",
        zone: "Ohafia",
        lga: "Ohafia",
        address: "Ebem Ohafia Hilltop Corridor, Ohafia",
        headOfFacility: "Dr. Kalu Udensi",
        phone: "0802 119 7734",
        capacityBedsOrBays: 40,
        status: "accredited",
        servicesOffered: ["Family Medicine", "Emergency Care", "Maternity", "Laboratory Services"]
    },

    // ── Mobility & Vehicle Service Centers (TVS / Ministry of Transport) ─────
    {
        id: "workshop_tvs_faulks",
        partnerId: "partner_simba_tvs",
        partnerSlug: "simba-tvs",
        name: "TVS Simba Assembly & Master Diagnostics Hub",
        category: "fleet_inspection_workshop",
        sector: "transport",
        facilityCode: "TVS-WKSH-01",
        zone: "Aba",
        lga: "Aba North",
        address: "Faulks Road Light Industrial Zone, Aba",
        headOfFacility: "Engr. Rajesh Patel / Sunday Kalu",
        phone: "0803 881 2940",
        capacityBedsOrBays: 30,
        status: "accredited",
        servicesOffered: ["Engine Overhaul", "Telemetry Calibration", "Digital Speed Governor Installation", "Genuine OEM Spares"]
    },
    {
        id: "workshop_atma_inspection",
        partnerId: "partner_abia_transport",
        partnerSlug: "abia-transport",
        name: "ATMA Computerized Vehicle Inspection Depot",
        category: "fleet_inspection_workshop",
        sector: "transport",
        facilityCode: "ATMA-INSP-01",
        zone: "Umuahia",
        lga: "Umuahia South",
        address: "Old Aba-Umuahia Highway, Ubakala",
        headOfFacility: "Engr. Chidi Amadi",
        phone: "0805 771 2019",
        capacityBedsOrBays: 15,
        status: "accredited",
        servicesOffered: ["Roadworthiness Certification", "Brake Efficiency Testing", "Emission Testing", "GPS Tracker Fitment"]
    },

    // ── Agriculture Depots (USAID / Ministry of Agriculture) ───────────────────
    {
        id: "depot_adp_umuahia",
        partnerId: "partner_usaid_agro",
        partnerSlug: "usaid-agro",
        name: "Abia ADP Central Seed & Fertilizer Depot",
        category: "agro_inputs_depot",
        sector: "agriculture",
        facilityCode: "AGRO-DEPOT-01",
        zone: "Umuahia",
        lga: "Umuahia North",
        address: "Ministry of Agriculture Extension Farm Complex, Umuahia",
        headOfFacility: "Dr. Grace Okpara",
        phone: "0803 661 8840",
        capacityBedsOrBays: 500,
        status: "accredited",
        servicesOffered: ["Certified Hybrid Maize/Cassava Stems", "Subsidized NPK/Urea Fertilizer", "Soil Nutrient Testing", "Tractor Leasing"]
    }
];
