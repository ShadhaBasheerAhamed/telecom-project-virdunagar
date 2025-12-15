#!/usr/bin/env node

/**
 * Real Complaints Data Script
 * 
 * This script clears the existing complaints collection and adds 2 real complaints
 * to ensure 100% Firebase data integration.
 * 
 * Usage: node scripts/addRealComplaintsData.js
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, writeBatch } = require('firebase/firestore');

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

// Real complaints data provided by the user
const realComplaints = [
  {
    customerName: "RAJAPPA NADAR",
    landlineNo: "04562-206767",
    address: "",
    plan: "30MBPS 399 FIBER EXPERIENCE BSNL",
    complaints: "los",
    employee: "saarra safeka",
    bookingDate: "2025-12-10",
    resolveDate: "2025-12-15",
    status: "Resolved",
    source: "BSNL",
    createdAt: new Date('2025-12-10T10:00:00Z').toISOString()
  },
  {
    customerName: "M PANDIAN",
    landlineNo: "04562-266001",
    address: "NO4,MANINAGARAM STREET,VIRUDHUNAGAR,,626001",
    plan: "",
    complaints: "LOS",
    employee: "R.ULAGANATHAN",
    bookingDate: "2025-10-27",
    resolveDate: "",
    status: "Not Resolved",
    source: "BSNL",
    createdAt: new Date('2025-10-27T14:30:00Z').toISOString()
  }
];

/**
 * Clear existing complaints collection
 */
async function clearComplaintsCollection() {
  console.log('🗑️  Clearing existing complaints collection...');
  
  try {
    const complaintsRef = collection(db, 'complaints');
    const snapshot = await getDocs(complaintsRef);
    
    if (snapshot.empty) {
      console.log('✅ Complaints collection is already empty');
      return;
    }

    const batch = writeBatch(db);
    let deleteCount = 0;

    snapshot.forEach((docSnapshot) => {
      batch.delete(docSnapshot.ref);
      deleteCount++;
    });

    await batch.commit();
    console.log(`✅ Successfully deleted ${deleteCount} existing complaints`);
    
  } catch (error) {
    console.error('❌ Error clearing complaints collection:', error);
    throw error;
  }
}

/**
 * Add real complaints to Firebase
 */
async function addRealComplaints() {
  console.log('🚀 Adding real complaints to Firebase...');
  
  try {
    const complaintsRef = collection(db, 'complaints');
    let successCount = 0;
    let errorCount = 0;

    for (const complaint of realComplaints) {
      try {
        const docRef = await addDoc(complaintsRef, complaint);
        console.log(`✅ Added complaint: ${complaint.customerName} (${complaint.status}) - ID: ${docRef.id}`);
        successCount++;
      } catch (error) {
        console.error(`❌ Error adding complaint ${complaint.customerName}:`, error.message);
        errorCount++;
      }
    }

    console.log('\n📊 Summary:');
    console.log(`✅ Successfully added: ${successCount} real complaints`);
    console.log(`❌ Errors: ${errorCount} complaints`);
    console.log(`📈 Total processed: ${realComplaints.length} complaints`);

    // Display status distribution
    const statusDistribution = realComplaints.reduce((acc, complaint) => {
      acc[complaint.status] = (acc[complaint.status] || 0) + 1;
      return acc;
    }, {});

    console.log('\n📊 Status Distribution:');
    Object.entries(statusDistribution).forEach(([status, count]) => {
      console.log(`   ${status}: ${count} complaints`);
    });

    return successCount > 0;
    
  } catch (error) {
    console.error('❌ Fatal error adding real complaints:', error);
    throw error;
  }
}

/**
 * Verify the data was added correctly
 */
async function verifyData() {
  console.log('\n🔍 Verifying added data...');
  
  try {
    const complaintsRef = collection(db, 'complaints');
    const snapshot = await getDocs(complaintsRef);
    
    console.log(`📊 Total complaints in Firebase: ${snapshot.size}`);
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      console.log(`   - ${data.customerName}: ${data.status} (${data.bookingDate})`);
    });
    
    return snapshot.size === realComplaints.length;
  } catch (error) {
    console.error('❌ Error verifying data:', error);
    return false;
  }
}

/**
 * Main execution function
 */
async function main() {
  console.log('🎯 Starting real complaints data implementation...\n');
  
  try {
    // Step 1: Clear existing data
    await clearComplaintsCollection();
    
    // Step 2: Add real complaints
    const success = await addRealComplaints();
    
    if (success) {
      // Step 3: Verify the data
      const verified = await verifyData();
      
      if (verified) {
        console.log('\n🎉 Real complaints data implemented successfully!');
        console.log('📱 The complaints management system now uses 100% Firebase data.');
        console.log('🔄 Dashboard will automatically sync with real-time data updates.');
      } else {
        console.log('\n⚠️  Data added but verification failed. Please check manually.');
      }
    } else {
      console.log('\n❌ Failed to add real complaints data.');
    }
    
  } catch (error) {
    console.error('❌ Fatal error in main execution:', error);
    process.exit(1);
  }
}

// Execute the script
if (require.main === module) {
  main()
    .then(() => {
      console.log('\n✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = { main, clearComplaintsCollection, addRealComplaints, verifyData };