// Migration script to convert "Not Resolved" status to "Open" in complaints collection
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, updateDoc, doc, query, where } = require('firebase/firestore');
const firebaseConfig = require('../src/firebase/config.ts');

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function migrateComplaintStatus() {
  try {
    console.log('🚀 Starting complaint status migration...');
    
    // Query for complaints with "Not Resolved" status
    const notResolvedQuery = query(
      collection(db, 'complaints'),
      where('status', '==', 'Not Resolved')
    );
    
    const querySnapshot = await getDocs(notResolvedQuery);
    
    if (querySnapshot.empty) {
      console.log('✅ No complaints with "Not Resolved" status found. Migration complete.');
      return;
    }
    
    const batchSize = querySnapshot.size;
    console.log(`📊 Found ${batchSize} complaints with "Not Resolved" status`);
    
    let successCount = 0;
    let errorCount = 0;
    
    // Update each document
    for (const docSnapshot of querySnapshot.docs) {
      try {
        await updateDoc(doc(db, 'complaints', docSnapshot.id), {
          status: 'Open'
        });
        successCount++;
        console.log(`✅ Updated complaint ${docSnapshot.id}: "Not Resolved" → "Open"`);
      } catch (error) {
        errorCount++;
        console.error(`❌ Error updating complaint ${docSnapshot.id}:`, error.message);
      }
    }
    
    console.log('\n🎉 Migration Summary:');
    console.log(`✅ Successfully migrated: ${successCount} complaints`);
    console.log(`❌ Errors: ${errorCount} complaints`);
    console.log(`📊 Total processed: ${batchSize} complaints`);
    
    if (errorCount === 0) {
      console.log('\n🎯 Migration completed successfully! All "Not Resolved" complaints are now "Open".');
    } else {
      console.log('\n⚠️  Migration completed with errors. Please review the logs above.');
    }
    
  } catch (error) {
    console.error('💥 Migration failed:', error);
    throw error;
  }
}

// Run the migration
migrateComplaintStatus()
  .then(() => {
    console.log('🏁 Migration process finished.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Migration process failed:', error);
    process.exit(1);
  });