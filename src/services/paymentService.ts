import api from './api';
import type { Payment } from '../types';

// For 'commission_rates' we might need another backend table/endpoint if we migrate that too.
// For now, I'll keep the rate logic simple or assumed fixed, or fetch from backend API if implemented.
// Based on current backend implementation, we only did 'payments' table. 
// I will just use defaults for commission or a mock for now to complete the migration of the payment service itself.

export const PaymentService = {

  // 1. Add Payment
  addPayment: async (payment: Omit<Payment, 'id'>, customerId: string) => {
    try {
      console.log("Sending Payment to API:", payment);
      const response = await api.post('/payments', { ...payment, customer_id: customerId });
      return response.data;
    } catch (error) {
      console.error('Error adding payment:', error);
      throw new Error('Failed to add payment record');
    }
  },

  // 2. Check Duplicate
  checkDuplicatePayment: async (landlineNo: string, paidDate: string): Promise<boolean> => {
    try {
      const response = await api.get('/payments/check-duplicate', { params: { landlineNo, paidDate } });
      return response.data.isDuplicate;
    } catch (error: any) {
      console.error('❌ Error checking duplicate:', error);
      return false;
    }
  },

  // 3. Bulk Upload
  addBulkPayments: async (payments: Omit<Payment, 'id'>[]) => {
    try {
      // Backend doesn't support bulk yet, loop for now or implement bulk in backend.
      // Looping is safer for now.
      for (const payment of payments) {
        await api.post('/payments', payment);
      }
    } catch (error) {
      console.error('Bulk upload failed:', error);
      throw new Error('Bulk upload failed');
    }
  },

  // 4. Update Payment
  updatePayment: async (id: string, payment: Partial<Payment>) => {
    try {
      await api.put(`/payments/${id}`, payment);
    } catch (error) {
      console.error('Error updating payment:', error);
      throw new Error('Failed to update payment record');
    }
  },

  // 5. Delete Payment
  deletePayment: async (id: string) => {
    try {
      await api.delete(`/payments/${id}`);
    } catch (error) {
      console.error('Error deleting payment:', error);
      throw new Error('Failed to delete payment record');
    }
  },

  // 6. Get All Payments
  getPayments: async (): Promise<Payment[]> => {
    try {
      const response = await api.get('/payments');
      return response.data;
    } catch (error) {
      console.error('Error fetching payments:', error);
      return [];
    }
  },

  // 7. Get By Source
  getPaymentsBySource: async (source: string): Promise<Payment[]> => {
    try {
      // Optimization: Create backend filter endpoint. For now filter client side.
      const response = await api.get('/payments');
      const payments: Payment[] = response.data;
      return payments.filter(p => p.source === source);
    } catch (error: any) {
      return [];
    }
  },

  // 8. Fallback Method (Redundant with API but keeping signature)
  getPaymentsBySourceFallback: async (source: string): Promise<Payment[]> => {
    return PaymentService.getPaymentsBySource(source);
  },

  // 9. Subscribe
  subscribeToPayments: (callback: (payments: Payment[]) => void) => {
    // Polling simulation
    PaymentService.getPayments().then(callback);
    const interval = setInterval(() => {
      PaymentService.getPayments().then(callback);
    }, 30000);
    return () => clearInterval(interval);
  },

  // 10. Get Commission Rate (Mock/Placeholder until Commission Table in Postgres)
  getCommissionRate: async (source: string): Promise<number> => {
    return 30;
  },

  // 11. Save Commission Rate
  saveCommissionRate: async (source: string, rate: number) => {
    // TODO: Implement Commission Rate endpoint if needed
    console.log("Saving commission rate not implemented via API yet");
  }
};
