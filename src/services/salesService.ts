import api from './api';

export interface Sale {
    id: string;
    customer_name: string;
    customer_phone: string;
    customer_email?: string;
    items: any[];
    total_amount: number;
    date: string;
}

export const SalesService = {

    getSales: async (startDate?: string, endDate?: string): Promise<Sale[]> => {
        try {
            let url = '/sales';
            if (startDate && endDate) {
                url += `?start_date=${startDate}&end_date=${endDate}`;
            }
            const response = await api.get(url);
            return response.data;
        } catch (error) {
            console.error('Error fetching sales:', error);
            return [];
        }
    },

    createSale: async (sale: Omit<Sale, 'id'>): Promise<string> => {
        try {
            const response = await api.post('/sales', sale);
            return response.data.id;
        } catch (error) {
            console.error('Error creating sale:', error);
            throw error;
        }
    },

    deleteSale: async (id: string): Promise<void> => {
        try {
            await api.delete(`/sales/${id}`);
        } catch (error) {
            console.error('Error deleting sale:', error);
            throw error;
        }
    }
};
