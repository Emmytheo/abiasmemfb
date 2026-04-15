import { resolveEndpoint } from '../lib/workflow/utils/apiResolver';

async function testResolution() {
    console.log('--- Testing Endpoint Resolution Fixes ---\n');

    const mockProvider = {
        id: 'p1',
        baseUrl: 'https://api.bank.com',
        authType: 'API_KEY',
        secretId: 'sec-123'
    };

    // Case 1: Standard BankOne behavior (API_KEY mode)
    const endpoint1 = {
        id: 'e1',
        name: 'Test Endpoint',
        provider: mockProvider,
        method: 'POST',
        path: '/v1/test',
        authOverride: 'API_KEY', // explicitly set
        queryParams: [
            { key: 'v', value: '2' }
        ]
    };

    console.log('Case 1: API_KEY mode with static query params');
    // Note: resolveEndpoint will try to import secretResolver, 
    // we might need to mock it if running in node directly, 
    // but here we just want to see if it compiles and runs if we mock the environment.
    
    // For this scratch script to work in pure node, I might need to mock the imports or just test the logic functions directly if exported.
    // applyAuthOverride is exported!
}

import { applyAuthOverride } from '../lib/workflow/utils/apiResolver';

function testApplyAuthOverride() {
    console.log('--- Testing applyAuthOverride logic ---\n');

    const provider = { authType: 'API_KEY' };
    const secretValue = 'SECRET_TOKEN_123';
    
    // 1. Default API_KEY (BankOne)
    const config1 = { method: 'POST', authOverride: 'API_KEY' };
    const res1 = applyAuthOverride('https://api.com/test', {}, { existing: 'data' }, secretValue, provider, config1);
    console.log('1. Default API_KEY (POST):');
    console.log('   URL:', res1.url);
    console.log('   Body:', JSON.stringify(res1.body));
    console.log('   Success:', res1.url.includes('authToken=SECRET_TOKEN_123') && res1.body.AuthenticationCode === secretValue);

    // 2. Custom Keys
    const config2 = { 
        method: 'POST', 
        authOverride: 'API_KEY',
        authQueryParamKey: 'token',
        authBodyFieldKey: 'api_code'
    };
    const res2 = applyAuthOverride('https://api.com/test', {}, {}, secretValue, provider, config2);
    console.log('\n2. Custom Keys API_KEY (POST):');
    console.log('   URL:', res2.url);
    console.log('   Body:', JSON.stringify(res2.body));
    console.log('   Success:', res2.url.includes('token=SECRET_TOKEN_123') && res2.body.api_code === secretValue);

    // 3. Query Param Only
    const config3 = { 
        method: 'POST', 
        authOverride: 'QUERY_PARAM',
        authQueryParamKey: 'auth'
    };
    const res3 = applyAuthOverride('https://api.com/test', {}, { foo: 'bar' }, secretValue, provider, config3);
    console.log('\n3. Query Param Only (POST):');
    console.log('   URL:', res3.url);
    console.log('   Body:', JSON.stringify(res3.body));
    console.log('   Success:', res3.url.includes('auth=SECRET_TOKEN_123') && !res3.body.AuthenticationCode);
}

testApplyAuthOverride();
