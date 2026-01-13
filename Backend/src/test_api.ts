import axios from 'axios';

const API_URL = 'http://localhost:5000/api/customers';

async function testCreateCustomer() {
    console.log("1. Testing Create Customer...");
    const customerData = {
        landline: "04562-999888",
        name: "Axios Test User",
        email: "axios@test.com",
        mobileNo: "9123456789",
        altMobileNo: "9123456788",
        address: "456 Backend Blvd",
        plan: "Fiber 200Mbps",
        status: "Active",
        installationDate: "2024-02-01",
        // Technical fields
        vlanId: "200",
        ontMake: "Nokia",
        ontMacAddress: "BB:CC:DD:EE:FF:00",
        offerPrize: "Free Router"
    };

    try {
        const response = await axios.post(API_URL, customerData);
        console.log("✅ Create Customer Success:", response.data);
        return response.data.id;
    } catch (error: any) {
        console.error("❌ Create Customer Failed:", error.message);
        if (error.response) {
            console.error("   Server Error:", error.response.data);
        }
    }
}

async function testGetCustomers() {
    console.log("\n2. Testing Get Customers...");
    try {
        const response = await axios.get(API_URL);
        console.log(`✅ Get Customers Success: Retrieved ${response.data.length} customers.`);
        // console.log(response.data);
    } catch (error: any) {
        console.error("❌ Get Customers Failed:", error.message);
    }
}


async function runTests() {
    try {
        const newCustomerId = await testCreateCustomer();
        if (newCustomerId) {
            await testGetCustomers();
        }
    } catch (err) {
        console.error("Test execution failed", err);
    }
}

runTests();
