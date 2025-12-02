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
  onSnapshot 
} from '../firebase/config';
import { writeBatch } from 'firebase/firestore';
import { db } from '../firebase/config';
import type { Payment } from '../types'; 

const PAYMENTS_COLLECTION = 'payments';

export const PaymentService = {
  
  // Add a new payment record
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

  // 🔥 NEW: Bulk Upload Function (Optimized)
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

  // Update an existing payment
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

  // Delete a payment
  deletePayment: async (id: string) => {
    try {
      await deleteDoc(doc(db, PAYMENTS_COLLECTION, id));
    } catch (error) {
      console.error('Error deleting payment:', error);
      throw new Error('Failed to delete payment record');
    }
  },

  // Get all payments (Latest first)
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

  // Get payments filtered by Source
  getPaymentsBySource: async (source: string): Promise<Payment[]> => {
    try {
      const q = query(
        collection(db, PAYMENTS_COLLECTION),
        where('source', '==', source),
        orderBy('paidDate', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Payment[];
    } catch (error) {
      console.error('Error fetching payments by source:', error);
      return [];
    }
  },

  // LIVE LISTEN (Real-time)
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