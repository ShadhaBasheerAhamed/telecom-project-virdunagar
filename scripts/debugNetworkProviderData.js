/**
 * Network Provider Data Diagnostic Script
 * 
 * This script analyzes the current distribution of customer data by source
 * to identify why the header filtering is showing 0 for individual providers.
 * 
 * Usage: node scripts/debugNetworkProviderData.js
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');

// Import Firebase config (adjust path if needed)
const firebaseConfig = require('../src/firebase/config.ts');

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function debugNetworkProviders() {
    console.log('🔍 Network Provider Data Diagnostic');
    console.log('=====================================\n');
    
    try {
        // Check customers collection
        console.log('📊 Analyzing Customer Data...\n');
        const customersSnap = await getDocs(collection(db, 'customers'));
        const customers = customersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        if (customers.length === 0) {
            console.log('⚠️  No customers found in database!');
            return;
        }
        
        // Analyze source distribution
        const sourceDistribution = {};
        const statusDistribution = {};
        let customersWithSource = 0;
        let customersWithoutSource = 0;
        
        customers.forEach(customer => {
            const source = customer.source || 'UNDEFINED';
            const status = customer.status || 'UNDEFINED';
            
            sourceDistribution[source] = (sourceDistribution[source] || 0) + 1;
            statusDistribution[status] = (statusDistribution[status] || 0) + 1;
            
            if (customer.source) {
                customersWithSource++;
            } else {
                customersWithoutSource++;
                console.log(`⚠️  Customer without source: ${customer.name} (${customer.landline})`);
            }
        });
        
        console.log('📈 Customer Source Distribution:');
        Object.entries(sourceDistribution)
            .sort(([,a], [,b]) => b - a)
            .forEach(([source, count]) => {
                const percentage = ((count / customers.length) * 100).toFixed(1);
                console.log(`   ${source.padEnd(10)}: ${count.toString().padStart(3)} customers (${percentage}%)`);
            });
        
        console.log(`\n📈 Customer Status Distribution:`);
        Object.entries(statusDistribution)
            .sort(([,a], [,b]) => b - a)
            .forEach(([status, count]) => {
                const percentage = ((count / customers.length) * 100).toFixed(1);
                console.log(`   ${status.padEnd(10)}: ${count.toString().padStart(3)} customers (${percentage}%)`);
            });
        
        console.log(`\n📋 Summary:`);
        console.log(`   Total customers: ${customers.length}`);
        console.log(`   With source defined: ${customersWithSource}`);
        console.log(`   Without source: ${customersWithoutSource}`);
        
        // Check network_providers collection
        console.log('\n🏢 Analyzing Network Providers...\n');
        const providersSnap = await getDocs(collection(db, 'network_providers'));
        const providers = providersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        if (providers.length === 0) {
            console.log('⚠️  No network providers found!');
        } else {
            console.log('Network Providers:');
            providers.forEach(provider => {
                console.log(`   ${provider.name} (${provider.status}) - ID: ${provider.id}`);
            });
        }
        
        // Check other relevant collections
        console.log('\n💳 Checking Payments...\n');
        const paymentsSnap = await getDocs(collection(db, 'payments'));
        const payments = paymentsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        const paymentSourceDistribution = {};
        payments.forEach(payment => {
            const source = payment.source || 'UNDEFINED';
            paymentSourceDistribution[source] = (paymentSourceDistribution[source] || 0) + 1;
        });
        
        console.log('Payment Source Distribution:');
        Object.entries(paymentSourceDistribution)
            .sort(([,a], [,b]) => b - a)
            .forEach(([source, count]) => {
                console.log(`   ${source.padEnd(10)}: ${count} payments`);
            });
        
        // Check complaints
        console.log('\n📞 Checking Complaints...\n');
        const complaintsSnap = await getDocs(collection(db, 'complaints'));
        const complaints = complaintsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        const complaintSourceDistribution = {};
        complaints.forEach(complaint => {
            const source = complaint.source || 'UNDEFINED';
            complaintSourceDistribution[source] = (complaintSourceDistribution[source] || 0) + 1;
        });
        
        console.log('Complaint Source Distribution:');
        Object.entries(complaintSourceDistribution)
            .sort(([,a], [,b]) => b - a)
            .forEach(([source, count]) => {
                console.log(`   ${source.padEnd(10)}: ${count} complaints`);
            });
        
        // Provide diagnosis
        console.log('\n🎯 DIAGNOSIS:');
        console.log('=============');
        
        const bsnlCount = sourceDistribution['BSNL'] || 0;
        const rmaxCount = sourceDistribution['RMAX'] || 0;
        const privateCount = sourceDistribution['Private'] || 0;
        
        if (bsnlCount > 0 && rmaxCount === 0) {
            console.log('❌ ISSUE IDENTIFIED:');
            console.log(`   • All ${bsnlCount} customers have 'BSNL' as source`);
            console.log('   • No customers have "RMAX" as source');
            console.log('   • Header filter for "RMAX" will show 0 results');
            console.log('\n✅ SOLUTION:');
            console.log('   Run the migration script to split customers between BSNL and RMAX:');
            console.log('   node scripts/migrateCustomersToRMAX.js');
        } else if (bsnlCount > 0 && rmaxCount > 0) {
            console.log('✅ Data distribution looks good!');
            console.log(`   • BSNL: ${bsnlCount} customers`);
            console.log(`   • RMAX: ${rmaxCount} customers`);
            console.log('   • Header filters should work correctly');
        } else {
            console.log('⚠️  UNEXPECTED DATA DISTRIBUTION:');
            console.log('   Please check the data manually');
        }
        
        return {
            customers,
            providers,
            payments,
            complaints,
            sourceDistribution,
            statusDistribution
        };
        
    } catch (error) {
        console.error('❌ Diagnostic failed:', error);
        return null;
    }
}

// Run the diagnostic
debugNetworkProviders()
    .then(result => {
        if (result) {
            console.log('\n✅ Diagnostic completed successfully!');
        } else {
            console.log('\n❌ Diagnostic failed!');
        }
        process.exit(0);
    })
    .catch(error => {
        console.error('💥 Unexpected error:', error);
        process.exit(1);
    });