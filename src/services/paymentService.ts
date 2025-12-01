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
  limit 
} from '../firebase/config';
import { db } from '../firebase/config';
import type { Payment } from '../components/pages/Payment'; // Import from Payment component file if types are there

// Ensure we import the shared type correctly, or define it here if needed
// For now, assumes shared type exists in types/index.ts as per previous steps
// If not, we use the interface from Payment.tsx

const PAYMENTS_COLLECTION = 'payments';

export const PaymentService = {
  
  // Add a new payment record
  addPayment: async (payment: any) => {
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

  // Update an existing payment
  updatePayment: async (id: string, payment: any) => {
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
  getPayments: async () => {
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
      }));
    } catch (error) {
      console.error('Error fetching payments:', error);
      return [];
    }
  },

  // Get payments filtered by Source
  getPaymentsBySource: async (source: string) => {
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
      }));
    } catch (error) {
      console.error('Error fetching payments by source:', error);
      return [];
    }
  }
};