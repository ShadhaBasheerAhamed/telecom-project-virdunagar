import api from './api';

export interface InventoryItem {
    id: string;
    name: string;
    description: string;
    category: string;
    buyPrice: number;
    sellPrice: number;
    stock: number;
    unit: 'Nos' | 'Mtr';
    gst: number;
    image?: string;
    routerMake?: string;
    ontMake?: string;
    ontType?: string;
    macAddress?: string;
    createdAt?: string;

    // Legacy fields if still needed by some parts, but mostly we'll use the above
    quantity?: number;
    price?: number;
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
