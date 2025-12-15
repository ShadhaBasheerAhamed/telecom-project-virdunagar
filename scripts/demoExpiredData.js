/**
 * Demo Script to Create Sample Expired Overview Records
 * 
 * This script directly creates sample expired overview records to demonstrate
 * the real Firebase data functionality in dashboard charts.
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc } = require('firebase/firestore');

// Firebase config
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

// Sample expired overview data
const sampleExpiredOverviewData = [
  {
    customerId: 'demo-cust-001',
    customerName: 'RAJESH KUMAR',
    planType: 'Broadband Basic',
    expiredDate: '2025-12-10',
    reason: 'service_ended',
    source: 'BSNL',
    createdAt: '2025-12-10T10:30:00.000Z'
  },
  {
    customerId: 'demo-cust-002',
    customerName: 'PRIYA SHARMA',
    planType: 'Fiber Plus',
    expiredDate: '2025-12-08',
    reason: 'payment_failed',
    source: 'BSNL',
    createdAt: '2025-12-08T14:15:00.000Z'
  },
  {
    customerId: 'demo-cust-003',
    customerName: 'ARUN KUMAR',
    planType: 'Broadband Premium',
    expiredDate: '2025-12-05',
    reason: 'customer_request',
    source: 'BSNL',
    createdAt: '2025-12-05T09:45:00.000Z'
  },
  {
    customerId: 'demo-cust-004',
    customerName: 'SNEHA REDDY',
    planType: 'Fiber Basic',
    expiredDate: '2025-12-03',
    reason: 'service_ended',
    source: 'BSNL',
    createdAt: '2025-12-03T16:20:00.000Z'
  },
  {
    customerId: 'demo-cust-005',
    customerName: 'MOHAMMAD ALI',
    planType: 'Broadband Standard',
    expiredDate: '2025-12-01',
    reason: 'payment_failed',
    source: 'BSNL',
    createdAt: '2025-12-01T11:10:00.000Z'
  },
  {
    customerId: 'demo-cust-006',
    customerName: 'KAVITHA NAIR',
    planType: 'Fiber Plus',
    expiredDate: '2025-11-28',
    reason: 'service_ended',
    source: 'BSNL',
    createdAt: '2025-11-28T13:25:00.000Z'
  }
];

async function createDemoExpiredOverviewData() {
  console.log('🚀 Creating demo expired overview data...');
  
  try {
    const expiredOverviewRef = collection(db, 'expired_overview');
    let created = 0;
    let failed = 0;
    
    for (const record of sampleExpiredOverviewData) {
      try {
        const docRef = await addDoc(expiredOverviewRef, {
          ...record,
          updatedAt: new Date().toISOString()
        });
        console.log(`✅ Created expired overview record: ${record.customerName} (${docRef.id})`);
        created++;
      } catch (error) {
        console.error(`❌ Failed to create record for ${record.customerName}:`, error.message);
        failed++;
      }
    }
    
    console.log(`\n📊 Demo Data Creation Summary:`);
    console.log(`   • Created: ${created} expired overview records`);
    console.log(`   • Failed: ${failed} records`);
    
    return { created, failed };
    
  } catch (error) {
    console.error('💥 Error creating demo data:', error.message);
    throw error;
  }
}

async function runDemo() {
  console.log('🧪 Demo Expired Overview Data Creation\n');
  console.log('=' * 60);
  
  try {
    const result = await createDemoExpiredOverviewData();
    
    console.log('\n' + '=' * 60);
    console.log('✅ Demo Data Creation Completed!');
    
    if (result.created > 0) {
      console.log('\n🔄 Next Steps:');
      console.log('   1. Test integration: node test-firebase-integration.js');
      console.log('   2. Check dashboard for real Firebase data in charts');
      console.log('   3. Dashboard will now show real expired customer data instead of hardcoded sample data');
    }
    
    return result;
    
  } catch (error) {
    console.error('💥 Demo data creation failed:', error.message);
    throw error;
  }
}

// Run if this script is executed directly
if (require.main === module) {
  runDemo()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('\n💥 Script failed:', error.message);
      process.exit(1);
    });
}

module.exports = { createDemoExpiredOverviewData, runDemo };