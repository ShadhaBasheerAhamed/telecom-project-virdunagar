#!/usr/bin/env node

/**
 * Test Complaints Data Fetching Script
 * 
 * This script tests the complaints data fetching functionality
 * to ensure the dashboard can properly display the pie chart.
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');

// Firebase configuration (actual config from frontend)
const firebaseConfig = {
  apiKey: "AIzaSyCP6cvVrFmYgekRbm5titNYPJpP4iWH3EE",
  authDomain: "telecomproject-virudhunagar.firebaseapp.com",
  projectId: "telecomproject-virudhunagar",
  storageBucket: "telecomproject-virudhunagar.firebasestorage.app",
  messagingSenderId: "1080285921059",
  appId: "1:1080285921059:web:f09f84e52371158e3c1696"
};

// Initialize Firebase
let app;
let db;

try {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  console.log('✅ Firebase initialized successfully');
} catch (error) {
  console.error('❌ Error initializing Firebase:', error);
  process.exit(1);
}

/**
 * Test complaints data fetching
 */
async function testComplaintsData() {
  console.log('\n🔍 Testing complaints data fetching...');
  
  try {
    // Fetch complaints from Firebase
    const complaintsSnap = await getDocs(collection(db, 'complaints'));
    const complaints = complaintsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    console.log(`📊 Total complaints found: ${complaints.length}`);
    
    if (complaints.length === 0) {
      console.log('❌ No complaints found in Firebase. The chart will show "No complaints data".');
      return;
    }
    
    // Count by status (same logic as DashboardService)
    const statusCounts = {
      'Open': 0,
      'Resolved': 0,
      'Pending': 0,
      'Not Resolved': 0
    };

    complaints.forEach(complaint => {
      const status = complaint.status || 'Open';
      if (statusCounts.hasOwnProperty(status)) {
        statusCounts[status]++;
      } else if (status === 'Not Resolved') {
        statusCounts['Open']++; // Map 'Not Resolved' to 'Open' for chart display
      }
    });

    // Format for chart (same as DashboardService)
    const chartData = [
      { name: 'Open', value: statusCounts['Open'] + statusCounts['Not Resolved'] },
      { name: 'Resolved', value: statusCounts['Resolved'] },
      { name: 'Pending', value: statusCounts['Pending'] }
    ];

    console.log('\n📈 Raw Status Counts:');
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`   ${status}: ${count} complaints`);
    });

    console.log('\n🎯 Chart Data (formatted for pie chart):');
    chartData.forEach(item => {
      console.log(`   ${item.name}: ${item.value} complaints`);
    });

    // Check if chart will display
    const hasData = chartData.some(item => item.value > 0);
    
    if (hasData) {
      console.log('\n✅ SUCCESS: Complaints chart should now display!');
      console.log('📱 The dashboard pie chart will show:');
      chartData.forEach(item => {
        if (item.value > 0) {
          console.log(`   - ${item.name}: ${item.value} complaints`);
        }
      });
    } else {
      console.log('\n❌ No chart data available');
    }

    // Test recent complaints (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentComplaints = complaints.filter(complaint => {
      if (!complaint.bookingDate) return false;
      const complaintDate = new Date(complaint.bookingDate);
      return complaintDate >= sevenDaysAgo;
    });
    
    console.log(`\n📅 Recent complaints (last 7 days): ${recentComplaints.length}`);

    if (recentComplaints.length > 0) {
      console.log('Sample recent complaints:');
      recentComplaints.slice(0, 3).forEach(complaint => {
        console.log(`   - ${complaint.customerName}: ${complaint.status} (${complaint.bookingDate})`);
      });
    }

  } catch (error) {
    console.error('❌ Error fetching complaints data:', error);
    process.exit(1);
  }
}

// Execute the test
if (require.main === module) {
  testComplaintsData()
    .then(() => {
      console.log('\n✅ Complaints data test completed successfully');
      console.log('\n🎯 Next Steps:');
      console.log('   1. Check the dashboard in your browser');
      console.log('   2. The complaints pie chart should now display data');
      console.log('   3. Verify the chart shows the correct status distribution');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Test failed:', error);
      process.exit(1);
    });
}

module.exports = { testComplaintsData };