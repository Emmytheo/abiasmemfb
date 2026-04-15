const API_URL = "https://gdmfudhjiugdyijebouc.supabase.co/rest/v1/services";
const API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdkbWZ1ZGhqaXVnZHlpamVib3VjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjI2MDcwMCwiZXhwIjoyMDg3ODM2NzAwfQ.nCY-G03w8l_3b-ev5KSj_tnuVe6NNNuAS_dfbhY9f2c";

const schemas = {
    "4": [
        { "id": "beneficiary_id", "name": "beneficiary_id", "label": "Select Saved Beneficiary", "type": "beneficiary_select", "required": false, "events": [{ "trigger": "onChange", "action": "SET_VALUES", "mappingConfig": { "destination_account": "{{$value.account_number}}", "destination_name": "{{$value.account_name}}" } }] },
        { "id": "destination_account", "name": "destination_account", "label": "Target Account Number", "type": "text", "required": true, "placeholder": "Enter 10-digit Abia MFB Account", "events": [{ "trigger": "onBlur", "action": "EXECUTE_ENDPOINT", "endpointId": "Get Customer By Account Number", "mappingConfig": { "fullName": "destination_name" } }] },
        { "id": "destination_name", "name": "destination_name", "label": "Verified Account Name", "type": "text", "required": true, "placeholder": "Auto-verifying..." },
        { "id": "amount", "name": "amount", "label": "Transfer Amount", "type": "number", "required": true },
        { "id": "narration", "name": "narration", "label": "Transaction Narration", "type": "text", "required": true, "placeholder": "e.g. Lunch with the team" }
    ],
    "5": [
        { "id": "beneficiary_id", "name": "beneficiary_id", "label": "Select Saved Beneficiary", "type": "beneficiary_select", "required": false, "events": [{ "trigger": "onChange", "action": "SET_VALUES", "mappingConfig": { "destination_account": "{{$value.account_number}}", "destination_bank_code": "{{$value.bank_code}}", "destination_name": "{{$value.account_name}}" } }] },
        { "id": "destination_bank_code", "name": "destination_bank_code", "label": "Destination Bank", "type": "destination_bank_lookup", "required": true },
        { "id": "destination_account", "name": "destination_account", "label": "Target Account Number", "type": "text", "required": true, "placeholder": "Enter 10-digit Account Number", "events": [{ "trigger": "onBlur", "action": "EXECUTE_ENDPOINT", "endpointId": "Inter-Bank Name Enquiry", "mappingConfig": { "AccountName": "destination_name" } }] },
        { "id": "destination_name", "name": "destination_name", "label": "Verified Account Name", "type": "text", "required": true, "placeholder": "Auto-verified name" },
        { "id": "amount", "name": "amount", "label": "Transfer Amount", "type": "number", "required": true },
        { "id": "narration", "name": "narration", "label": "Transaction Narration", "type": "text", "required": true, "placeholder": "e.g. Supplier payment" }
    ],
    "3": [
        { "id": "beneficiary_id", "name": "beneficiary_id", "label": "Select Saved Beneficiary", "type": "beneficiary_select", "required": false, "events": [{ "trigger": "onChange", "action": "SET_VALUES", "mappingConfig": { "destination_account": "{{$value.account_number}}", "swift_code": "{{$value.swift_code}}", "destination_name": "{{$value.account_name}}", "country": "{{$value.country}}" } }] },
        { "id": "destination_name", "name": "destination_name", "label": "Beneficiary Full Name", "type": "text", "required": true },
        { "id": "destination_account", "name": "destination_account", "label": "IBAN / Account Number", "type": "text", "required": true },
        { "id": "swift_code", "name": "swift_code", "label": "SWIFT / BIC Code", "type": "text", "required": true },
        { "id": "country", "name": "country", "label": "Destination Country", "type": "text", "required": true, "placeholder": "e.g. US, GB, DE" },
        { "id": "amount", "name": "amount", "label": "Amount (USD/GBP/EUR)", "type": "number", "required": true }
    ]
};

async function patchSchemas() {
    for (const [id, schema] of Object.entries(schemas)) {
        console.log(`Patching service ${id}...`);
        const response = await fetch(`${API_URL}?id=eq.${id}`, {
            method: 'PATCH',
            headers: {
                'apikey': API_KEY,
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ form_schema: schema })
        });
        if (response.ok) {
            console.log(`Service ${id} patched successfully.`);
        } else {
            const err = await response.text();
            console.error(`Failed to patch service ${id}:`, err);
        }
    }
}

patchSchemas();
