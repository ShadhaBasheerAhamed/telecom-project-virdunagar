import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  onSnapshot,
  writeBatch
} from 'firebase/firestore'; 
import { db } from '../firebase/config';
import type { Payment } from '../types'; 

const PAYMENTS_COLLECTION = 'payments';

export const PaymentService = {
  
  // 1. Add a new payment record
  addPayment: async (payment: Omit<Payment, 'id'>) => {
    try {
      const docRef = await addDoc(collection(db, PAYMENTS_COLLECTION), {
        ...payment,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error adding payment:', error);
      throw new Error('Failed to add payment record');
    }
  },

  // 2. Bulk Upload Function (Optimized)
  addBulkPayments: async (payments: Omit<Payment, 'id'>[]) => {
    try {
      // Firestore allows max 500 writes per batch
      const batchSize = 500;
      for (let i = 0; i < payments.length; i += batchSize) {
        const batch = writeBatch(db);
        const chunk = payments.slice(i, i + batchSize);
        
        chunk.forEach((payment) => {
          const docRef = doc(collection(db, PAYMENTS_COLLECTION)); // Create ref
          batch.set(docRef, {
            ...payment,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
        });

        await batch.commit(); // Commit chunk
      }
      console.log(`Successfully added ${payments.length} payments.`);
    } catch (error) {
      console.error('Bulk upload failed:', error);
      throw new Error('Bulk upload failed');
    }
  },

  // 3. Update an existing payment
  updatePayment: async (id: string, payment: Partial<Payment>) => {
    try {
      const paymentRef = doc(db, PAYMENTS_COLLECTION, id);
      await updateDoc(paymentRef, {
        ...payment,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating payment:', error);
      throw new Error('Failed to update payment record');
    }
  },

  // 4. Delete a payment
  deletePayment: async (id: string) => {
    try {
      await deleteDoc(doc(db, PAYMENTS_COLLECTION, id));
    } catch (error) {
      console.error('Error deleting payment:', error);
      throw new Error('Failed to delete payment record');
    }
  },

  // 5. Get all payments (Latest first)
  getPayments: async (): Promise<Payment[]> => {
    try {
      const q = query(
        collection(db, PAYMENTS_COLLECTION),
        orderBy('paidDate', 'desc'),
        limit(1000)
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Payment[];
    } catch (error) {
      console.error('Error fetching payments:', error);
      return [];
    }
  },

  // ✅ 6. Get payments filtered by Source (Enhanced with Debugging & Fallback)
  getPaymentsBySource: async (source: string): Promise<Payment[]> => {
    console.log(`🔍 DEBUG: Fetching payments for source: "${source}"`);
    
    try {
      // NOTE: This query requires a Composite Index in Firebase.
      // If it fails, check the browser console for a link to create the index.
      console.log(`🔍 DEBUG: Creating Firestore query for source "${source}"`);
      const q = query(
        collection(db, PAYMENTS_COLLECTION),
        where('source', '==', source), // Filter by Source
        orderBy('paidDate', 'desc')    // Sort by Date
      );
      
      console.log(`🔍 DEBUG: Executing Firestore query...`);
      const querySnapshot = await getDocs(q);
      const results = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Payment[];
      
      console.log(`✅ DEBUG: Query successful! Found ${results.length} payments for source "${source}"`);
      return results;
      
    } catch (error: any) {
      console.error('❌ DEBUG: Error fetching payments by source:', error);
      console.error(`❌ DEBUG: Source parameter: "${source}"`);
      console.error(`❌ DEBUG: Error code: ${error.code}`);
      console.error(`❌ DEBUG: Error message: ${error.message}`);
      
      // Special Log to help you identify Index Issue
      if (error.code === 'failed-precondition') {
          console.error("⚠️ MISSING INDEX: This query requires a composite index in Firestore!");
          console.error("🔧 SOLUTION: Create a composite index in Firebase Console:");
          console.error("   1. Go to Firebase Console > Firestore Database > Indexes");
          console.error("   2. Add a composite index for 'payments' collection");
          console.error("   3. Fields: source (Ascending) + paidDate (Descending)");
          console.error("   4. Click 'Create Index'");
          
          // Fallback: Get all payments and filter client-side
          console.log(`🔄 DEBUG: Using fallback method - fetching all payments and filtering client-side...`);
          return PaymentService.getPaymentsBySourceFallback(source);
      }
      
      console.error("❌ DEBUG: Non-index related error occurred");
      return [];
    }
  },

  // Fallback method that doesn't require composite index
  getPaymentsBySourceFallback: async (source: string): Promise<Payment[]> => {
    console.log(`🔄 DEBUG: Fallback method - getting all payments and filtering for source "${source}"`);
    try {
      const allPayments = await PaymentService.getPayments();
      const filtered = allPayments.filter(payment => {
        console.log(`🔍 DEBUG: Checking payment source: "${payment.source}" === "${source}"`);
        return payment.source === source;
      });
      console.log(`🔄 DEBUG: Fallback successful! Found ${filtered.length} payments for source "${source}"`);
      return filtered;
    } catch (error) {
      console.error('❌ DEBUG: Fallback method also failed:', error);
      return [];
    }
  },

  // 7. LIVE LISTEN (Real-time)
  subscribeToPayments: (callback: (payments: Payment[]) => void) => {
      const q = query(
          collection(db, PAYMENTS_COLLECTION),
          orderBy('paidDate', 'desc'),
          limit(100)
      );
      return onSnapshot(q, (snapshot) => {
          const payments = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
          })) as Payment[];
          callback(payments);
      });
  }
};