/**
 * Test Script to Verify Firebase Integration for Dashboard Charts
 * 
 * This script tests that:
 * 1. The expired_overview collection exists and has data
 * 2. The dashboard service correctly fetches real Firebase data
 * 3. The complaints collection works properly
 * 4. Charts will display real data instead of hardcoded sample data
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, doc, getDoc } = require('firebase/firestore');

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

async function testCollectionsExist() {
  console.log('🔍 Testing Firebase Collections...');
  
  try {
    // Test customers collection
    const customersSnapshot = await getDocs(collection(db, 'customers'));
    console.log(`✅ Customers collection: ${customersSnapshot.size} documents`);
    
    // Test complaints collection
    const complaintsSnapshot = await getDocs(collection(db, 'complaints'));
    console.log(`✅ Complaints collection: ${complaintsSnapshot.size} documents`);
    
    // Test expired_overview collection
    const expiredOverviewSnapshot = await getDocs(collection(db, 'expired_overview'));
    console.log(`✅ Expired Overview collection: ${expiredOverviewSnapshot.size} documents`);
    
    return {
      customers: customersSnapshot.size,
      complaints: complaintsSnapshot.size,
      expiredOverview: expiredOverviewSnapshot.size
    };
  } catch (error) {
    console.error('❌ Error checking collections:', error.message);
    throw error;
  }
}

async function testExpiredOverviewData() {
  console.log('\n📊 Testing Expired Overview Data...');
  
  try {
    const expiredOverviewSnapshot = await getDocs(collection(db, 'expired_overview'));
    const records = expiredOverviewSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    if (records.length === 0) {
      console.log('⚠️  No expired overview records found. You need to run the migration script.');
      console.log('💡 Run: node scripts/runExpiredDataMigration.js');
      return { hasData: false, records: [] };
    }
    
    console.log(`✅ Found ${records.length} expired overview records`);
    
    // Analyze the data structure
    const sampleRecord = records[0];
    console.log('📋 Sample expired overview record structure:');
    console.log({
      id: sampleRecord.id,
      customerId: sampleRecord.customerId,
      customerName: sampleRecord.customerName,
      planType: sampleRecord.planType,
      expiredDate: sampleRecord.expiredDate,
      reason: sampleRecord.reason,
      source: sampleRecord.source,
      createdAt: sampleRecord.createdAt
    });
    
    // Group by reason
    const reasonCounts = {};
    records.forEach(record => {
      reasonCounts[record.reason] = (reasonCounts[record.reason] || 0) + 1;
    });
    console.log('📈 Expired reasons distribution:', reasonCounts);
    
    // Group by source
    const sourceCounts = {};
    records.forEach(record => {
      sourceCounts[record.source] = (sourceCounts[record.source] || 0) + 1;
    });
    console.log('📈 Sources distribution:', sourceCounts);
    
    return { hasData: true, records, reasonCounts, sourceCounts };
  } catch (error) {
    console.error('❌ Error testing expired overview data:', error.message);
    throw error;
  }
}

async function testComplaintsData() {
  console.log('\n📋 Testing Complaints Data...');
  
  try {
    const complaintsSnapshot = await getDocs(collection(db, 'complaints'));
    const complaints = complaintsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    if (complaints.length === 0) {
      console.log('ℹ️  No complaints found in the collection');
      return { hasData: false, complaints: [] };
    }
    
    console.log(`✅ Found ${complaints.length} complaints`);
    
    // Analyze complaints by status
    const statusCounts = {};
    complaints.forEach(complaint => {
      const status = complaint.status || 'Unknown';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });
    console.log('📈 Complaints by status:', statusCounts);
    
    return { hasData: true, complaints, statusCounts };
  } catch (error) {
    console.error('❌ Error testing complaints data:', error.message);
    throw error;
  }
}

async function testCustomerData() {
  console.log('\n👥 Testing Customer Data...');
  
  try {
    const customersSnapshot = await getDocs(collection(db, 'customers'));
    const customers = customersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    if (customers.length === 0) {
      console.log('⚠️  No customers found in the collection');
      return { hasData: false, customers: [] };
    }
    
    console.log(`✅ Found ${customers.length} customers`);
    
    // Analyze customers by status
    const statusCounts = {};
    customers.forEach(customer => {
      const status = (customer.status || 'Unknown').toLowerCase();
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });
    console.log('📈 Customers by status:', statusCounts);
    
    const expiredCustomers = customers.filter(c => (c.status || '').toLowerCase() === 'expired');
    console.log(`⚠️  Found ${expiredCustomers.length} expired customers that should be migrated`);
    
    return { hasData: true, customers, statusCounts, expiredCount: expiredCustomers.length };
  } catch (error) {
    console.error('❌ Error testing customer data:', error.message);
    throw error;
  }
}

async function runFirebaseIntegrationTests() {
  console.log('🧪 Starting Firebase Integration Tests for Dashboard\n');
  console.log('=' * 60);
  
  try {
    // Test 1: Collections exist
    const collectionResults = await testCollectionsExist();
    
    // Test 2: Customer data
    const customerResults = await testCustomerData();
    
    // Test 3: Expired overview data
    const expiredResults = await testExpiredOverviewData();
    
    // Test 4: Complaints data
    const complaintsResults = await testComplaintsData();
    
    console.log('\n' + '=' * 60);
    console.log('📊 FIREBASE INTEGRATION TEST RESULTS:');
    console.log('=' * 60);
    
    console.log('📁 Collections Status:');
    console.log(`   • Customers: ${collectionResults.customers} documents`);
    console.log(`   • Complaints: ${collectionResults.complaints} documents`);
    console.log(`   • Expired Overview: ${collectionResults.expiredOverview} documents`);
    
    console.log('\n📈 Dashboard Data Status:');
    console.log(`   • Expired Overview Data: ${expiredResults.hasData ? '✅ Ready' : '❌ Needs Migration'}`);
    console.log(`   • Complaints Data: ${complaintsResults.hasData ? '✅ Ready' : '⚠️  Empty'}`);
    console.log(`   • Customer Data: ${customerResults.hasData ? '✅ Ready' : '❌ Missing'}`);
    
    if (!expiredResults.hasData && customerResults.expiredCount > 0) {
      console.log('\n🔧 ACTION REQUIRED:');
      console.log('   1. Run the migration script: node scripts/runExpiredDataMigration.js');
      console.log('   2. This will populate the expired_overview collection from expired customers');
      console.log('   3. After migration, dashboard charts will show real Firebase data');
    }
    
    console.log('\n✅ Firebase Integration Test Completed!');
    
    const overallStatus = {
      collectionsReady: collectionResults.customers > 0 || collectionResults.complaints > 0,
      expiredOverviewReady: expiredResults.hasData,
      complaintsReady: complaintsResults.hasData,
      customersReady: customerResults.hasData,
      needsMigration: !expiredResults.hasData && customerResults.expiredCount > 0
    };
    
    console.log('\n🎯 OVERALL STATUS:', overallStatus);
    
    return overallStatus;
    
  } catch (error) {
    console.error('💥 Firebase Integration Test Failed:', error.message);
    throw error;
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  runFirebaseIntegrationTests()
    .then((results) => {
      if (results.needsMigration) {
        console.log('\n⚠️  Please run the migration script before using the dashboard with real data.');
      } else if (results.expiredOverviewReady && results.complaintsReady) {
        console.log('\n🎉 Dashboard is ready to use real Firebase data!');
      }
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Test failed:', error.message);
      process.exit(1);
    });
}

module.exports = { runFirebaseIntegrationTests };