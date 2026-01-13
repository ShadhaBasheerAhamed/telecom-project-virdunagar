import api from './api';
import type { NetworkProvider } from '../types';

export const NetworkProviderService = {

  // Get all providers
  getNetworkProviders: async (): Promise<NetworkProvider[]> => {
    try {
      const response = await api.get('/network-providers');
      return response.data;
    } catch (error) {
      console.error('Error fetching network providers:', error);
      return [];
    }
  },

  // Get active providers
  getActiveNetworkProviders: async (): Promise<NetworkProvider[]> => {
    try {
      const response = await api.get('/network-providers?status=Active');
      return response.data;
    } catch (error) {
      console.error('Error fetching active network providers:', error);
      return [];
    }
  },

  // Add Provider
  addNetworkProvider: async (providerData: Omit<NetworkProvider, 'id'>): Promise<string> => {
    try {
      const response = await api.post('/network-providers', providerData);
      return response.data.id;
    } catch (error) {
      console.error('Error adding network provider:', error);
      throw error;
    }
  },

  // Update Provider
  updateNetworkProvider: async (id: string, updates: Partial<NetworkProvider>): Promise<void> => {
    try {
      await api.put(`/network-providers/${id}`, updates);
    } catch (error) {
      console.error('Error updating network provider:', error);
      throw error;
    }
  },

  // Delete Provider
  deleteNetworkProvider: async (id: string): Promise<void> => {
    try {
      await api.delete(`/network-providers/${id}`);
    } catch (error) {
      console.error('Error deleting network provider:', error);
      throw error;
    }
  },

  // Real-time Subscriptions (using polling for now)
  subscribeToNetworkProviders: (callback: (providers: NetworkProvider[]) => void) => {
    const interval = setInterval(async () => {
      const providers = await NetworkProviderService.getNetworkProviders();
      callback(providers);
    }, 5000);

    // Initial fetch
    NetworkProviderService.getNetworkProviders().then(callback);

    return () => clearInterval(interval);
  },

  subscribeToActiveNetworkProviders: (callback: (providers: NetworkProvider[]) => void) => {
    const interval = setInterval(async () => {
      const providers = await NetworkProviderService.getActiveNetworkProviders();
      callback(providers);
    }, 5000);

    // Initial fetch
    NetworkProviderService.getActiveNetworkProviders().then(callback);

    return () => clearInterval(interval);
  },

  // Validation Logic
  validateNetworkProviderData: (data: Partial<NetworkProvider>): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (data.name !== undefined) {
      if (!data.name || data.name.trim().length === 0) {
        errors.push('Provider name is required');
      } else if (data.name.trim().length < 2) {
        errors.push('Provider name must be at least 2 characters');
      } else if (data.name.trim().length > 50) {
        errors.push('Provider name must not exceed 50 characters');
      }
    }

    if (data.status !== undefined && !['Active', 'Inactive'].includes(data.status)) {
      errors.push('Status must be either "Active" or "Inactive"');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
};