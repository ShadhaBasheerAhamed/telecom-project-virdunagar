/**
 * Test Script to Create Sample Expired Customer Data
 * 
 * This script creates some test expired customers so we can demonstrate
 * the real Firebase data functionality in the dashboard charts.
 * 
 * Usage:
 * 1. Run: node scripts/createTestExpiredData.js
 * 2. Then run: node scripts/runExpiredDataMigration.js
 * 3. Finally test: node test-firebase-integration.js
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc } = require('firebase/firestore');

// Firebase config - matching frontend/src/firebase/config.ts
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

// Sample expired customer data
const testExpiredCustomers = [
  {
    name: 'RAJESH KUMAR',
    landline: '04562-123456',
    mobileNo: '9876543210',
    altMobileNo: '9876543211',
    email: 'rajesh.kumar@email.com',
    address: '123 Main Street, Virudhunagar',
    plan: 'Broadband Basic',
    status: 'expired',
    source: 'BSNL',
    renewalDate: '2025-12-10',
    reason: 'service_ended',
    notes: 'Customer requested discontinuation of service',
    createdAt: '2025-01-15T10:30:00.000Z'
  },
  {
    name: 'PRIYA SHARMA',
    landline: '04562-234567',
    mobileNo: '9876543212',
    altMobileNo: '9876543213',
    email: 'priya.sharma@email.com',
    address: '456 Gandhi Street, Virudhunagar',
    plan: 'Fiber Plus',
    status: 'expired',
    source: 'BSNL',
    renewalDate: '2025-12-08',
    reason: 'payment_failed',
    notes: 'Failed to make payment for 2 consecutive months',
    createdAt: '2025-02-20T14:15:00.000Z'
  },
  {
    name: 'ARUN KUMAR',
    landline: '04562-345678',
    mobileNo: '9876543214',
    altMobileNo: '9876543215',
    email: 'arun.kumar@email.com',
    address: '789 Nehru Street, Virudhunagar',
    plan: 'Broadband Premium',
    status: 'expired',
    source: 'BSNL',
    renewalDate: '2025-12-05',
    reason: 'customer_request',
    notes: 'Customer requested to discontinue service due to relocation',
    createdAt: '2025-03-10T09:45:00.000Z'
  },
  {
    name: 'SNEHA REDDY',
    landline: '04562-456789',
    mobileNo: '9876543216',
    altMobileNo: '9876543217',
    email: 'sneha.reddy@email.com',
    address: '321 MG Road, Virudhunagar',
    plan: 'Fiber Basic',
    status: 'expired',
    source: 'BSNL',
    renewalDate: '2025-12-03',
    reason: 'service_ended',
    notes: 'Service contract ended',
    createdAt: '2025-04-05T16:20:00.000Z'
  },
  {
    name: 'MOHAMMAD ALI',
    landline: '04562-567890',
    mobileNo: '9876543218',
    altMobileNo: '9876543219',
    email: 'mohammad.ali@email.com',
    address: '654 Bazaar Street, Virudhunagar',
    plan: 'Broadband Standard',
    status: 'expired',
    source: 'BSNL',
    renewalDate: '2025-12-01',
    reason: 'payment_failed',
    notes: 'Payment failed due to insufficient funds',
    createdAt: '2025-05-01T11:10:00.000Z'
  },
  {
    name: 'KAVITHA NAIR',
    landline: '04562-678901',
    mobileNo: '9876543220',
    altMobileNo: '9876543221',
    email: 'kavitha.nair@email.com',
    address: '987 Temple Street, Virudhunagar',
    plan: 'Fiber Plus',
    status: 'expired',
    source: 'BSNL',
    renewalDate: '2025-11-28',
    reason: 'service_ended',
    notes: 'Service contract expired',
    createdAt: '2025-06-15T13:25:00.000Z'
  }
];

async function createTestExpiredCustomers() {
  console.log('🚀 Creating test expired customers...');
  
  try {
    const customersRef = collection(db, 'customers');
    let created = 0;
    let failed = 0;
    
    for (const customer of testExpiredCustomers) {
      try {
        const docRef = await addDoc(customersRef, {
          ...customer,
          updatedAt: new Date().toISOString()
        });
        console.log(`✅ Created expired customer: ${customer.name} (${docRef.id})`);
        created++;
      } catch (error) {
        console.error(`❌ Failed to create customer ${customer.name}:`, error.message);
        failed++;
      }
    }
    
    console.log(`\n📊 Test Data Creation Summary:`);
    console.log(`   • Created: ${created} expired customers`);
    console.log(`   • Failed: ${failed} customers`);
    
    return { created, failed };
    
  } catch (error) {
    console.error('💥 Error creating test data:', error.message);
    throw error;
  }
}

async function runTestDataCreation() {
  console.log('🧪 Test Data Creation for Expired Customers\n');
  console.log('=' * 60);
  
  try {
    const result = await createTestExpiredCustomers();
    
    console.log('\n' + '=' * 60);
    console.log('✅ Test Data Creation Completed!');
    
    if (result.created > 0) {
      console.log('\n🔄 Next Steps:');
      console.log('   1. Run migration: node scripts/runExpiredDataMigration.js');
      console.log('   2. Test integration: node test-firebase-integration.js');
      console.log('   3. Check dashboard for real Firebase data in charts');
    }
    
    return result;
    
  } catch (error) {
    console.error('💥 Test data creation failed:', error.message);
    throw error;
  }
}

// Run if this script is executed directly
if (require.main === module) {
  runTestDataCreation()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('\n💥 Script failed:', error.message);
      process.exit(1);
    });
}

module.exports = { createTestExpiredCustomers, runTestDataCreation };