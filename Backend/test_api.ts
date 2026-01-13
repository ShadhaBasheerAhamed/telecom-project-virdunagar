
const API_URL = 'http://localhost:5000/api/customers';

async function testCreateCustomer() {
    console.log("1. Testing Create Customer...");
    const customerData = {
        landline: "04562-888999",
        name: "Code Test User",
        email: "code@test.com",
        mobileNo: "9988776655",
        altMobileNo: "9988776600",
        address: "123 Code Lane",
        plan: "Gold Plan",
        status: "Active",
        installationDate: "2024-01-01",
        // Technical fields
        vlanId: "100",
        ontMake: "Huawei",
        ontMacAddress: "AA:BB:CC:DD:EE:FF"
    };

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(customerData)
        });

        if (response.ok) {
            const data = await response.json();
            console.log("✅ Create Customer Success:", data);
            return data.id;
        } else {
            const text = await response.text();
            console.error("❌ Create Customer Failed:", response.status, text);
        }
    } catch (error) {
        console.error("❌ Create Customer Error:", error);
    }
}

async function testGetCustomers() {
    console.log("\n2. Testing Get Customers...");
    try {
        const response = await fetch(API_URL);
        if (response.ok) {
            const data = await response.json();
            console.log(`✅ Get Customers Success: Retrieved ${data.length} customers.`);
            // console.log(data);
        } else {
            console.error("❌ Get Customers Failed:", response.status);
        }
    } catch (error) {
        console.error("❌ Get Customers Error:", error);
    }
}

async function runTests() {
    const newCustomerId = await testCreateCustomer();
    if (newCustomerId) {
        await testGetCustomers();
    }
}

runTests();
