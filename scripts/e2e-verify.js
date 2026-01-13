// Node 18+ has native fetch. No require needed.

const API_URL = 'http://localhost:5000/api';

const generateUser = () => {
    const r = Math.random().toString(36).substring(7);
    return {
        email: `e2e_test_${r}@example.com`,
        password: 'password123',
        displayName: `E2E Tester ${r}`,
        role: 'admin'
    };
};

const runTest = async () => {
    console.log('🚀 Starting E2E Verification...');
    const user = generateUser();
    let token = '';
    let customerId = '';

    try {
        // 1. Register
        console.log(`\n1. Registering user: ${user.email}`);
        const regRes = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(user)
        });

        if (regRes.status === 201) {
            console.log('✅ Registration Successful');
        } else {
            // If already exists or other error, try login
            console.log(`⚠️ Registration returned ${regRes.status} (might exist). Proceeding to login.`);
        }

        // 2. Login
        console.log(`\n2. Logging in...`);
        const loginRes = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: user.email, password: user.password })
        });

        if (!loginRes.ok) throw new Error(`Login failed: ${loginRes.statusText}`);
        const loginData = await loginRes.json();
        token = loginData.token;
        console.log('✅ Login Successful. Token received.');

        // 3. Create Customer
        console.log(`\n3. Creating Customer...`);
        const newCustomer = {
            name: `E2E Customer ${Math.random().toString(36).substring(7)}`,
            mobileNo: '9876543210',
            landline: `044${Math.floor(Math.random() * 1000000)}`,
            status: 'Active',
            source: 'Private',
            ont: 'Free ONT',
            plan: 'Plan A'
        };

        const createRes = await fetch(`${API_URL}/customers`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(newCustomer)
        });

        if (!createRes.ok) {
            const err = await createRes.text();
            throw new Error(`Create Customer failed: ${err}`);
        }
        const createData = await createRes.json();
        customerId = createData.id;
        console.log(`✅ Customer Created. ID: ${customerId}`);

        // 4. Verify Customer Listing
        console.log(`\n4. Verifying Customer Listing...`);
        const getRes = await fetch(`${API_URL}/customers`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const customers = await getRes.json();
        const found = customers.find(c => c.id === customerId);

        if (found) {
            console.log('✅ Created customer found in list.');
        } else {
            throw new Error('Customer created but not found in list!');
        }

        // 5. Create Payment
        console.log(`\n5. Adding Payment...`);
        const payment = {
            billAmount: 500,
            amount: 500, // Legacy support just in case
            status: 'Paid',
            modeOfPayment: 'Cash',
            source: 'BSNL',
            paidDate: new Date().toISOString()
        };
        const payRes = await fetch(`${API_URL}/payments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ ...payment, customer_id: customerId })
        });

        if (!payRes.ok) throw new Error(`Add Payment failed.`);
        console.log('✅ Payment recorded successfully.');

        // 6. Check Dashboard Stats
        console.log(`\n6. Checking Dashboard Stats...`);
        const statsRes = await fetch(`${API_URL}/dashboard/stats`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!statsRes.ok) throw new Error('Dashboard stats failed');
        const stats = await statsRes.json();
        console.log('✅ Dashboard stats retrieved:', stats ? 'OK' : 'Empty');

        console.log('\n✨ E2E VERIFICATION PASSED! ✨');

    } catch (error) {
        console.error('\n❌ E2E VERIFICATION FAILED');
        console.error(error);
        process.exit(1);
    }
};

runTest();
