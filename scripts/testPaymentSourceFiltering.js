// Test script for Payment Source Filtering Fix
// Run this in the browser console on the Payment Management page

console.log("🧪 Starting Payment Source Filtering Test...");

// Test data sources
const testSources = ['All', 'BSNL', 'RMAX'];

// Test function
async function testPaymentSourceFiltering() {
    console.log("🔍 Testing Payment Source Filtering...");
    
    for (const source of testSources) {
        console.log(`\n📊 Testing source: "${source}"`);
        
        try {
            if (source === 'All') {
                const allPayments = await PaymentService.getPayments();
                console.log(`✅ All payments: Found ${allPayments.length} payments`);
                
                // Check source distribution
                const sourceCounts = {};
                allPayments.forEach(p => {
                    sourceCounts[p.source] = (sourceCounts[p.source] || 0) + 1;
                });
                console.log(`📈 Source distribution:`, sourceCounts);
                
            } else {
                const sourcePayments = await PaymentService.getPaymentsBySource(source);
                console.log(`✅ ${source} payments: Found ${sourcePayments.length} payments`);
                
                if (sourcePayments.length > 0) {
                    console.log(`🔍 Sample ${source} payment:`, {
                        id: sourcePayments[0].id,
                        source: sourcePayments[0].source,
                        customerName: sourcePayments[0].customerName,
                        billAmount: sourcePayments[0].billAmount
                    });
                }
            }
        } catch (error) {
            console.error(`❌ Error testing ${source}:`, error);
        }
    }
}

// Run the test
testPaymentSourceFiltering().then(() => {
    console.log("\n🎉 Payment Source Filtering Test Complete!");
    console.log("\n💡 If you see 'Using fallback method' messages, the composite index is missing.");
    console.log("💡 If you see 'Query successful' messages, the composite index is working properly.");
}).catch(error => {
    console.error("❌ Test failed:", error);
});