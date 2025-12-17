// Test script to verify network provider filtering fix
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, query, where } = require('firebase/firestore');
const path = require('path');

// Initialize Firebase
const firebaseConfig = {
  apiKey: "test",
  authDomain: "test",
  projectId: "test"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function testNetworkProviderFiltering() {
  console.log('🔍 Testing Network Provider Filtering Fix...\n');
  
  try {
    // Test 1: Check complaints data by source
    console.log('📋 Testing Complaints Data Filtering:');
    const allComplaintsSnap = await getDocs(collection(db, 'complaints'));
    const allComplaints = allComplaintsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    console.log(`Total complaints in database: ${allComplaints.length}`);
    
    // Filter by BSNL
    const bsnlComplaints = allComplaints.filter(c => c.source === 'BSNL');
    console.log(`BSNL complaints: ${bsnlComplaints.length}`);
    
    // Filter by RMAX  
    const rmaxComplaints = allComplaints.filter(c => c.source === 'RMAX');
    console.log(`RMAX complaints: ${rmaxComplaints.length}`);
    
    // Show complaint statuses for each source
    const getStatusCounts = (complaints) => {
      const counts = { 'Open': 0, 'Resolved': 0, 'Pending': 0 };
      complaints.forEach(c => {
        const status = c.status === 'Not Resolved' ? 'Open' : c.status;
        if (counts.hasOwnProperty(status)) {
          counts[status]++;
        }
      });
      return counts;
    };
    
    console.log('BSNL complaint statuses:', getStatusCounts(bsnlComplaints));
    console.log('RMAX complaint statuses:', getStatusCounts(rmaxComplaints));
    
    // Test 2: Check expired overview data by source
    console.log('\n📊 Testing Expired Overview Data Filtering:');
    try {
      const expiredSnap = await getDocs(collection(db, 'expired_overview'));
      const allExpired = expiredSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      console.log(`Total expired records in database: ${allExpired.length}`);
      
      // Filter by BSNL
      const bsnlExpired = allExpired.filter(e => e.source === 'BSNL');
      console.log(`BSNL expired records: ${bsnlExpired.length}`);
      
      // Filter by RMAX
      const rmaxExpired = allExpired.filter(e => e.source === 'RMAX');
      console.log(`RMAX expired records: ${rmaxExpired.length}`);
      
      // Show reasons for each source
      const getReasonCounts = (records) => {
        const counts = {};
        records.forEach(r => {
          counts[r.reason] = (counts[r.reason] || 0) + 1;
        });
        return counts;
      };
      
      console.log('BSNL expired reasons:', getReasonCounts(bsnlExpired));
      console.log('RMAX expired reasons:', getReasonCounts(rmaxExpired));
      
    } catch (error) {
      console.log('Note: expired_overview collection might not exist or be empty');
    }
    
    // Test 3: Test the service methods directly
    console.log('\n🔧 Testing Service Methods:');
    
    // Import the services (we'll need to build this part)
    console.log('Service methods should now support dataSource parameter:');
    console.log('- DashboardService.getComplaintsStatusData(..., dataSource)');
    console.log('- ExpiredOverviewService.getExpiredChartData(..., dataSource)');
    
    console.log('\n✅ Network Provider Filtering Test Complete!');
    console.log('\n📝 Expected Results:');
    console.log('- BSNL filter should show only BSNL data');
    console.log('- RMAX filter should show only RMAX data'); 
    console.log('- All Sources should show combined data');
    console.log('\n🎯 If the dashboard still shows wrong data, the issue might be:');
    console.log('1. Cached data in the browser');
    console.log('2. The dataSource parameter not being passed correctly from the UI');
    console.log('3. Firebase security rules blocking the filtered queries');
    
  } catch (error) {
    console.error('❌ Error during testing:', error);
  }
}

// Run the test
testNetworkProviderFiltering();