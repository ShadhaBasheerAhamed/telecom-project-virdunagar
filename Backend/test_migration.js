const http = require('http');

const BASE_URL = 'localhost';
const PORT = 5000;

// Helper function to make HTTP requests
function makeRequest(method, path, data = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: BASE_URL,
            port: PORT,
            path: `/api${path}`,
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                try {
                    const response = body ? JSON.parse(body) : null;
                    resolve({ status: res.statusCode, data: response });
                } catch (e) {
                    resolve({ status: res.statusCode, data: body });
                }
            });
        });

        req.on('error', reject);

        if (data) {
            req.write(JSON.stringify(data));
        }

        req.end();
    });
}

async function testAPI() {
    console.log('🚀 Starting API Verification Tests...\n');

    const results = {
        passed: 0,
        failed: 0,
        tests: []
    };

    // Test 1: Health Check
    console.log('📋 Test 1: Health Check');
    try {
        const res = await makeRequest('GET', '/../');
        if (res.status === 200) {
            console.log('✅ PASS: Server is running');
            results.passed++;
        } else {
            console.log('❌ FAIL: Server health check failed');
            results.failed++;
        }
    } catch (error) {
        console.log('❌ FAIL: Cannot connect to server');
        results.failed++;
    }
    console.log('');

    // Test 2: Get Customers
    console.log('📋 Test 2: GET /customers');
    try {
        const res = await makeRequest('GET', '/customers');
        if (res.status === 200 && Array.isArray(res.data)) {
            console.log(`✅ PASS: Retrieved ${res.data.length} customers`);
            results.passed++;
        } else {
            console.log('❌ FAIL: Invalid response from /customers');
            results.failed++;
        }
    } catch (error) {
        console.log('❌ FAIL:', error.message);
        results.failed++;
    }
    console.log('');

    // Test 3: Get Payments
    console.log('📋 Test 3: GET /payments');
    try {
        const res = await makeRequest('GET', '/payments');
        if (res.status === 200 && Array.isArray(res.data)) {
            console.log(`✅ PASS: Retrieved ${res.data.length} payments`);
            results.passed++;
        } else {
            console.log('❌ FAIL: Invalid response from /payments');
            results.failed++;
        }
    } catch (error) {
        console.log('❌ FAIL:', error.message);
        results.failed++;
    }
    console.log('');

    // Test 4: Get Leads
    console.log('📋 Test 4: GET /leads');
    try {
        const res = await makeRequest('GET', '/leads');
        if (res.status === 200 && Array.isArray(res.data)) {
            console.log(`✅ PASS: Retrieved ${res.data.length} leads`);
            results.passed++;
        } else {
            console.log('❌ FAIL: Invalid response from /leads');
            results.failed++;
        }
    } catch (error) {
        console.log('❌ FAIL:', error.message);
        results.failed++;
    }
    console.log('');

    // Test 5: Get Complaints
    console.log('📋 Test 5: GET /complaints');
    try {
        const res = await makeRequest('GET', '/complaints');
        if (res.status === 200 && Array.isArray(res.data)) {
            console.log(`✅ PASS: Retrieved ${res.data.length} complaints`);
            results.passed++;
        } else {
            console.log('❌ FAIL: Invalid response from /complaints');
            results.failed++;
        }
    } catch (error) {
        console.log('❌ FAIL:', error.message);
        results.failed++;
    }
    console.log('');

    // Test 6: Get Plans
    console.log('📋 Test 6: GET /plans');
    try {
        const res = await makeRequest('GET', '/plans');
        if (res.status === 200 && Array.isArray(res.data)) {
            console.log(`✅ PASS: Retrieved ${res.data.length} plans`);
            results.passed++;
        } else {
            console.log('❌ FAIL: Invalid response from /plans');
            results.failed++;
        }
    } catch (error) {
        console.log('❌ FAIL:', error.message);
        results.failed++;
    }
    console.log('');

    // Test 7: Get Network Providers
    console.log('📋 Test 7: GET /network-providers');
    try {
        const res = await makeRequest('GET', '/network-providers');
        if (res.status === 200 && Array.isArray(res.data)) {
            console.log(`✅ PASS: Retrieved ${res.data.length} network providers`);
            results.passed++;
        } else {
            console.log('❌ FAIL: Invalid response from /network-providers');
            results.failed++;
        }
    } catch (error) {
        console.log('❌ FAIL:', error.message);
        results.failed++;
    }
    console.log('');

    // Test 8: Get Products
    console.log('📋 Test 8: GET /products');
    try {
        const res = await makeRequest('GET', '/products');
        if (res.status === 200 && Array.isArray(res.data)) {
            console.log(`✅ PASS: Retrieved ${res.data.length} products`);
            results.passed++;
        } else {
            console.log('❌ FAIL: Invalid response from /products');
            results.failed++;
        }
    } catch (error) {
        console.log('❌ FAIL:', error.message);
        results.failed++;
    }
    console.log('');

    // Test 9: Create Test Customer
    console.log('📋 Test 9: POST /customers (Create)');
    try {
        const testCustomer = {
            name: 'Test Customer',
            mobile_no: '9999999999',
            address: 'Test Address',
            plan: 'Test Plan',
            status: 'Active',
            source: 'BSNL'
        };
        const res = await makeRequest('POST', '/customers', testCustomer);
        if (res.status === 201 && res.data.id) {
            console.log(`✅ PASS: Created customer with ID ${res.data.id}`);
            results.passed++;

            // Test 10: Delete Test Customer
            console.log('📋 Test 10: DELETE /customers/:id');
            const deleteRes = await makeRequest('DELETE', `/customers/${res.data.id}`);
            if (deleteRes.status === 200) {
                console.log('✅ PASS: Deleted test customer');
                results.passed++;
            } else {
                console.log('❌ FAIL: Could not delete test customer');
                results.failed++;
            }
        } else {
            console.log('❌ FAIL: Could not create customer');
            results.failed++;
        }
    } catch (error) {
        console.log('❌ FAIL:', error.message);
        results.failed++;
    }
    console.log('');

    // Summary
    console.log('═══════════════════════════════════════');
    console.log('📊 TEST SUMMARY');
    console.log('═══════════════════════════════════════');
    console.log(`✅ Passed: ${results.passed}`);
    console.log(`❌ Failed: ${results.failed}`);
    console.log(`📈 Success Rate: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%`);
    console.log('═══════════════════════════════════════\n');

    if (results.failed === 0) {
        console.log('🎉 All tests passed! Migration successful!');
    } else {
        console.log('⚠️  Some tests failed. Please check the errors above.');
    }
}

testAPI().catch(console.error);
