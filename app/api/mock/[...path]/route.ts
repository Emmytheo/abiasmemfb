import { NextRequest, NextResponse } from 'next/server';

// ============================================================
// UNIFIED MOCK GATEWAY — /api/mock/[...path]
// All mock endpoint responses live here.
// Production guard: returns 403 if NODE_ENV === 'production'.
// ============================================================

type MockHandler = (req: NextRequest, body: any, query: URLSearchParams) => NextResponse;

const delay = (ms = 300) => new Promise(r => setTimeout(r, ms));

// --- BVN Verification ---
const bvnVerify: MockHandler = (_req, body) => {
    const bvn = body?.BVN || body?.bvn || '';
    const isValid = /^\d{11}$/.test(String(bvn));
    return NextResponse.json({
        IsSuccessful: isValid,
        Payload: isValid ? {
            BVN: bvn,
            FirstName: 'ADAEZE',
            LastName: 'OKONKWO',
            MiddleName: 'CHIDINMA',
            DateOfBirth: '01-JAN-1990',
            PhoneNumber: '08012345678',
            Gender: 'Female',
        } : null,
        Message: isValid ? 'BVN verified successfully' : 'Invalid BVN format',
    });
};

// --- Account Enquiry ---
const accountEnquiry: MockHandler = (_req, body, query) => {
    const accountNo = body?.AccountNumber || body?.accountNumber || query.get('accountNumber') || '';
    if (!accountNo) return NextResponse.json({ IsSuccessful: false, Message: 'Account number required' });
    return NextResponse.json({
        IsSuccessful: true,
        Payload: {
            AccountNumber: accountNo,
            AccountName: 'MOCK ACCOUNT HOLDER',
            BankCode: '070',
            BankName: 'ABIA MFB',
        },
    });
};

// --- Intra-Bank Transfer ---
const intraTransfer: MockHandler = (_req, body) => {
    const ref = `INTRA-MOCK-${Date.now()}`;
    return NextResponse.json({
        IsSuccessful: true,
        Payload: {
            TransactionReference: ref,
            Amount: body?.Amount || 0,
            Narration: body?.Narration || 'Intra-bank transfer',
            Status: 'SUCCESSFUL',
        },
    });
};

// --- Inter-Bank Transfer ---
const interTransfer: MockHandler = (_req, body) => {
    const ref = `INTER-MOCK-${Date.now()}`;
    return NextResponse.json({
        IsSuccessful: true,
        Payload: {
            TransactionReference: ref,
            SessionId: `SID${Date.now()}`,
            Amount: body?.Amount || 0,
            Narration: body?.Narration || 'Inter-bank transfer',
            Status: 'SUCCESSFUL',
        },
    });
};

// --- International Transfer ---
const intlTransfer: MockHandler = (_req, body) => {
    const ref = `INTL-MOCK-${Date.now()}`;
    return NextResponse.json({
        IsSuccessful: true,
        Payload: {
            TransactionReference: ref,
            SwiftReference: `SWIFT${Date.now()}`,
            Amount: body?.Amount || 0,
            Currency: body?.Currency || 'USD',
            Status: 'SUCCESSFUL',
        },
    });
};

// --- Banks List ---
const banksList: MockHandler = () => NextResponse.json({
    IsSuccessful: true,
    Payload: [
        { BankCode: '044', BankName: 'Access Bank' },
        { BankCode: '023', BankName: 'Citibank Nigeria' },
        { BankCode: '063', BankName: 'Diamond Bank' },
        { BankCode: '050', BankName: 'EcoBank Nigeria' },
        { BankCode: '084', BankName: 'Enterprise Bank' },
        { BankCode: '070', BankName: 'Fidelity Bank' },
        { BankCode: '011', BankName: 'First Bank of Nigeria' },
        { BankCode: '214', BankName: 'First City Monument Bank' },
        { BankCode: '058', BankName: 'Guaranty Trust Bank' },
        { BankCode: '030', BankName: 'Heritage Bank' },
        { BankCode: '301', BankName: 'Jaiz Bank' },
        { BankCode: '082', BankName: 'Keystone Bank' },
        { BankCode: '526', BankName: 'Opay' },
        { BankCode: '076', BankName: 'Polaris Bank' },
        { BankCode: '101', BankName: 'ProvidusBank' },
        { BankCode: '039', BankName: 'Stanbic IBTC Bank' },
        { BankCode: '232', BankName: 'Sterling Bank' },
        { BankCode: '032', BankName: 'Union Bank of Nigeria' },
        { BankCode: '033', BankName: 'United Bank for Africa' },
        { BankCode: '035', BankName: 'Wema Bank' },
        { BankCode: '057', BankName: 'Zenith Bank' },
        { BankCode: '070', BankName: 'Abia MFB' },
    ],
});

// --- Account Statement ---
const accountStatement: MockHandler = (_req, body, query) => {
    const accountNo = body?.accountNumber || query.get('accountNumber') || 'XXXXXXXXXX';
    const from = body?.fromDate || query.get('fromDate') || '2026-01-01';
    const to = body?.toDate || query.get('toDate') || new Date().toISOString().slice(0, 10);
    const mockPdfBase64 = 'JVBERi0xLjQKJeLjz9MKMSAwIG9iago8PAovVHlwZSAvQ2F0YWxvZwovUGFnZXMgMiAwIFIKPj4KZW5kb2Jq'; // minimal fake base64
    return NextResponse.json({
        IsSuccessful: true,
        Payload: {
            AccountNumber: accountNo,
            FromDate: from,
            ToDate: to,
            StatementBase64: mockPdfBase64,
            FileName: `statement-${accountNo}-${from}-${to}.pdf`,
        },
    });
};

