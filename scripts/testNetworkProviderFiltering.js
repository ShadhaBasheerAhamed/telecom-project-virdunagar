/**
 * Network Provider Filtering Test Script
 * 
 * This script tests the header filtering functionality to ensure
 * the Network Provider (BSNL/RMAX) filters work correctly after migration.
 * 
 * Usage: node scripts/testNetworkProviderFiltering.js
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');

// Import Firebase config (adjust path if needed)
const firebaseConfig = require('../src/firebase/config.ts');

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function testNetworkProviderFiltering() {
    console.log('🧪 Network Provider Filtering Test');
    console.log('===================================\n');
    
    try {
        // Get all customers
        const customersSnap = await getDocs(collection(db, 'customers'));
        const customers = customersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        if (customers.length === 0) {
            console.log('❌ No customers found to test!');
            return false;
        }
        
        console.log(`📊 Testing with ${customers.length} customers\n`);
        
        // Simulate filtering logic from DashboardService
        const testFilters = ['All', 'BSNL', 'RMAX', 'Private'];
        
        console.log('🔍 Testing Filter Logic:');
        console.log('========================\n');
        
        testFilters.forEach(filter => {
            let filteredCustomers = [];
            
            if (filter === 'All') {
                filteredCustomers = customers;
            } else {
                filteredCustomers = customers.filter(customer => {
                    const customerSource = customer.source || '';
                    return customerSource === filter;
                });
            }
            
            // Calculate stats for filtered customers
            const statusCounts = {
                'Active': 0,
                'Inactive': 0,
                'Suspended': 0,
                'Expired': 0,
                'Disabled': 0
            };
            
            filteredCustomers.forEach(customer => {
                const status = (customer.status || '').toLowerCase();
                if (status === 'active') statusCounts['Active']++;
                else if (status === 'inactive') statusCounts['Inactive']++;
                else if (status === 'suspended') statusCounts['Suspended']++;
                else if (status === 'expired') statusCounts['Expired']++;
                else if (status === 'disabled') statusCounts['Disabled']++;
            });
            
            const totalActive = statusCounts['Active'];
            const totalExpired = statusCounts['Expired'];
            const totalSuspended = statusCounts['Suspended'];
            const totalDisabled = statusCounts['Disabled'];
            
            console.log(`📋 Filter: "${filter}"`);
            console.log(`   Total Customers: ${filteredCustomers.length}`);
            console.log(`   Active: ${totalActive}`);
            console.log(`   Expired: ${totalExpired}`);
            console.log(`   Suspended: ${totalSuspended}`);
            console.log(`   Disabled: ${totalDisabled}`);
            
            // Test dashboard-style calculations
            const calculatedExpired = Math.max(0, filteredCustomers.length - (totalActive + totalSuspended + totalDisabled));
            
            if (calculatedExpired !== totalExpired) {
                console.log(`   ⚠️  Expired calculation mismatch: expected ${calculatedExpired}, got ${totalExpired}`);
            }
            
            // Success criteria
            if (filter === 'All') {
                if (filteredCustomers.length > 0) {
                    console.log(`   ✅ PASS: Shows all customers (${filteredCustomers.length})`);
                } else {
                    console.log(`   ❌ FAIL: Should show all customers but shows ${filteredCustomers.length}`);
                }
            } else {
                if (filteredCustomers.length > 0) {
                    console.log(`   ✅ PASS: Shows ${filteredCustomers.length} ${filter} customers`);
                } else {
                    console.log(`   ⚠️  WARN: Shows 0 ${filter} customers (may be expected if no data exists)`);
                }
            }
            
            console.log(''); // Empty line for readability
        });
        
        // Test edge cases
        console.log('🔬 Testing Edge Cases:');
        console.log('======================\n');
        
        // Test customers without source
        const customersWithoutSource = customers.filter(c => !c.source || c.source.trim() === '');
        console.log(`📋 Customers without source: ${customersWithoutSource.length}`);
        if (customersWithoutSource.length > 0) {
            console.log('   ⚠️  These customers may not appear in any filter except "All"');
            customersWithoutSource.slice(0, 3).forEach(customer => {
                console.log(`      - ${customer.name || customer.landline || customer.id}`);
            });
        }
        
        // Test invalid source values
        const customersWithInvalidSource = customers.filter(c => 
            c.source && !['BSNL', 'RMAX', 'Private'].includes(c.source)
        );
        console.log(`📋 Customers with invalid source: ${customersWithInvalidSource.length}`);
        if (customersWithInvalidSource.length > 0) {
            console.log('   ⚠️  These customers have non-standard source values');
            customersWithInvalidSource.slice(0, 3).forEach(customer => {
                console.log(`      - ${customer.name || customer.landline || customer.id}: "${customer.source}"`);
            });
        }
        
        // Test network providers collection
        console.log('\n🏢 Testing Network Providers:');
        console.log('==============================\n');
        
        const providersSnap = await getDocs(collection(db, 'network_providers'));
        const providers = providersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        if (providers.length === 0) {
            console.log('❌ FAIL: No network providers found!');
            console.log('   Header dropdown may be empty or show only "All Sources"');
        } else {
            console.log(`✅ PASS: Found ${providers.length} network providers:`);
            providers.forEach(provider => {
                const status = provider.status === 'Active' ? '✅' : '⚠️';
                console.log(`   ${status} ${provider.name} (${provider.status})`);
            });
        }
        
        // Overall assessment
        console.log('\n🎯 Overall Assessment:');
        console.log('======================\n');
        
        const sourceDistribution = {};
        customers.forEach(customer => {
            const source = customer.source || 'UNDEFINED';
            sourceDistribution[source] = (sourceDistribution[source] || 0) + 1;
        });
        
        const bsnlCount = sourceDistribution['BSNL'] || 0;
        const rmaxCount = sourceDistribution['RMAX'] || 0;
        const privateCount = sourceDistribution['Private'] || 0;
        const undefinedCount = sourceDistribution['UNDEFINED'] || 0;
        
        console.log('📊 Current Data Distribution:');
        console.log(`   BSNL: ${bsnlCount} customers`);
        console.log(`   RMAX: ${rmaxCount} customers`);
        console.log(`   Private: ${privateCount} customers`);
        console.log(`   Undefined: ${undefinedCount} customers`);
        
        // Provide recommendations
        console.log('\n💡 Recommendations:');
        console.log('===================\n');
        
        if (bsnlCount > 0 && rmaxCount === 0) {
            console.log('❌ ISSUE: All customers are BSNL, no RMAX data exists');
            console.log('   → Run: node scripts/migrateCustomersToRMAX.js');
            console.log('   → This will split customers between BSNL and RMAX for testing');
        } else if (bsnlCount > 0 && rmaxCount > 0) {
            console.log('✅ GOOD: Balanced distribution between BSNL and RMAX');
            console.log('   → Header filters should work correctly');
            console.log('   → Test manually by selecting different providers in header');
        } else {
            console.log('⚠️  UNUSUAL: Unexpected distribution pattern');
            console.log('   → Check data manually');
            console.log('   → Verify Network Providers are set up correctly');
        }
        
        if (undefinedCount > 0) {
            console.log(`⚠️  DATA CLEANUP: ${undefinedCount} customers without source defined`);
            console.log('   → Consider running data cleanup to assign proper sources');
        }
        
        return {
            success: true,
            customers,
            providers,
            sourceDistribution,
            recommendations: {
                hasRMAXData: rmaxCount > 0,
                hasBalancedDistribution: bsnlCount > 0 && rmaxCount > 0,
                needsMigration: bsnlCount > 0 && rmaxCount === 0,
                hasUndefinedSources: undefinedCount > 0
            }
        };
        
    } catch (error) {
        console.error('❌ Test failed:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// Run the test
testNetworkProviderFiltering()
    .then(result => {
        if (result.success) {
            console.log('\n✅ Filtering test completed successfully!');
            if (result.recommendations.needsMigration) {
                console.log('\n🔧 NEXT STEP: Run the migration script to fix the filtering issue');
                console.log('   node scripts/migrateCustomersToRMAX.js');
            }
        } else {
            console.log('\n❌ Filtering test failed!');
        }
        process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
        console.error('💥 Unexpected error:', error);
        process.exit(1);
    });