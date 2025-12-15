/**
 * Migration Script to Populate expired_overview Collection
 * 
 * This script should be run to migrate expired customers from the customers collection
 * to the new expired_overview collection for real Firebase data in dashboard charts.
 * 
 * Usage:
 * 1. Make sure Firebase is initialized and you have access to the Firestore
 * 2. Run: node scripts/runExpiredDataMigration.js
 * 3. Check the console output for migration results
 */

const { initializeApp } = require('firebase/app');
const { getFirestore } = require('firebase/firestore');
const path = require('path');

// Firebase config - make sure this matches your frontend/src/firebase/config.ts
const firebaseConfig = {
  apiKey: "AIzaSyCP6cvVrFmYgekRbm5titNYPJpP4iWH3EE",
  authDomain: "telecomproject-virudhunagar.firebaseapp.com",
  projectId: "telecomproject-virudhunagar",
  storageBucket: "telecomproject-virudhunagar.firebasestorage.app",
  messagingSenderId: "1080285921059",
  appId: "1:1080285921059:web:f09f84e52371158e3c1696"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Mock the services for Node.js environment
const ExpiredOverviewService = {
  async addExpiredRecord(record) {
    const { collection, addDoc, doc, setDoc } = require('firebase/firestore');
    const docRef = await addDoc(collection(db, 'expired_overview'), {
      ...record,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    return docRef.id;
  },

  async getExpiredRecords() {
    const { collection, getDocs, query, orderBy, limit } = require('firebase/firestore');
    const q = query(
      collection(db, 'expired_overview'),
      orderBy('expiredDate', 'desc'),
      limit(1000)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  async clearAllExpiredRecords() {
    const { collection, getDocs, query, orderBy, limit, writeBatch, doc } = require('firebase/firestore');
    const records = await this.getExpiredRecords();
    
    const batchSize = 500;
    let success = 0;
    let failed = 0;
    const errors = [];

    for (let i = 0; i < records.length; i += batchSize) {
      const batch = writeBatch(db);
      const chunk = records.slice(i, i + batchSize);

      chunk.forEach((record) => {
        if (record.id) {
          const docRef = doc(db, 'expired_overview', record.id);
          batch.delete(docRef);
        }
      });

      try {
        await batch.commit();
        success += chunk.length;
      } catch (error) {
        failed += chunk.length;
        errors.push(`Batch ${Math.floor(i / batchSize) + 1} failed: ${error}`);
      }
    }

    return { success, failed, errors };
  }
};

const CustomerService = {
  async getCustomers() {
    const { collection, getDocs, query, orderBy, limit } = require('firebase/firestore');
    const q = query(
      collection(db, 'customers'),
      orderBy('createdAt', 'desc'),
      limit(1000)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }
};

// Migration Logic
async function migrateExpiredCustomers() {
  console.log('🚀 Starting migration of expired customers...');

  try {
    // Get all customers from the customers collection
    const allCustomers = await CustomerService.getCustomers();
    console.log(`📊 Found ${allCustomers.length} total customers`);

    // Filter customers with expired status
    const expiredCustomers = allCustomers.filter(customer => {
      const status = (customer.status || '').toLowerCase();
      return status === 'expired';
    });

    console.log(`⚠️  Found ${expiredCustomers.length} expired customers`);

    if (expiredCustomers.length === 0) {
      console.log('ℹ️  No expired customers found to migrate');
      return {
        success: 0,
        failed: 0,
        errors: [],
        totalCustomersChecked: allCustomers.length,
        expiredCustomersFound: 0
      };
    }

    // Clear existing expired_overview collection first
    console.log('🧹 Clearing existing expired_overview collection...');
    await ExpiredOverviewService.clearAllExpiredRecords();

    // Transform expired customers to expired_overview format
    const expiredOverviewRecords = expiredCustomers.map(customer => {
      // Determine expired date (use renewalDate if available, otherwise use updatedAt or createdAt)
      let expiredDate;
      if (customer.renewalDate) {
        expiredDate = new Date(customer.renewalDate).toISOString().split('T')[0];
      } else if (customer.updatedAt) {
        expiredDate = new Date(customer.updatedAt).toISOString().split('T')[0];
      } else if (customer.createdAt) {
        expiredDate = new Date(customer.createdAt).toISOString().split('T')[0];
      } else {
        // Default to current date if no date information available
        expiredDate = new Date().toISOString().split('T')[0];
      }

      // Determine reason based on customer data
      let reason = 'service_ended'; // default reason
      if (customer.reason) {
        reason = customer.reason;
      } else if (customer.notes && customer.notes.toLowerCase().includes('payment')) {
        reason = 'payment_failed';
      } else if (customer.notes && customer.notes.toLowerCase().includes('request')) {
        reason = 'customer_request';
      }

      return {
        customerId: customer.id || '',
        customerName: customer.name || 'Unknown Customer',
        planType: customer.plan || 'Unknown Plan',
        expiredDate,
        reason,
        source: customer.source || 'Unknown',
        createdAt: new Date().toISOString()
      };
    });

    console.log(`📝 Prepared ${expiredOverviewRecords.length} records for migration`);

    // Insert the records
    let success = 0;
    let failed = 0;
    const errors = [];

    for (const record of expiredOverviewRecords) {
      try {
        await ExpiredOverviewService.addExpiredRecord(record);
        success++;
        if (success % 10 === 0) {
          console.log(`✅ Processed ${success}/${expiredOverviewRecords.length} records`);
        }
      } catch (error) {
        failed++;
        errors.push(`Failed to insert record for customer ${record.customerId}: ${error.message}`);
      }
    }

    const result = {
      success,
      failed,
      errors,
      totalCustomersChecked: allCustomers.length,
      expiredCustomersFound: expiredCustomers.length
    };

    console.log('🎉 Migration completed!', result);
    return result;

  } catch (error) {
    console.error('💥 Migration failed:', error);
    return {
      success: 0,
      failed: 0,
      errors: [error.message],
      totalCustomersChecked: 0,
      expiredCustomersFound: 0
    };
  }
}

// Test the migration
async function testMigration() {
  console.log('🧪 Testing migration...');
  
  const result = await migrateExpiredCustomers();
  
  if (result.success > 0) {
    console.log('✅ Migration test PASSED!');
    console.log(`📈 Successfully migrated ${result.success} expired customers`);
    
    // Verify the data was created
    const records = await ExpiredOverviewService.getExpiredRecords();
    console.log(`🔍 Verified: ${records.length} records exist in expired_overview collection`);
    
    if (records.length > 0) {
      console.log('📋 Sample record:', {
        customerId: records[0].customerId,
        customerName: records[0].customerName,
        expiredDate: records[0].expiredDate,
        reason: records[0].reason,
        source: records[0].source
      });
    }
  } else {
    console.log('❌ Migration test FAILED!');
    if (result.errors.length > 0) {
      console.log('🚨 Errors:', result.errors);
    }
  }
  
  return result;
}

// Run the migration
if (require.main === module) {
  testMigration().then(() => {
    console.log('🏁 Migration script completed');
    process.exit(0);
  }).catch((error) => {
    console.error('💥 Migration script failed:', error);
    process.exit(1);
  });
}

module.exports = { migrateExpiredCustomers, testMigration };