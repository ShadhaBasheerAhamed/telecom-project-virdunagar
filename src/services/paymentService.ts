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
import type { Payment } from '../types';

// Collection name for payments
const PAYMENTS_COLLECTION = 'payments';

export class PaymentService {
  
  /**
   * Add a new payment record to Firebase
   */
  static async addPayment(payment: Omit<Payment, 'id'>): Promise<void> {
    try {
      const docRef = await addDoc(collection(db, PAYMENTS_COLLECTION), {
        ...payment,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      console.log('Payment added successfully with ID:', docRef.id);
    } catch (error) {
      console.error('Error adding payment:', error);
      throw new Error('Failed to add payment record');
    }
  }

  /**
   * Update an existing payment record
   */
  static async updatePayment(id: string, payment: Partial<Payment>): Promise<void> {
    try {
      const paymentRef = doc(db, PAYMENTS_COLLECTION, id);
      await updateDoc(paymentRef, {
        ...payment,
        updatedAt: new Date().toISOString()
      });
      console.log('Payment updated successfully');
    } catch (error) {
      console.error('Error updating payment:', error);
      throw new Error('Failed to update payment record');
    }
  }

  /**
   * Delete a payment record
   */
  static async deletePayment(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, PAYMENTS_COLLECTION, id));
      console.log('Payment deleted successfully');
    } catch (error) {
      console.error('Error deleting payment:', error);
      throw new Error('Failed to delete payment record');
    }
  }

  /**
   * Get all payments from Firebase
   */
  static async getPayments(): Promise<Payment[]> {
    try {
      const q = query(
        collection(db, PAYMENTS_COLLECTION),
        orderBy('paidDate', 'desc'),
        limit(1000) // Limit to prevent loading too much data
      );
      
      const querySnapshot = await getDocs(q);
      
      const payments: Payment[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        payments.push({
          id: doc.id,
          landlineNo: data.landlineNo || '',
          customerName: data.customerName || '',
          rechargePlan: data.rechargePlan || '',
          duration: data.duration || '',
          billAmount: data.billAmount || 0,
          commission: data.commission || 0,
          status: data.status || 'Unpaid',
          paidDate: data.paidDate || '',
          modeOfPayment: data.modeOfPayment || '',
          renewalDate: data.renewalDate || '',
          source: data.source || 'BSNL'
        });
      });
      
      return payments;
    } catch (error) {
      console.error('Error fetching payments:', error);
      throw new Error('Failed to fetch payments');
    }
  }

  /**
   * Get payments by source (BSNL/Private)
   */
  static async getPaymentsBySource(source: string): Promise<Payment[]> {
    try {
      const q = query(
        collection(db, PAYMENTS_COLLECTION),
        where('source', '==', source),
        orderBy('paidDate', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      
      const payments: Payment[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        payments.push({
          id: doc.id,
          landlineNo: data.landlineNo || '',
          customerName: data.customerName || '',
          rechargePlan: data.rechargePlan || '',
          duration: data.duration || '',
          billAmount: data.billAmount || 0,
          commission: data.commission || 0,
          status: data.status || 'Unpaid',
          paidDate: data.paidDate || '',
          modeOfPayment: data.modeOfPayment || '',
          renewalDate: data.renewalDate || '',
          source: data.source || 'BSNL'
        });
      });
      
      return payments;
    } catch (error) {
      console.error('Error fetching payments by source:', error);
      throw new Error('Failed to fetch payments');
    }
  }

  /**
   * Search payments by customer name, landline number, or plan
   */
  static async searchPayments(searchTerm: string): Promise<Payment[]> {
    try {
      const allPayments = await this.getPayments();
      
      if (!searchTerm.trim()) {
        return allPayments;
      }

      const term = searchTerm.toLowerCase();
      return allPayments.filter(payment => 
        payment.customerName.toLowerCase().includes(term) ||
        payment.landlineNo.toLowerCase().includes(term) ||
        payment.rechargePlan.toLowerCase().includes(term) ||
        payment.id.toLowerCase().includes(term)
      );
    } catch (error) {
      console.error('Error searching payments:', error);
      throw new Error('Failed to search payments');
    }
  }

  /**
   * Calculate commission based on plan price (utility function)
   */
  static calculateCommission(billAmount: number, planType: string = 'standard'): number {
    let commissionRate = 0;
    
    // Commission rates based on plan type
    switch (planType.toLowerCase()) {
      case 'basic':
        commissionRate = 0.35; // 35% for basic plans
        break;
      case 'standard':
        commissionRate = 0.30; // 30% for standard plans
        break;
      case 'premium':
        commissionRate = 0.25; // 25% for premium plans
        break;
      case 'ultra':
        commissionRate = 0.20; // 20% for ultra plans
        break;
      default:
        commissionRate = 0.30; // Default 30%
    }
    
    return parseFloat((billAmount * commissionRate).toFixed(3));
  }

  /**
   * Get payment statistics
   */
  static async getPaymentStats(): Promise<{
    totalPayments: number;
    totalRevenue: number;
    totalCommission: number;
    paidCount: number;
    unpaidCount: number;
  }> {
    try {
      const payments = await this.getPayments();
      
      const totalPayments = payments.length;
      const totalRevenue = payments.reduce((sum, p) => sum + p.billAmount, 0);
      const totalCommission = payments.reduce((sum, p) => sum + p.commission, 0);
      const paidCount = payments.filter(p => p.status === 'Paid').length;
      const unpaidCount = payments.filter(p => p.status === 'Unpaid').length;

      return {
        totalPayments,
        totalRevenue,
        totalCommission,
        paidCount,
        unpaidCount
      };
    } catch (error) {
      console.error('Error calculating payment stats:', error);
      return {
        totalPayments: 0,
        totalRevenue: 0,
        totalCommission: 0,
        paidCount: 0,
        unpaidCount: 0
      };
    }
  }
}