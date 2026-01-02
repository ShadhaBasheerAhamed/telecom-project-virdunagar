import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc, 
  setDoc, 
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
const COMMISSIONS_COLLECTION = 'commission_rates';

export const PaymentService = {
  
  // 1. Add Payment (Verified)
  addPayment: async (payment: Omit<Payment, 'id'>, customerId: string) => {
    try {
      console.log("Saving Payment to DB:", payment); // Debug Log
      const docRef = await addDoc(collection(db, PAYMENTS_COLLECTION), {
        ...payment,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      if (customerId) {
          if (payment.addedToWallet && payment.addedToWallet > 0) {
              await CustomerService.updateWallet(customerId, payment.addedToWallet, 'credit');
          } 
          if (payment.usedWalletAmount && payment.usedWalletAmount > 0) {
              await CustomerService.updateWallet(customerId, payment.usedWalletAmount, 'debit');
          }
      }
      return docRef.id; 
    } catch (error) {
      console.error('Error adding payment:', error);
      throw new Error('Failed to add payment record');
    }
  },

  // 2. Check Duplicate
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
      return !snap.empty; 
    } catch (error: any) {
      console.error('❌ Error checking duplicate:', error);
      return false; 
    }
  },

  // 3. Bulk Upload
  addBulkPayments: async (payments: Omit<Payment, 'id'>[]) => {
    try {
      const batchSize = 500;
      for (let i = 0; i < payments.length; i += batchSize) {
        const batch = writeBatch(db);
        const chunk = payments.slice(i, i + batchSize);
        chunk.forEach((payment) => {
          const docRef = doc(collection(db, PAYMENTS_COLLECTION)); 
          batch.set(docRef, { ...payment, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
        });
        await batch.commit(); 
      }
    } catch (error) {
      console.error('Bulk upload failed:', error);
      throw new Error('Bulk upload failed');
    }
  },

  // 4. Update Payment
  updatePayment: async (id: string, payment: Partial<Payment>) => {
    try {
      const paymentRef = doc(db, PAYMENTS_COLLECTION, id);
      await updateDoc(paymentRef, { ...payment, updatedAt: new Date().toISOString() });
    } catch (error) {
      console.error('Error updating payment:', error);
      throw new Error('Failed to update payment record');
    }
  },

  // 5. Delete Payment
  deletePayment: async (id: string) => {
    try {
      await deleteDoc(doc(db, PAYMENTS_COLLECTION, id));
    } catch (error) {
      console.error('Error deleting payment:', error);
      throw new Error('Failed to delete payment record');
    }
  },

  // 6. Get All Payments
  getPayments: async (): Promise<Payment[]> => {
    try {
      const q = query(collection(db, PAYMENTS_COLLECTION), orderBy('paidDate', 'desc'), limit(1000));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Payment[];
    } catch (error) {
      console.error('Error fetching payments:', error);
      return [];
    }
  },

  // 7. Get By Source
  getPaymentsBySource: async (source: string): Promise<Payment[]> => {
    try {
      const q = query(
        collection(db, PAYMENTS_COLLECTION),
        where('source', '==', source), 
        orderBy('paidDate', 'desc')    
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Payment[];
    } catch (error: any) {
      if (error.code === 'failed-precondition') {
          return PaymentService.getPaymentsBySourceFallback(source);
      }
      return [];
    }
  },

  // 8. Fallback Method
  getPaymentsBySourceFallback: async (source: string): Promise<Payment[]> => {
    try {
      const allPayments = await PaymentService.getPayments();
      return allPayments.filter(payment => payment.source === source);
    } catch (error) {
      return [];
    }
  },

  // 9. Subscribe
  subscribeToPayments: (callback: (payments: Payment[]) => void) => {
      const q = query(collection(db, PAYMENTS_COLLECTION), orderBy('paidDate', 'desc'), limit(100));
      return onSnapshot(q, (snapshot) => {
          const payments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Payment[];
          callback(payments);
      });
  },

  // 10. Get Commission Rate
  getCommissionRate: async (source: string): Promise<number> => {
    try {
      const docRef = doc(db, COMMISSIONS_COLLECTION, source);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return docSnap.data().rate || 0;
      }
      return 30; // Default
    } catch (error) {
      console.error("Error fetching rate:", error);
      return 30;
    }
  },

  // 11. Save Commission Rate
  saveCommissionRate: async (source: string, rate: number) => {
    try {
      const docRef = doc(db, COMMISSIONS_COLLECTION, source);
      await setDoc(docRef, { 
        rate: rate,
        lastUpdated: new Date().toISOString(),
        source: source
      }, { merge: true });
    } catch (error) {
      console.error("Error saving rate:", error);
      throw error;
    }
  }
};