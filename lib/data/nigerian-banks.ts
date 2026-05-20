// Nigerian banks with CBN clearing codes
export interface NigerianBank {
    code: string;
    shortCode: string;
    name: string;
}

export const NIGERIAN_BANKS: NigerianBank[] = [
    { code: "044", shortCode: "access", name: "Access Bank" },
    { code: "063", shortCode: "access_diamond", name: "Access Bank (Diamond)" },
    { code: "023", shortCode: "citibank", name: "Citibank Nigeria" },
    { code: "050", shortCode: "ecobank", name: "EcoBank Nigeria" },
    { code: "562", shortCode: "eyowo", name: "Eyowo" },
    { code: "070", shortCode: "fidelity", name: "Fidelity Bank" },
    { code: "011", shortCode: "first_bank", name: "First Bank of Nigeria" },
    { code: "214", shortCode: "first_city", name: "First City Monument Bank (FCMB)" },
    { code: "058", shortCode: "gtb", name: "Guaranty Trust Bank (GTBank)" },
    { code: "030", shortCode: "heritage", name: "Heritage Bank" },
    { code: "301", shortCode: "jaiz", name: "Jaiz Bank" },
    { code: "082", shortCode: "keystone", name: "Keystone Bank" },
    { code: "526", shortCode: "kuda", name: "Kuda Microfinance Bank" },
    { code: "501", shortCode: "moniepoint", name: "Moniepoint Microfinance Bank" },
    { code: "014", shortCode: "mainstreet", name: "Mainstreet Microfinance Bank" },
    { code: "526", shortCode: "opay", name: "OPay Digital Services" },
    { code: "305", shortCode: "palmpay", name: "PalmPay" },
    { code: "076", shortCode: "polaris", name: "Polaris Bank" },
    { code: "101", shortCode: "prov_trust", name: "Providus Bank" },
    { code: "221", shortCode: "stanbic", name: "Stanbic IBTC Bank" },
    { code: "068", shortCode: "standard_chartered", name: "Standard Chartered Bank" },
    { code: "232", shortCode: "sterling", name: "Sterling Bank" },
    { code: "100", shortCode: "suntrust", name: "SunTrust Bank" },
    { code: "032", shortCode: "union", name: "Union Bank of Nigeria" },
    { code: "033", shortCode: "uba", name: "United Bank for Africa (UBA)" },
    { code: "215", shortCode: "unity", name: "Unity Bank" },
    { code: "035", shortCode: "wema", name: "Wema Bank" },
    { code: "057", shortCode: "zenith", name: "Zenith Bank" },
    { code: "110", shortCode: "vpc", name: "VFD Microfinance Bank" },
    { code: "566", shortCode: "carbon", name: "Carbon (Paylater)" },
    { code: "090", shortCode: "abia_mfb", name: "Abia Microfinance Bank" },
];

export function getBankByCode(code: string): NigerianBank | undefined {
    return NIGERIAN_BANKS.find(b => b.code === code);
}

export function getBankByShortCode(shortCode: string): NigerianBank | undefined {
    return NIGERIAN_BANKS.find(b => b.shortCode === shortCode);
}
