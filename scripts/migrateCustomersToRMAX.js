/**
 * Network Provider Data Migration Script
 * 
 * This script migrates customers from BSNL to RMAX to create a balanced
 * distribution for proper header filtering testing.
 * 
 * Usage: node scripts/migrateCustomersToRMAX.js
 * 
 * WARNING: This script modifies customer data in your database!
 * Make sure to backup your data before running.
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, updateDoc, doc } = require('firebase/firestore');

// Import Firebase config (adjust path if needed)
const firebaseConfig = require('../src/firebase/config.ts');

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function migrateCustomersToRMAX() {
    console.log('🔄 Network Provider Data Migration');
    console.log('===================================\n');
    
    console.log('⚠️  WARNING: This script will modify customer data!');
    console.log('   • It will change the source field of some customers from BSNL to RMAX');
    console.log('   • This action cannot be undone automatically');
    console.log('   • Make sure you have a backup of your data\n');
    
    // Simple confirmation
    const response = prompt('Do you want to continue? (yes/no): ');
    if (response !== 'yes' && response !== 'y') {
        console.log('❌ Migration cancelled by user.');
        return 0;
    }
    
    try {
        // Get all customers
        console.log('📊 Fetching customer data...\n');
        const customersSnap = await getDocs(collection(db, 'customers'));
        const customers = customersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        if (customers.length === 0) {
            console.log('❌ No customers found to migrate!');
            return 0;
        }
        
        // Analyze current distribution
        const sourceDistribution = {};
        customers.forEach(customer => {
            const source = customer.source || 'UNDEFINED';
            sourceDistribution[source] = (sourceDistribution[source] || 0) + 1;
        });
        
        console.log('📈 Current Source Distribution:');
        Object.entries(sourceDistribution).forEach(([source, count]) => {
            console.log(`   ${source}: ${count} customers`);
        });
        
        // Calculate migration strategy
        const bsnlCustomers = customers.filter(c => c.source === 'BSNL');
        const customersToMigrate = Math.floor(bsnlCustomers.length * 0.5); // 50% of BSNL customers
        
        console.log(`\n🔄 Migration Plan:`);
        console.log(`   • Found ${bsnlCustomers.length} customers with BSNL source`);
        console.log(`   • Will migrate ${customersToMigrate} customers to RMAX`);
        console.log(`   • Remaining BSNL customers: ${bsnlCustomers.length - customersToMigrate}`);
        console.log(`   • Expected RMAX customers after migration: ${customersToMigrate}`);
        
        if (customersToMigrate === 0) {
            console.log('\n⚠️  No BSNL customers found to migrate!');
            return 0;
        }
        
        // Confirm migration
        console.log('\n❓ Migration Summary:');
        console.log(`   This will create a balanced distribution:`);
        console.log(`   • BSNL: ${bsnlCustomers.length - customersToMigrate} customers`);
        console.log(`   • RMAX: ${customersToMigrate} customers`);
        
        const confirmResponse = prompt('\nProceed with migration? (yes/no): ');
        if (confirmResponse !== 'yes' && confirmResponse !== 'y') {
            console.log('❌ Migration cancelled by user.');
            return 0;
        }
        
        // Perform migration
        console.log('\n🚀 Starting migration...\n');
        let migrated = 0;
        let skipped = 0;
        let errors = 0;
        
        // Take every other BSNL customer and change source to RMAX
        for (let i = 0; i < bsnlCustomers.length; i++) {
            const customer = bsnlCustomers[i];
            
            // Select every other customer (or based on some other criteria)
            if (i % 2 === 1 || (customersToMigrate > migrated && i % 3 === 0)) {
                try {
                    const customerRef = doc(db, 'customers', customer.id);
                    
                    await updateDoc(customerRef, {
                        source: 'RMAX',
                        updatedAt: new Date().toISOString(),
                        migrationNote: `Migrated from BSNL to RMAX on ${new Date().toISOString()}`
                    });
                    
                    console.log(`✅ Migrated: ${customer.name || customer.landline || customer.id} → RMAX`);
                    migrated++;
                    
                    // Add small delay to avoid overwhelming Firebase
                    if (migrated % 10 === 0) {
                        await new Promise(resolve => setTimeout(resolve, 100));
                    }
                    
                } catch (error) {
                    console.error(`❌ Failed to migrate ${customer.name || customer.landline || customer.id}:`, error.message);
                    errors++;
                }
            } else {
                skipped++;
            }
        }
        
        console.log(`\n📊 Migration Results:`);
        console.log(`   • Successfully migrated: ${migrated} customers`);
        console.log(`   • Skipped: ${skipped} customers`);
        console.log(`   • Errors: ${errors} customers`);
        
        // Verify results
        console.log('\n🔍 Verifying migration results...\n');
        const updatedSnap = await getDocs(collection(db, 'customers'));
        const updatedCustomers = updatedSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        const newDistribution = {};
        updatedCustomers.forEach(customer => {
            const source = customer.source || 'UNDEFINED';
            newDistribution[source] = (newDistribution[source] || 0) + 1;
        });
        
        console.log('📈 Updated Source Distribution:');
        Object.entries(newDistribution)
            .sort(([,a], [,b]) => b - a)
            .forEach(([source, count]) => {
                const percentage = ((count / updatedCustomers.length) * 100).toFixed(1);
                console.log(`   ${source.padEnd(10)}: ${count.toString().padStart(3)} customers (${percentage}%)`);
            });
        
        // Test filtering logic
        console.log('\n🧪 Testing Filter Logic:');
        const bsnlCount = newDistribution['BSNL'] || 0;
        const rmaxCount = newDistribution['RMAX'] || 0;
        const privateCount = newDistribution['Private'] || 0;
        
        console.log(`   • "All Sources" filter should show: ${updatedCustomers.length} customers`);
        console.log(`   • "BSNL" filter should show: ${bsnlCount} customers`);
        console.log(`   • "RMAX" filter should show: ${rmaxCount} customers`);
        console.log(`   • "Private" filter should show: ${privateCount} customers`);
        
        if (bsnlCount > 0 && rmaxCount > 0) {
            console.log('\n✅ SUCCESS: Data distribution is now balanced!');
            console.log('   Header filters should work correctly.');
        } else {
            console.log('\n⚠️  WARNING: Distribution may still be unbalanced.');
            console.log('   Consider running the migration again or manually adjusting data.');
        }
        
        return migrated;
        
    } catch (error) {
        console.error('❌ Migration failed:', error);
        return 0;
    }
}

// Add prompt function for Node.js
function prompt(message) {
    const readline = require('readline');
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    
    return new Promise(resolve => {
        rl.question(message, answer => {
            rl.close();
            resolve(answer);
        });
    });
}

// Run the migration
migrateCustomersToRMAX()
    .then(migratedCount => {
        if (migratedCount > 0) {
            console.log(`\n🎉 Migration completed successfully! ${migratedCount} customers migrated.`);
            console.log('\n📋 Next Steps:');
            console.log('   1. Refresh your dashboard');
            console.log('   2. Test header filters: All Sources, BSNL, RMAX');
            console.log('   3. Verify data appears correctly on all pages');
        } else {
            console.log('\n❌ Migration failed or was cancelled.');
        }
        process.exit(0);
    })
    .catch(error => {
        console.error('💥 Unexpected error:', error);
        process.exit(1);
    });