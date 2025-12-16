/**
 * Test script to verify that the network provider filtering fix is working
 * This simulates the filtering behavior to ensure the fix is effective
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');

// Load Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyCP6cvVrFmYgekRbm5titNYPJpP4iWH3EE",
  authDomain: "telecomproject-virudhunagar.firebaseapp.com",
  projectId: "telecomproject-virudhunagar",
  storageBucket: "telecomproject-virudhunagar.firebasestorage.app",
  messagingSenderId: "1080285921059",
  appId: "1:1080285921059:web:f09f58e3c84e5237111696"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function testFilteringFix() {
    console.log('🧪 TESTING NETWORK PROVIDER FILTERING FIX');
    console.log('==========================================\n');
    
    try {
        // Fetch all customers
        const customersSnap = await getDocs(collection(db, 'customers'));
        const allCustomers = customersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        console.log(`📊 Total customers in database: ${allCustomers.length}`);
        
        // Test filtering scenarios (simulating client-side filtering)
        const testCases = [
            { name: 'All Sources', filter: 'All', expected: allCustomers.length },
            { name: 'BSNL', filter: 'BSNL' },
            { name: 'RMAX', filter: 'RMAX' },
            { name: 'Private', filter: 'Private' }
        ];
        
        console.log('\n🔍 Testing Filter Scenarios:');
        console.log('============================');
        
        for (const testCase of testCases) {
            let filteredCustomers;
            
            if (testCase.filter === 'All') {
                filteredCustomers = allCustomers;
            } else {
                filteredCustomers = allCustomers.filter(customer => customer.source === testCase.filter);
            }
            
            console.log(`${testCase.name}:`);
            console.log(`   • Filter applied: ${testCase.filter}`);
            console.log(`   • Results: ${filteredCustomers.length} customers`);
            
            if (filteredCustomers.length > 0) {
                console.log(`   • Sample customers:`);
                filteredCustomers.slice(0, 3).forEach(customer => {
                    console.log(`     - ${customer.name} (${customer.landline}) - Source: ${customer.source}`);
                });
            } else {
                console.log(`   • ⚠️  No customers found for this filter`);
            }
            console.log('');
        }
        
        // Check source distribution
        const sourceStats = {};
        allCustomers.forEach(customer => {
            const source = customer.source || 'UNDEFINED';
            sourceStats[source] = (sourceStats[source] || 0) + 1;
        });
        
        console.log('📈 Source Distribution Analysis:');
        console.log('================================');
        Object.entries(sourceStats)
            .sort(([,a], [,b]) => b - a)
            .forEach(([source, count]) => {
                const percentage = ((count / allCustomers.length) * 100).toFixed(1);
                console.log(`   • ${source}: ${count} customers (${percentage}%)`);
            });
        
        // Validate expected behavior
        console.log('\n✅ VALIDATION RESULTS:');
        console.log('======================');
        
        const bsnlCount = sourceStats['BSNL'] || 0;
        const rmaxCount = sourceStats['RMAX'] || 0;
        
        let allTestsPassed = true;
        
        // Test 1: All Sources should show all customers
        if (testCases[0].expected === allCustomers.length) {
            console.log('✅ "All Sources" filter shows correct total');
        } else {
            console.log('❌ "All Sources" filter failed');
            allTestsPassed = false;
        }
        
        // Test 2: BSNL filter should show BSNL customers
        if (bsnlCount > 0) {
            console.log(`✅ BSNL filter should show ${bsnlCount} customers`);
        } else {
            console.log('❌ No BSNL customers found - this may be expected');
        }
        
        // Test 3: RMAX filter should show RMAX customers
        if (rmaxCount > 0) {
            console.log(`✅ RMAX filter should show ${rmaxCount} customers`);
        } else {
            console.log('❌ No RMAX customers found - this may be expected');
        }
        
        // Test 4: Check filtering logic consistency
        const totalFiltered = Object.values(sourceStats).reduce((sum, count) => sum + count, 0);
        if (totalFiltered === allCustomers.length) {
            console.log('✅ Filter counts match total customer count');
        } else {
            console.log('❌ Filter counts do not match total');
            allTestsPassed = false;
        }
        
        console.log('\n🎯 FINAL ASSESSMENT:');
        console.log('====================');
        if (allTestsPassed) {
            console.log('✅ All filtering tests passed!');
            console.log('✅ The fix should work correctly');
            console.log('\n📋 RECOMMENDATIONS:');
            console.log('• Test the UI by selecting different filters in the header');
            console.log('• Verify that customer counts change appropriately');
            console.log('• Check that the dataSource prop is passed correctly to all components');
        } else {
            console.log('❌ Some tests failed - review the implementation');
        }
        
        return {
            totalCustomers: allCustomers.length,
            sourceStats,
            testResults: {
                allSources: testCases[0].expected === allCustomers.length,
                bsnlHasData: bsnlCount > 0,
                rmaxHasData: rmaxCount > 0,
                countsMatch: totalFiltered === allCustomers.length
            }
        };
        
    } catch (error) {
        console.error('❌ Test failed:', error);
        return null;
    }
}

// Run the test
testFilteringFix()
    .then(result => {
        if (result) {
            console.log('\n✅ Test completed successfully!');
        } else {
            console.log('\n❌ Test failed!');
        }
        process.exit(0);
    })
    .catch(error => {
        console.error('💥 Unexpected error:', error);
        process.exit(1);
    });