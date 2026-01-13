import api from './api';

export interface InventoryItem {
    id: string;
    name: string;
    category: string;
    quantity: number;
    price: number;
    supplier?: string;
    description?: string;
    image_url?: string;
}

export const InventoryService = {

    getItems: async (): Promise<InventoryItem[]> => {
        try {
            const response = await api.get('/inventory');
            return response.data;
        } catch (error) {
            console.error('Error fetching inventory items:', error);
            return [];
        }
    },

    addItem: async (item: Omit<InventoryItem, 'id'>): Promise<string> => {
        try {
            const response = await api.post('/inventory', item);
            return response.data.id;
        } catch (error) {
            console.error('Error adding inventory item:', error);
            throw error;
        }
    },

    updateItem: async (id: string, updates: Partial<InventoryItem>): Promise<void> => {
        try {
            await api.put(`/inventory/${id}`, updates);
        } catch (error) {
            console.error('Error updating inventory item:', error);
            throw error;
        }
    },

    deleteItem: async (id: string): Promise<void> => {
        try {
            await api.delete(`/inventory/${id}`);
        } catch (error) {
            console.error('Error deleting inventory item:', error);
            throw error;
        }
    }
};
