const http = require('http');

function makeRequest(path, method, data) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 5000,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json',
            }
        };

        if (data) {
            options.headers['Content-Length'] = Buffer.byteLength(data);
        }

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                resolve({ status: res.statusCode, body: body });
            });
        });

        req.on('error', (e) => reject(e));

        if (data) req.write(data);
        req.end();
    });
}

async function run() {
    console.log("--- Starting Verification ---");

    // 1. GET Customers
    try {
        console.log("\n1. GET /api/customers");
        const getRes = await makeRequest('/api/customers', 'GET');
        console.log("Status:", getRes.status);
        console.log("Body Length:", getRes.body.length);
        console.log("Body Preview:", getRes.body.substring(0, 500));
    } catch (e) {
        console.error("GET Failed:", e.message);
    }

    // 2. POST Customer
    try {
        console.log("\n2. POST /api/customers");
        const newCustomer = JSON.stringify({
            landline: "04562-777777",
            name: "Node JS Verified",
            email: "node@verify.com",
            mobileNo: "9000000000",
            status: "Active",
            plan: "Basic Plan"
        });

        const postRes = await makeRequest('/api/customers', 'POST', newCustomer);
        console.log("Status:", postRes.status);
        console.log("Body:", postRes.body);
    } catch (e) {
        console.error("POST Failed:", e.message);
    }
}

run();
