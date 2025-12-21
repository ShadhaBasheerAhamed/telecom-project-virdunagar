import {
    collection,
    doc,
    addDoc,
    updateDoc,
    deleteDoc,
    getDocs,
    getDoc, 
    query,
    where,
    orderBy,
    limit,
    onSnapshot,
    writeBatch,
    Timestamp,
    setDoc
} from 'firebase/firestore';
import { db } from '../firebase/config';
import type { Customer } from '../types';

const CUSTOMERS_COLLECTION = 'customers';

export const CustomerService = {

    // ---------------------------------------------------------
    // 1. Add Customer
    // ---------------------------------------------------------
    addCustomer: async (customer: Omit<Customer, 'id'> & { id?: string }) => {
        try {
            if (customer.id) {
                const docRef = doc(db, CUSTOMERS_COLLECTION, customer.id);
                await setDoc(docRef, { 
                    ...customer, 
                    createdAt: new Date().toISOString(), 
                    updatedAt: new Date().toISOString() 
                });
                return customer.id;
            } else {
                const docRef = await addDoc(collection(db, CUSTOMERS_COLLECTION), { 
                    ...customer, 
                    createdAt: new Date().toISOString(), 
                    updatedAt: new Date().toISOString() 
                });
                return docRef.id;
            }
        } catch (error) {
            console.error('Error adding customer:', error);
            throw new Error('Failed to add customer');
        }
    },

    // ---------------------------------------------------------
    // 2. Update Customer
    // ---------------------------------------------------------
    updateCustomer: async (id: string, updates: Partial<Customer>) => {
        try {
            const directDocRef = doc(db, CUSTOMERS_COLLECTION, id);
            // Check if doc exists directly
            const docSnap = await getDoc(directDocRef);
            
            if (docSnap.exists()) {
                 await updateDoc(directDocRef, { ...updates, updatedAt: new Date().toISOString() });
                 return;
            } 
            
            // Fallback: Query by ID field if not document ID
            const q = query(collection(db, CUSTOMERS_COLLECTION), where('id', '==', id));
            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
                const docToUpdate = querySnapshot.docs[0];
                await updateDoc(docToUpdate.ref, { ...updates, updatedAt: new Date().toISOString() });
            }
        } catch (error) {
            console.error('Error updating customer:', error);
            throw new Error('Failed to update customer');
        }
    },

    // ---------------------------------------------------------
    // 3. Delete Customer
    // ---------------------------------------------------------
    deleteCustomer: async (id: string) => {
        try {
            const directDocRef = doc(db, CUSTOMERS_COLLECTION, id);
            await deleteDoc(directDocRef);
        } catch (error) {
            console.error('Error deleting customer:', error);
            throw new Error('Failed to delete customer');
        }
    },

    // ---------------------------------------------------------
    // 4. ✅ Wallet Update Function
    // ---------------------------------------------------------
    updateWallet: async (customerId: string, amount: number, type: 'credit' | 'debit') => {
        try {
            const customerRef = doc(db, CUSTOMERS_COLLECTION, customerId);
            const customerSnap = await getDoc(customerRef);
            if (!customerSnap.exists()) throw new Error('Customer not found');

            const customerData = customerSnap.data();
            let newBalance = customerData.walletBalance || 0;

            if (type === 'credit') {
                newBalance += amount;
            } else {
                newBalance -= amount;
            }

            await updateDoc(customerRef, { 
                walletBalance: newBalance, 
                updatedAt: new Date().toISOString() 
            });
            return newBalance;
        } catch (error) {
            console.error('Error updating wallet:', error);
            throw new Error('Failed to update wallet balance');
        }
    },

    // ---------------------------------------------------------
    // 5. Get All Customers
    // ---------------------------------------------------------
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

    // ---------------------------------------------------------
    // 6. Find Customer by Landline
    // ---------------------------------------------------------
    findCustomerByLandline: async (landline: string): Promise<Customer | null> => {
        try {
            const q = query(collection(db, CUSTOMERS_COLLECTION), where('landline', '==', landline));
            const snapshot = await getDocs(q);
            if (snapshot.empty) return null;
            const doc = snapshot.docs[0];
            return { id: doc.id, ...doc.data() } as Customer;
        } catch (error) {
            console.error('Error finding customer:', error);
            return null;
        }
    },

    // ---------------------------------------------------------
    // 7. Real-Time Subscriptions
    // ---------------------------------------------------------
    subscribeToCustomers: (callback: (customers: Customer[]) => void) => {
        const q = query(
            collection(db, CUSTOMERS_COLLECTION),
            orderBy('createdAt', 'desc'),
            limit(100)
        );

        return onSnapshot(q, (snapshot) => {
            const customers = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Customer[];

            callback(customers);
        });
    },

    subscribeToCustomerById: (customerId: string, callback: (customer: Customer | null) => void) => {
        const customerRef = doc(db, CUSTOMERS_COLLECTION, customerId);

        return onSnapshot(customerRef, (doc) => {
            if (doc.exists()) {
                callback({ id: doc.id, ...doc.data() } as Customer);
            } else {
                callback(null);
            }
        });
    },

    subscribeToCustomersByStatus: (status: Customer['status'], callback: (customers: Customer[]) => void) => {
        const q = query(
            collection(db, CUSTOMERS_COLLECTION),
            where('status', '==', status),
            orderBy('createdAt', 'desc'),
            limit(100)
        );

        return onSnapshot(q, (snapshot) => {
            const customers = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Customer[];

            callback(customers);
        });
    },

    subscribeToCustomersBySource: (source: Customer['source'], callback: (customers: Customer[]) => void) => {
        const q = query(
            collection(db, CUSTOMERS_COLLECTION),
            where('source', '==', source),
            orderBy('createdAt', 'desc'),
            limit(100)
        );

        return onSnapshot(q, (snapshot) => {
            const customers = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Customer[];

            callback(customers);
        });
    },

    // ---------------------------------------------------------
    // 8. Bulk Operations
    // ---------------------------------------------------------
    addBulkCustomers: async (customers: Omit<Customer, 'id'>[]): Promise<{ success: number; failed: number; errors: string[] }> => {
        try {
            const batchSize = 500;
            let success = 0;
            let failed = 0;
            const errors: string[] = [];

            for (let i = 0; i < customers.length; i += batchSize) {
                const batch = writeBatch(db);
                const chunk = customers.slice(i, i + batchSize);

                chunk.forEach((customer) => {
                    const docRef = doc(collection(db, CUSTOMERS_COLLECTION));
                    batch.set(docRef, {
                        ...customer,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString()
                    });
                });

                try {
                    await batch.commit();
                    success += chunk.length;
                } catch (error) {
                    failed += chunk.length;
                    errors.push(`Batch error: ${error}`);
                }
            }
            return { success, failed, errors };
        } catch (error) { 
            return { success: 0, failed: customers.length, errors: [String(error)] }; 
        }
    },

    updateBulkCustomers: async (updates: Array<{ id: string; data: Partial<Customer> }>): Promise<{ success: number; failed: number; errors: string[] }> => {
        try {
            const batchSize = 500;
            let success = 0; 
            let failed = 0;
            const errors: string[] = [];

            for (let i = 0; i < updates.length; i += batchSize) {
                const batch = writeBatch(db);
                const chunk = updates.slice(i, i + batchSize);

                chunk.forEach(({ id, data }) => {
                    const customerRef = doc(db, CUSTOMERS_COLLECTION, id);
                    batch.update(customerRef, {
                        ...data,
                        updatedAt: new Date().toISOString()
                    });
                });

                try {
                    await batch.commit();
                    success += chunk.length;
                } catch (error) {
                    failed += chunk.length;
                    errors.push(`Batch error: ${error}`);
                }
            }
            return { success, failed, errors };
        } catch (error) {
            return { success: 0, failed: updates.length, errors: [String(error)] };
        }
    },

    deleteBulkCustomers: async (customerIds: string[]): Promise<{ success: number; failed: number; errors: string[] }> => {
        try {
            const batchSize = 500;
            let success = 0; 
            let failed = 0;
            const errors: string[] = [];

            for (let i = 0; i < customerIds.length; i += batchSize) {
                const batch = writeBatch(db);
                const chunk = customerIds.slice(i, i + batchSize);

                chunk.forEach((id) => {
                    const customerRef = doc(db, CUSTOMERS_COLLECTION, id);
                    batch.delete(customerRef);
                });

                try {
                    await batch.commit();
                    success += chunk.length;
                } catch (error) {
                    failed += chunk.length;
                    errors.push(`Batch error: ${error}`);
                }
            }
            return { success, failed, errors };
        } catch (error) {
            return { success: 0, failed: customerIds.length, errors: [String(error)] };
        }
    },

    // ---------------------------------------------------------
    // 9. Advanced Queries
    // ---------------------------------------------------------
    getCustomersByPlan: async (plan: string): Promise<Customer[]> => {
        try {
            const q = query(
                collection(db, CUSTOMERS_COLLECTION),
                where('plan', '==', plan),
                orderBy('createdAt', 'desc')
            );
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Customer));
        } catch (error) {
            console.error('Error fetching customers by plan:', error);
            return [];
        }
    },

    getCustomersWithRenewalDue: async (daysAhead: number = 30): Promise<Customer[]> => {
        try {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() + daysAhead);
            
            const q = query(
                collection(db, CUSTOMERS_COLLECTION),
                where('renewalDate', '<=', cutoffDate.toISOString().split('T')[0]),
                orderBy('renewalDate', 'asc')
            );
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Customer));
        } catch (error) {
            console.error('Error fetching customers with renewal due:', error);
            return [];
        }
    },

    searchCustomers: async (searchTerm: string): Promise<Customer[]> => {
        try {
            const customers = await CustomerService.getCustomers();
            const searchLower = searchTerm.toLowerCase();
            return customers.filter(customer =>
                customer.name?.toLowerCase().includes(searchLower) ||
                customer.landline?.includes(searchTerm) ||
                customer.mobileNo?.includes(searchTerm) ||
                customer.email?.toLowerCase().includes(searchLower)
            );
        } catch (error) {
            console.error('Error searching customers:', error);
            return [];
        }
    },

    // ---------------------------------------------------------
    // 10. Utility & Retry
    // ---------------------------------------------------------
    addCustomerWithRetry: async (
        customer: Omit<Customer, 'id'> & { id?: string },
        maxRetries: number = 3
    ): Promise<string | null> => {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                return await CustomerService.addCustomer(customer);
            } catch (error) {
                console.error(`Attempt ${attempt} failed:`, error);
                if (attempt === maxRetries) break;
                await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
            }
        }
        return null;
    },

    validateCustomerData: (customer: Partial<Customer>): { isValid: boolean; errors: string[] } => {
        const errors: string[] = [];
        if (!customer.name || customer.name.trim().length === 0) errors.push('Customer name is required');
        if (!customer.landline || customer.landline.trim().length === 0) errors.push('Landline number is required');
        if (!customer.mobileNo || customer.mobileNo.trim().length === 0) errors.push('Mobile number is required');
        if (customer.mobileNo && !/^\d{10}$/.test(customer.mobileNo)) errors.push('Mobile number must be 10 digits');
        return { isValid: errors.length === 0, errors };
    },

    getCustomerStats: async () => {
        try {
            const customers = await CustomerService.getCustomers();
            const stats = {
                total: customers.length,
                byStatus: {} as Record<string, number>,
                bySource: {} as Record<string, number>,
                byPlan: {} as Record<string, number>,
                withRenewalDue: 0
            };
            const renewalCutoff = new Date();
            renewalCutoff.setDate(renewalCutoff.getDate() + 30);

            customers.forEach(customer => {
                stats.byStatus[customer.status] = (stats.byStatus[customer.status] || 0) + 1;
                stats.bySource[customer.source] = (stats.bySource[customer.source] || 0) + 1;
                if (customer.plan) stats.byPlan[customer.plan] = (stats.byPlan[customer.plan] || 0) + 1;
                if (customer.renewalDate && new Date(customer.renewalDate) <= renewalCutoff) stats.withRenewalDue++;
            });
            return stats;
        } catch (error) {
            console.error('Error calculating customer stats:', error);
            return { total: 0, byStatus: {}, bySource: {}, byPlan: {}, withRenewalDue: 0 };
        }
    }
};