/**
 * Network Provider Filtering Issue Diagnostic Script
 * 
 * This script validates the root causes of the filtering issue:
 * 1. Data distribution problem (all customers on one provider)
 * 2. Inconsistent filtering logic across components
 * 3. Context vs prop data source mismatch
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, query, where } = require('firebase/firestore');

// Load Firebase config - create a simple config object for the script
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

async function diagnoseFilteringIssue() {
    console.log('🔍 NETWORK PROVIDER FILTERING DIAGNOSTIC');
    console.log('=========================================\n');
    
    try {
        // 1. CHECK DATA DISTRIBUTION
        console.log('📊 1. ANALYZING CUSTOMER DATA DISTRIBUTION...');
        const customersSnap = await getDocs(collection(db, 'customers'));
        const customers = customersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        console.log(`   Total customers: ${customers.length}`);
        
        if (customers.length === 0) {
            console.log('   ⚠️  No customers found!');
            return;
        }
        
        // Analyze source distribution
        const sourceDistribution = {};
        const statusDistribution = {};
        
        customers.forEach(customer => {
            const source = customer.source || 'UNDEFINED';
            const status = customer.status || 'UNDEFINED';
            
            sourceDistribution[source] = (sourceDistribution[source] || 0) + 1;
            statusDistribution[status] = (statusDistribution[status] || 0) + 1;
        });
        
        console.log('   Source Distribution:');
        Object.entries(sourceDistribution)
            .sort(([,a], [,b]) => b - a)
            .forEach(([source, count]) => {
                const percentage = ((count / customers.length) * 100).toFixed(1);
                console.log(`   • ${source}: ${count} customers (${percentage}%)`);
            });
        
        // 2. CHECK NETWORK PROVIDERS
        console.log('\n🏢 2. CHECKING NETWORK PROVIDERS...');
        const providersSnap = await getDocs(collection(db, 'network_providers'));
        const providers = providersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        console.log(`   Found ${providers.length} network providers:`);
        providers.forEach(provider => {
            console.log(`   • ${provider.name} (${provider.status}) - ID: ${provider.id}`);
        });
        
        // 3. TEST FILTERING WITH FIREBASE QUERIES
        console.log('\n🔍 3. TESTING FIREBASE FILTERING...');
        
        // Test BSNL filter
        const bsnlQuery = query(collection(db, 'customers'), where('source', '==', 'BSNL'));
        const bsnlSnap = await getDocs(bsnlQuery);
        console.log(`   BSNL filter result: ${bsnlSnap.size} customers`);
        
        // Test RMAX filter
        const rmaxQuery = query(collection(db, 'customers'), where('source', '==', 'RMAX'));
        const rmaxSnap = await getDocs(rmaxQuery);
        console.log(`   RMAX filter result: ${rmaxSnap.size} customers`);
        
        // Test "All" filter (no where clause)
        const allSnap = await getDocs(collection(db, 'customers'));
        console.log(`   "All" filter result: ${allSnap.size} customers`);
        
        // 4. CHECK PAYMENTS DATA
        console.log('\n💳 4. CHECKING PAYMENTS DATA...');
        const paymentsSnap = await getDocs(collection(db, 'payments'));
        const payments = paymentsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        const paymentSourceDistribution = {};
        payments.forEach(payment => {
            const source = payment.source || 'UNDEFINED';
            paymentSourceDistribution[source] = (paymentSourceDistribution[source] || 0) + 1;
        });
        
        console.log('   Payment Source Distribution:');
        Object.entries(paymentSourceDistribution)
            .sort(([,a], [,b]) => b - a)
            .forEach(([source, count]) => {
                console.log(`   • ${source}: ${count} payments`);
            });
        
        // 5. DIAGNOSIS
        console.log('\n🎯 DIAGNOSIS RESULTS:');
        console.log('=====================');
        
        const bsnlCount = sourceDistribution['BSNL'] || 0;
        const rmaxCount = sourceDistribution['RMAX'] || 0;
        const privateCount = sourceDistribution['Private'] || 0;
        
        const issues = [];
        
        // Issue 1: Data distribution
        if (bsnlCount > 0 && rmaxCount === 0) {
            issues.push({
                type: 'DATA_DISTRIBUTION',
                severity: 'HIGH',
                description: `All ${bsnlCount} customers are assigned to BSNL, none to RMAX`,
                impact: 'RMAX filter shows 0 results',
                solution: 'Migrate some customers to RMAX'
            });
        } else if (bsnlCount > 0 && rmaxCount > 0) {
            console.log('✅ Data distribution looks good');
        }
        
        // Issue 2: Firebase query results
        if (bsnlSnap.size !== bsnlCount) {
            issues.push({
                type: 'QUERY_INCONSISTENCY',
                severity: 'MEDIUM',
                description: `Firebase query for BSNL returned ${bsnlSnap.size} but manual count shows ${bsnlCount}`,
                impact: 'Inconsistent filtering results',
                solution: 'Check data consistency'
            });
        }
        
        if (issues.length === 0) {
            console.log('✅ No major issues detected with data distribution');
        } else {
            console.log(`❌ Found ${issues.length} issues:`);
            issues.forEach((issue, index) => {
                console.log(`\n${index + 1}. ${issue.type} (${issue.severity} PRIORITY)`);
                console.log(`   Description: ${issue.description}`);
                console.log(`   Impact: ${issue.impact}`);
                console.log(`   Solution: ${issue.solution}`);
            });
        }
        
        // 6. RECOMMENDATIONS
        console.log('\n📋 RECOMMENDATIONS:');
        console.log('===================');
        
        if (rmaxCount === 0 && bsnlCount > 0) {
            console.log('1. IMMEDIATE ACTION REQUIRED:');
            console.log('   • Run customer migration to create RMAX data');
            console.log('   • Command: node scripts/migrateCustomersToRMAX.js');
            console.log('');
            console.log('2. VERIFY FILTERING LOGIC:');
            console.log('   • Check that all components use consistent filtering');
            console.log('   • Ensure context and props are synchronized');
            console.log('   • Test Firebase queries match client-side filtering');
        } else {
            console.log('1. CHECK FILTERING IMPLEMENTATION:');
            console.log('   • Verify context vs prop dataSource synchronization');
            console.log('   • Ensure all components re-render on dataSource change');
            console.log('   • Test client-side filtering logic');
        }
        
        return {
            customersCount: customers.length,
            sourceDistribution,
            statusDistribution,
            providersCount: providers.length,
            paymentsCount: payments.length,
            firebaseFilterResults: {
                bsnl: bsnlSnap.size,
                rmax: rmaxSnap.size,
                all: allSnap.size
            },
            issues
        };
        
    } catch (error) {
        console.error('❌ Diagnostic failed:', error);
        return null;
    }
}

// Run the diagnostic
diagnoseFilteringIssue()
    .then(result => {
        if (result) {
            console.log('\n✅ Diagnostic completed successfully!');
            console.log('Use this information to implement the fix.');
        } else {
            console.log('\n❌ Diagnostic failed!');
        }
        process.exit(0);
    })
    .catch(error => {
        console.error('💥 Unexpected error:', error);
        process.exit(1);
    });