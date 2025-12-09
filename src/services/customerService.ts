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
    writeBatch,
    Timestamp,
    setDoc,
    getDoc
} from '../firebase/config';
import { db } from '../firebase/config';
import type { Customer } from '../types';

const CUSTOMERS_COLLECTION = 'customers';

export const CustomerService = {

    // Add Customer
    // Add Customer
    addCustomer: async (customer: Omit<Customer, 'id'> & { id?: string }) => {
        try {
            // If we have a custom ID (e.g. "104562-..."), use it as the Document ID
            if (customer.id) {
                const docRef = doc(db, CUSTOMERS_COLLECTION, customer.id);
                await setDoc(docRef, {
                    ...customer,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                });
                return customer.id;
            } else {
                // Fallback to auto-generated ID if no ID provided
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

    // Update Customer
    // Update Customer
    updateCustomer: async (id: string, updates: Partial<Customer>) => {
        try {
            // Strategy: Try to find document by ID directly first
            // If the ID was used as the Doc ID (new behavior), this works.
            const directDocRef = doc(db, CUSTOMERS_COLLECTION, id);
            const directSnapshot = await getDoc(directDocRef);

            if (directSnapshot.exists()) {
                await updateDoc(directDocRef, {
                    ...updates,
                    updatedAt: new Date().toISOString()
                });
                return;
            }

            // If not found, it might be an old record where ID is a field, not the Doc ID.
            // Query for it.
            const q = query(collection(db, CUSTOMERS_COLLECTION), where('id', '==', id));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                // Found it via query
                const docToUpdate = querySnapshot.docs[0];
                await updateDoc(docToUpdate.ref, {
                    ...updates,
                    updatedAt: new Date().toISOString()
                });
            } else {
                console.warn(`Customer with ID ${id} not found for update.`);
                throw new Error('Customer not found');
            }

        } catch (error) {
            console.error('Error updating customer:', error);
            throw new Error('Failed to update customer');
        }
    },

    // Delete Customer
    // Delete Customer
    deleteCustomer: async (id: string) => {
        try {
            // Strategy: Try to find document by ID directly first
            const directDocRef = doc(db, CUSTOMERS_COLLECTION, id);
            const directSnapshot = await getDoc(directDocRef);

            if (directSnapshot.exists()) {
                await deleteDoc(directDocRef);
                return;
            }

            // If not found, query match
            const q = query(collection(db, CUSTOMERS_COLLECTION), where('id', '==', id));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                const docToDelete = querySnapshot.docs[0];
                await deleteDoc(docToDelete.ref);
            } else {
                console.warn(`Customer with ID ${id} not found for deletion.`);
                // We ensure we don't throw if it's already gone, or maybe we should?
                // User asked to fix verify delete works. use console warn.
            }
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
    },

    // ==================== REAL-TIME SUBSCRIPTIONS ====================
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

    // ==================== BATCH OPERATIONS ====================
    addBulkCustomers: async (customers: Omit<Customer, 'id'>[]): Promise<{ success: number; failed: number; errors: string[] }> => {
        try {
            const batchSize = 500; // Firestore limit
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
                        createdAt: Timestamp.fromDate(new Date()),
                        updatedAt: Timestamp.fromDate(new Date())
                    });
                });

                try {
                    await batch.commit();
                    success += chunk.length;
                } catch (error) {
                    failed += chunk.length;
                    errors.push(`Batch ${Math.floor(i / batchSize) + 1} failed: ${error}`);
                }
            }

            console.log(`Bulk customer upload completed: ${success} success, ${failed} failed`);
            return { success, failed, errors };
        } catch (error) {
            console.error('Bulk customer upload failed:', error);
            return { success: 0, failed: customers.length, errors: [error instanceof Error ? error.message : 'Unknown error'] };
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
                        updatedAt: Timestamp.fromDate(new Date())
                    });
                });

                try {
                    await batch.commit();
                    success += chunk.length;
                } catch (error) {
                    failed += chunk.length;
                    errors.push(`Batch ${Math.floor(i / batchSize) + 1} failed: ${error}`);
                }
            }

            console.log(`Bulk customer update completed: ${success} success, ${failed} failed`);
            return { success, failed, errors };
        } catch (error) {
            console.error('Bulk customer update failed:', error);
            return { success: 0, failed: updates.length, errors: [error instanceof Error ? error.message : 'Unknown error'] };
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
                    errors.push(`Batch ${Math.floor(i / batchSize) + 1} failed: ${error}`);
                }
            }

            console.log(`Bulk customer deletion completed: ${success} success, ${failed} failed`);
            return { success, failed, errors };
        } catch (error) {
            console.error('Bulk customer deletion failed:', error);
            return { success: 0, failed: customerIds.length, errors: [error instanceof Error ? error.message : 'Unknown error'] };
        }
    },

    // ==================== ADVANCED QUERIES ====================
    getCustomersByPlan: async (plan: string): Promise<Customer[]> => {
        try {
            const q = query(
                collection(db, CUSTOMERS_COLLECTION),
                where('plan', '==', plan),
                orderBy('createdAt', 'desc')
            );

            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Customer[];
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
                where('renewalDate', '<=', Timestamp.fromDate(cutoffDate)),
                orderBy('renewalDate', 'asc')
            );

            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Customer[];
        } catch (error) {
            console.error('Error fetching customers with renewal due:', error);
            return [];
        }
    },

    searchCustomers: async (searchTerm: string): Promise<Customer[]> => {
        try {
            // Note: Firestore doesn't support full-text search natively
            // This is a simplified search - in production, consider using Algolia or similar
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

    // ==================== ERROR HANDLING AND RETRY ====================
    addCustomerWithRetry: async (
        customer: Omit<Customer, 'id'> & { id?: string },
        maxRetries: number = 3
    ): Promise<string | null> => {
        let lastError: Error | null = null;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                return await CustomerService.addCustomer(customer);
            } catch (error) {
                lastError = error instanceof Error ? error : new Error('Unknown error');
                console.error(`Attempt ${attempt} failed:`, lastError.message);

                if (attempt === maxRetries) {
                    console.error('Max retries reached, giving up');
                    break;
                }

                // Exponential backoff
                await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
            }
        }

        return null;
    },

    // ==================== UTILITY METHODS ====================
    validateCustomerData: (customer: Partial<Customer>): { isValid: boolean; errors: string[] } => {
        const errors: string[] = [];

        if (!customer.name || customer.name.trim().length === 0) {
            errors.push('Customer name is required');
        }

        if (!customer.landline || customer.landline.trim().length === 0) {
            errors.push('Landline number is required');
        }

        if (!customer.mobileNo || customer.mobileNo.trim().length === 0) {
            errors.push('Mobile number is required');
        }

        if (customer.mobileNo && !/^\d{10}$/.test(customer.mobileNo)) {
            errors.push('Mobile number must be 10 digits');
        }

        if (customer.altMobileNo && !/^\d{10}$/.test(customer.altMobileNo)) {
            errors.push('Alternative mobile number must be 10 digits');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
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

            const today = new Date();
            const renewalCutoff = new Date();
            renewalCutoff.setDate(today.getDate() + 30);

            customers.forEach(customer => {
                // Count by status
                stats.byStatus[customer.status] = (stats.byStatus[customer.status] || 0) + 1;

                // Count by source
                stats.bySource[customer.source] = (stats.bySource[customer.source] || 0) + 1;

                // Count by plan
                if (customer.plan) {
                    stats.byPlan[customer.plan] = (stats.byPlan[customer.plan] || 0) + 1;
                }

                // Check renewal due
                const customerData = customer as any;
                if (customerData.renewalDate && new Date(customerData.renewalDate) <= renewalCutoff) {
                    stats.withRenewalDue++;
                }
            });

            return stats;
        } catch (error) {
            console.error('Error calculating customer stats:', error);
            return {
                total: 0,
                byStatus: {},
                bySource: {},
                byPlan: {},
                withRenewalDue: 0
            };
        }
    }
};