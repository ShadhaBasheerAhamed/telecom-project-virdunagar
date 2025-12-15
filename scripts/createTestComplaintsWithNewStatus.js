// Create test complaints with the new status values to demonstrate color coding
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc } = require('firebase/firestore');

// Firebase configuration (matching config.ts)
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

async function createTestComplaints() {
  try {
    console.log('🎨 Creating test complaints with new status color coding...');
    
    const testComplaints = [
      {
        customerName: 'John Doe',
        landlineNo: '04562-123456',
        address: '123 Main Street, Chennai',
        plan: 'Basic Plan',
        complaints: 'Network connectivity issue',
        employee: 'Tech Support Team',
        bookingDate: '2025-12-15',
        resolveDate: '',
        status: 'Open', // Yellow color
        source: 'BSNL'
      },
      {
        customerName: 'Jane Smith',
        landlineNo: '04562-234567',
        address: '456 Oak Avenue, Bangalore',
        plan: 'Premium Plan',
        complaints: 'Billing discrepancy',
        employee: 'Billing Team',
        bookingDate: '2025-12-14',
        resolveDate: '',
        status: 'Pending', // Red color
        source: 'RMAX'
      },
      {
        customerName: 'Bob Johnson',
        landlineNo: '04562-345678',
        address: '789 Pine Road, Mumbai',
        plan: 'Standard Plan',
        complaints: 'Service interruption resolved',
        employee: 'Network Team',
        bookingDate: '2025-12-13',
        resolveDate: '2025-12-14',
        status: 'Resolved', // Green color
        source: 'BSNL'
      },
      {
        customerName: 'Alice Brown',
        landlineNo: '04562-456789',
        address: '321 Elm Street, Delhi',
        plan: 'Basic Plan',
        complaints: 'Speed optimization needed',
        employee: 'Performance Team',
        bookingDate: '2025-12-12',
        resolveDate: '',
        status: 'Open', // Yellow color
        source: 'Private'
      },
      {
        customerName: 'Charlie Wilson',
        landlineNo: '04562-567890',
        address: '654 Maple Drive, Hyderabad',
        plan: 'Premium Plan',
        complaints: 'Feature request implementation',
        employee: 'Development Team',
        bookingDate: '2025-12-11',
        resolveDate: '',
        status: 'Pending', // Red color
        source: 'RMAX'
      },
      {
        customerName: 'Diana Davis',
        landlineNo: '04562-678901',
        address: '987 Cedar Lane, Pune',
        plan: 'Standard Plan',
        complaints: 'Account verification completed',
        employee: 'Customer Service',
        bookingDate: '2025-12-10',
        resolveDate: '2025-12-11',
        status: 'Resolved', // Green color
        source: 'BSNL'
      }
    ];
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const complaint of testComplaints) {
      try {
        const docRef = await addDoc(collection(db, 'complaints'), {
          ...complaint,
          createdAt: new Date().toISOString()
        });
        successCount++;
        console.log(`✅ Created complaint: ${complaint.customerName} (${complaint.status})`);
      } catch (error) {
        errorCount++;
        console.error(`❌ Error creating complaint for ${complaint.customerName}:`, error.message);
      }
    }
    
    console.log('\n🎉 Test Data Creation Summary:');
    console.log(`✅ Successfully created: ${successCount} complaints`);
    console.log(`❌ Errors: ${errorCount} complaints`);
    console.log(`📊 Total processed: ${testComplaints.length} complaints`);
    
    console.log('\n🎨 Color Coding Implementation:');
    console.log('🟡 Open Status: Yellow background');
    console.log('🔴 Pending Status: Red background');
    console.log('🟢 Resolved Status: Green background');
    
    console.log('\n🚀 Test the Complaints Management page to see the color coding in action!');
    
  } catch (error) {
    console.error('💥 Test data creation failed:', error);
    throw error;
  }
}

// Run the test data creation
createTestComplaints()
  .then(() => {
    console.log('🏁 Test data creation finished.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Test data creation failed:', error);
    process.exit(1);
  });