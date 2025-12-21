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
import { CustomerService } from './customerService';

const PAYMENTS_COLLECTION = 'payments';

export const PaymentService = {
  
  // ---------------------------------------------------------
  // 1. Add a new payment (With Wallet Logic)
  // ---------------------------------------------------------
  // Purpose: Adds a payment to the database and updates the customer's wallet balance.
  // How it works:
  // 1. Saves the payment details to the 'payments' collection.
  // 2. Checks if there is any 'addedToWallet' amount (Excess Payment). If yes, it CREDITS the wallet.
  // 3. Checks if there is any 'usedWalletAmount' (Wallet Usage). If yes, it DEBITS the wallet.
  addPayment: async (payment: Omit<Payment, 'id'>, customerId: string) => {
    try {
      // 1. Save Payment Record to Firestore
      const docRef = await addDoc(collection(db, PAYMENTS_COLLECTION), {
        ...payment,
        createdAt: new Date().toISOString(), // Record creation time
        updatedAt: new Date().toISOString()
      });

      // 2. Update Customer Wallet Balance if needed
      if (customerId) {
          // If customer paid EXTRA, add it to their wallet (Credit)
          if (payment.addedToWallet && payment.addedToWallet > 0) {
              await CustomerService.updateWallet(customerId, payment.addedToWallet, 'credit');
          } 
          
          // If customer used existing WALLET balance, deduct it (Debit)
          if (payment.usedWalletAmount && payment.usedWalletAmount > 0) {
              await CustomerService.updateWallet(customerId, payment.usedWalletAmount, 'debit');
          }
      }
      
      return docRef.id; // Return the new Payment ID
    } catch (error) {
      console.error('Error adding payment:', error);
      throw new Error('Failed to add payment record');
    }
  },

  // ---------------------------------------------------------
  // 2. Check for Duplicate Payments
  // ---------------------------------------------------------
  // Purpose: Prevents accidental double entry for the same customer in the same month.
  // How it works:
  // 1. Calculates the Start Date (1st of the month) and End Date (1st of next month).
  // 2. Queries database for any payment with the same Landline Number within this date range.
  // 3. Returns TRUE if a record exists (Duplicate), FALSE otherwise.
  checkDuplicatePayment: async (landlineNo: string, paidDate: string): Promise<boolean> => {
    try {
      const date = new Date(paidDate);
      const start = new Date(date.getFullYear(), date.getMonth(), 1);
      const end = new Date(date.getFullYear(), date.getMonth() + 1, 1);

      const q = query(
        collection(db, PAYMENTS_COLLECTION),
        where('landlineNo', '==', landlineNo),
        where('paidDate', '>=', start.toISOString()),
        where('paidDate', '<', end.toISOString())
      );

      const snap = await getDocs(q);
      return !snap.empty; // True if duplicate found
    } catch (error) {
      console.error('Error checking duplicate:', error);
      return false; 
    }
  },

  // ---------------------------------------------------------
  // 3. Bulk Upload Function (Optimized)
  // ---------------------------------------------------------
  // Purpose: Uploads many payments at once (e.g. from CSV file).
  // How it works:
  // 1. Firestore has a limit of 500 writes per batch.
  // 2. We loop through the payments array in chunks of 500.
  // 3. For each chunk, we creating a "Write Batch" and commit them all at once.
  // Note: This does NOT currently update wallet balances for simplicity.
  addBulkPayments: async (payments: Omit<Payment, 'id'>[]) => {
    try {
      const batchSize = 500;
      for (let i = 0; i < payments.length; i += batchSize) {
        const batch = writeBatch(db);
        const chunk = payments.slice(i, i + batchSize);
        
        chunk.forEach((payment) => {
          const docRef = doc(collection(db, PAYMENTS_COLLECTION)); 
          batch.set(docRef, {
            ...payment,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
        });

        await batch.commit(); // Save 500 records at once
      }
      console.log(`Successfully added ${payments.length} payments.`);
    } catch (error) {
      console.error('Bulk upload failed:', error);
      throw new Error('Bulk upload failed');
    }
  },

  // ---------------------------------------------------------
  // 4. Update an existing payment
  // ---------------------------------------------------------
  // Purpose: Edits a specific payment record.
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

  // ---------------------------------------------------------
  // 5. Delete a payment
  // ---------------------------------------------------------
  // Purpose: Deletes a payment record permanently.
  deletePayment: async (id: string) => {
    try {
      await deleteDoc(doc(db, PAYMENTS_COLLECTION, id));
    } catch (error) {
      console.error('Error deleting payment:', error);
      throw new Error('Failed to delete payment record');
    }
  },

  // ---------------------------------------------------------
  // 6. Get all payments (Latest first)
  // ---------------------------------------------------------
  // Purpose: Fetches the last 1000 payments for the main list.
  getPayments: async (): Promise<Payment[]> => {
    try {
      const q = query(
        collection(db, PAYMENTS_COLLECTION),
        orderBy('paidDate', 'desc'), // Show newest first
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

  // ---------------------------------------------------------
  // 7. Get payments filtered by Source (Provider)
  // ---------------------------------------------------------
  // Purpose: Fetches payments only for a specific provider (e.g. 'BSNL', 'RMAX').
  // Note: This requires a "Composite Index" in Firestore (Source + Date).
  getPaymentsBySource: async (source: string): Promise<Payment[]> => {
    console.log(`🔍 DEBUG: Fetching payments for source: "${source}"`);
    
    try {
      console.log(`🔍 DEBUG: Creating Firestore query for source "${source}"`);
      const q = query(
        collection(db, PAYMENTS_COLLECTION),
        where('source', '==', source), 
        orderBy('paidDate', 'desc')    
      );
      
      const querySnapshot = await getDocs(q);
      const results = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Payment[];
      
      return results;
      
    } catch (error: any) {
      console.error('❌ DEBUG: Error fetching payments by source:', error);
      
      // If the Index is missing, use the fallback method
      if (error.code === 'failed-precondition') {
          console.error("⚠️ MISSING INDEX: This query requires a composite index in Firestore!");
          return PaymentService.getPaymentsBySourceFallback(source);
      }
      return [];
    }
  },

  // ---------------------------------------------------------
  // 8. Fallback method (Client-side filter)
  // ---------------------------------------------------------
  // Purpose: Used if the Firestore Index is missing.
  // It downloads ALL payments and filters them in the browser (slower, but works).
  getPaymentsBySourceFallback: async (source: string): Promise<Payment[]> => {
    console.log(`🔄 DEBUG: Fallback method - filtering client-side for "${source}"`);
    try {
      const allPayments = await PaymentService.getPayments();
      const filtered = allPayments.filter(payment => payment.source === source);
      return filtered;
    } catch (error) {
      console.error('❌ DEBUG: Fallback method failed:', error);
      return [];
    }
  },

  // ---------------------------------------------------------
  // 9. Live Listener (Real-time)
  // ---------------------------------------------------------
  // Purpose: Keeps the UI updated in real-time without refreshing.
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