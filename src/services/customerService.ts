import api from './api';
import type { Customer } from '../types';

export const CustomerService = {

    // ---------------------------------------------------------
    // 1. Add Customer
    // ---------------------------------------------------------
    addCustomer: async (customer: Omit<Customer, 'id'> & { id?: string }) => {
        try {
            const response = await api.post('/customers', customer);
            return response.data.id;
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
            await api.put(`/customers/${id}`, updates);
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
            await api.delete(`/customers/${id}`);
        } catch (error) {
            console.error('Error deleting customer:', error);
            throw new Error('Failed to delete customer');
        }
    },

    // ---------------------------------------------------------
    // 4. Get All Customers
    // ---------------------------------------------------------
    getCustomers: async (): Promise<Customer[]> => {
        try {
            const response = await api.get('/customers');
            return response.data;
        } catch (error) {
            console.error('Error fetching customers:', error);
            return [];
        }
    },

    // ---------------------------------------------------------
    // 5. Find Customer by Landline
    // ---------------------------------------------------------
    findCustomerByLandline: async (landline: string): Promise<Customer | null> => {
        try {
            // Optimization: Could add a specific endpoint for this
            const customers = await CustomerService.getCustomers();
            return customers.find(c => c.landline === landline) || null;
        } catch (error) {
            console.error('Error finding customer:', error);
            return null;
        }
    },

    // ---------------------------------------------------------
    // 6. Real-Time Subscriptions (Simulated with Polling)
    // ---------------------------------------------------------
    // NOTE: Since we moved to REST, real-time isn't out-of-the-box like Firestore.
    // We can simulate it with SWR or React Query, or simple polling for now.
    subscribeToCustomers: (callback: (customers: Customer[]) => void) => {
        // Initial fetch
        CustomerService.getCustomers().then(callback);

        // Simple polling every 30 seconds
        const interval = setInterval(() => {
            CustomerService.getCustomers().then(callback);
        }, 30000);

        // Return unsubscribe function
        return () => clearInterval(interval);
    },

    // ---------------------------------------------------------
    // 7. Advanced Queries (Client-side filtering for now)
    // ---------------------------------------------------------
    getCustomersByPlan: async (plan: string): Promise<Customer[]> => {
        const customers = await CustomerService.getCustomers();
        return customers.filter(c => c.plan === plan);
    },

    getCustomersWithRenewalDue: async (daysAhead: number = 30): Promise<Customer[]> => {
        const customers = await CustomerService.getCustomers();
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() + daysAhead);

        return customers.filter(c =>
            c.renewalDate && new Date(c.renewalDate) <= cutoffDate
        );
    },

    searchCustomers: async (searchTerm: string): Promise<Customer[]> => {
        const customers = await CustomerService.getCustomers();
        const searchLower = searchTerm.toLowerCase();
        return customers.filter(customer =>
            customer.name?.toLowerCase().includes(searchLower) ||
            customer.landline?.includes(searchTerm) ||
            customer.mobileNo?.includes(searchTerm) ||
            customer.email?.toLowerCase().includes(searchLower)
        );
    },

    // ---------------------------------------------------------
    // 8. Stats
    // ---------------------------------------------------------
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