// --- Account Freeze / Unfreeze ---
const accountFreeze: MockHandler = (_req, body) => NextResponse.json({ IsSuccessful: true, Message: `Account ${body?.AccountNo || body?.accountNumber} frozen successfully.` });
const accountUnfreeze: MockHandler = (_req, body) => NextResponse.json({ IsSuccessful: true, Message: `Account ${body?.AccountNo} unfrozen.` });

// --- PND / Un-PND ---
const accountPnd: MockHandler = (_req, body) => NextResponse.json({ IsSuccessful: true, Message: `PND placed on ${body?.AccountNo}.` });
const accountUnpnd: MockHandler = (_req, body) => NextResponse.json({ IsSuccessful: true, Message: `PND lifted from ${body?.AccountNo}.` });

// --- Lien ---
const accountLien: MockHandler = (_req, body) => NextResponse.json({ IsSuccessful: true, Message: `Lien of ${body?.Amount} placed on ${body?.AccountNo}.`, LienReference: `LIEN-${Date.now()}` });

// --- Account Tier ---
const accountTier: MockHandler = (_req, body) => NextResponse.json({ IsSuccessful: true, Message: `Account ${body?.AccountNo} upgraded to Tier ${body?.AccountTier}.` });

// --- Account Close ---
const accountClose: MockHandler = (_req, body) => NextResponse.json({ IsSuccessful: true, Message: `Account ${body?.accountNumber || body?.AccountNo} closed.` });

// --- Notification Preference ---
const notifPref: MockHandler = (_req, body) => NextResponse.json({ IsSuccessful: true, Message: `Notification preference set to ${body?.NotificationPreference} for ${body?.AccountNumber}.` });

// --- Transaction Status ---
const txStatus: MockHandler = (_req, body, query) => {
    const ref = body?.TransactionReference || query.get('TransactionReference') || '';
    return NextResponse.json({
        IsSuccessful: true,
        Payload: {
            TransactionReference: ref,
            Status: 'SUCCESSFUL',
            Channel: 'API',
            Amount: 5000,
            DateCompleted: new Date().toISOString(),
        },
    });
};

// --- Customer Lookup ---
const customerLookup: MockHandler = (_req, body, query) => {
    const id = body?.CustomerID || query.get('customerID') || '000001';
    return NextResponse.json({
        IsSuccessful: true,
        Payload: {
            CustomerID: id,
            LastName: 'OKONKWO',
            OtherNames: 'ADAEZE CHIDINMA',
            Email: 'adaeze.okonkwo@mock.com',
            PhoneNo: '08012345678',
            BVN: '22287654321',
        },
    });
};

// --- Customer Accounts ---
const customerAccounts: MockHandler = (_req, _body, query) => {
    const id = query.get('customerID') || '000001';
    return NextResponse.json({
        IsSuccessful: true,
        Accounts: [
            {
                NUBAN: `3081${id.slice(-6).padStart(6, '0')}`,
                AccountType: 'Savings',
                ProductClass: 'Standard',
                ProductCategory: 'Retail',
                ProductType: 'Savings',
                ProductCode: 'SAV001',
                availableBalance: '150,000.00',
                accountStatus: 'active',
            },
        ],
    });
};

// Route table: maps URL path segments to handlers
const routes: Record<string, MockHandler> = {
    'bvn-verify': bvnVerify,
    'account-enquiry': accountEnquiry,
    'intra-transfer': intraTransfer,
    'inter-transfer': interTransfer,
    'intl-transfer': intlTransfer,
    'banks-list': banksList,
    'account-statement': accountStatement,
    'account-freeze': accountFreeze,
    'account-unfreeze': accountUnfreeze,
    'account-pnd': accountPnd,
    'account-unpnd': accountUnpnd,
    'account-lien': accountLien,
    'account-tier': accountTier,
    'account-close': accountClose,
    'account-notif-pref': notifPref,
    'tx-status': txStatus,
    'customer-lookup': customerLookup,
    'customer-accounts': customerAccounts,
};

async function handler(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
    if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({ error: 'Mock endpoints are disabled in production.' }, { status: 403 });
    }

    const { path } = await params;
    const routeKey = path.join('/');
    const handlerFn = routes[routeKey];

    if (!handlerFn) {
        return NextResponse.json({ error: `No mock handler found for: /api/mock/${routeKey}` }, { status: 404 });
    }

    await delay(180 + Math.random() * 120); // realistic latency

    let body: any = {};
    try {
        const text = await req.text();
        if (text) body = JSON.parse(text);
    } catch {}

    const query = new URL(req.url).searchParams;

    try {
        return handlerFn(req, body, query);
    } catch (err: any) {
        console.error(`[Mock Gateway] Error in handler ${routeKey}:`, err);
        return NextResponse.json({ IsSuccessful: false, Message: err.message }, { status: 500 });
    }
}

export { handler as GET, handler as POST, handler as PUT, handler as PATCH };
