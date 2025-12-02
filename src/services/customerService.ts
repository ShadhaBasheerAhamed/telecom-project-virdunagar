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
import type { Customer } from '../types';

const CUSTOMERS_COLLECTION = 'customers';

export const CustomerService = {
  
  // Add Customer
  addCustomer: async (customer: Omit<Customer, 'id'> & { id?: string }) => {
    try {
      // Use custom ID if provided (e.g., from Lead conversion), else auto-gen
      const docRef = await addDoc(collection(db, CUSTOMERS_COLLECTION), {
        ...customer,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error adding customer:', error);
      throw new Error('Failed to add customer');
    }
  },

  // Update Customer
  updateCustomer: async (id: string, updates: Partial<Customer>) => {
    try {
      // Note: In a real app, we might query by custom 'customerId' field instead of doc ID
      // For now assuming doc ID matches or we query first.
      // If using custom IDs as doc IDs:
      const customerRef = doc(db, CUSTOMERS_COLLECTION, id); 
      
      await updateDoc(customerRef, {
        ...updates,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating customer:', error);
      throw new Error('Failed to update customer');
    }
  },

  // Delete Customer
  deleteCustomer: async (id: string) => {
    try {
      await deleteDoc(doc(db, CUSTOMERS_COLLECTION, id));
    } catch (error) {
      console.error('Error deleting customer:', error);
      throw new Error('Failed to delete customer');
    }
  },

  // Get All Customers
  getCustomers: async (): Promise<Customer[]> => {
    try {
      const q = query(collection(db, CUSTOMERS_COLLECTION), orderBy('createdAt', 'desc'), limit(1000));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Customer));
    } catch (error) {
      console.error('Error fetching customers:', error);
      return [];
    }
  },

  // Get Customer by ID/Landline (Helper)
  findCustomerByLandline: async (landline: string): Promise<Customer | null> => {
      const q = query(collection(db, CUSTOMERS_COLLECTION), where('landline', '==', landline));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
          const doc = snapshot.docs[0];
          return { id: doc.id, ...doc.data() } as Customer;
      }
      return null;
  }
};