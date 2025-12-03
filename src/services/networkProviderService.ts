import type { NetworkProvider } from '../types';

// Mock data for network providers
const MOCK_PROVIDERS: NetworkProvider[] = [
  {
    id: '1',
    name: 'BSNL',
    status: 'Active',
    createdAt: '2023-01-01T00:00:00.000Z',
    updatedAt: '2023-01-01T00:00:00.000Z'
  },
  {
    id: '2',
    name: 'RMAX',
    status: 'Active',
    createdAt: '2023-02-01T00:00:00.000Z',
    updatedAt: '2023-02-01T00:00:00.000Z'
  },
  {
    id: '3',
    name: 'JIO',
    status: 'Inactive',
    createdAt: '2023-03-01T00:00:00.000Z',
    updatedAt: '2023-03-01T00:00:00.000Z'
  }
];

class NetworkProviderServiceClass {
  private providers: NetworkProvider[] = [...MOCK_PROVIDERS];
  private listeners: { [key: string]: ((providers: NetworkProvider[]) => void)[] } = {
    all: [],
    active: []
  };

  // Get all network providers
  async getNetworkProviders(): Promise<NetworkProvider[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([...this.providers]);
      }, 100); // Simulate network delay
    });
  }

  // Get active network providers
  async getActiveNetworkProviders(): Promise<NetworkProvider[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(this.providers.filter(p => p.status === 'Active'));
      }, 100);
    });
  }

  // Add a new network provider
  async addNetworkProvider(providerData: Omit<NetworkProvider, 'id'>): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        const validation = this.validateNetworkProviderData(providerData);
        if (!validation.isValid) {
          throw new Error(validation.errors.join(', '));
        }

        const newProvider: NetworkProvider = {
          ...providerData,
          id: Date.now().toString(),
          createdAt: providerData.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        this.providers.push(newProvider);
        this.notifyListeners('all', [...this.providers]);
        this.notifyListeners('active', this.providers.filter(p => p.status === 'Active'));

        resolve(newProvider.id);
      } catch (error) {
        reject(error);
      }
    });
  }

  // Update an existing network provider
  async updateNetworkProvider(id: string, updates: Partial<NetworkProvider>): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const providerIndex = this.providers.findIndex(p => p.id === id);
        if (providerIndex === -1) {
          throw new Error('Network provider not found');
        }

        // Validate if name is being updated
        if (updates.name) {
          const validation = this.validateNetworkProviderData(updates);
          if (!validation.isValid) {
            throw new Error(validation.errors.join(', '));
          }
        }

        this.providers[providerIndex] = {
          ...this.providers[providerIndex],
          ...updates,
          updatedAt: new Date().toISOString()
        };

        this.notifyListeners('all', [...this.providers]);
        this.notifyListeners('active', this.providers.filter(p => p.status === 'Active'));

        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }

  // Delete a network provider
  async deleteNetworkProvider(id: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const providerIndex = this.providers.findIndex(p => p.id === id);
        if (providerIndex === -1) {
          throw new Error('Network provider not found');
        }

        this.providers.splice(providerIndex, 1);
        this.notifyListeners('all', [...this.providers]);
        this.notifyListeners('active', this.providers.filter(p => p.status === 'Active'));

        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }

  // Subscribe to all providers updates
  subscribeToNetworkProviders(callback: (providers: NetworkProvider[]) => void): () => void {
    this.listeners.all.push(callback);
    
    // Immediately call with current data
    callback([...this.providers]);

    // Return unsubscribe function
    return () => {
      const index = this.listeners.all.indexOf(callback);
      if (index > -1) {
        this.listeners.all.splice(index, 1);
      }
    };
  }

  // Subscribe to active providers updates
  subscribeToActiveNetworkProviders(callback: (providers: NetworkProvider[]) => void): () => void {
    this.listeners.active.push(callback);
    
    // Immediately call with current data
    callback(this.providers.filter(p => p.status === 'Active'));

    // Return unsubscribe function
    return () => {
      const index = this.listeners.active.indexOf(callback);
      if (index > -1) {
        this.listeners.active.splice(index, 1);
      }
    };
  }

  // Validate network provider data
  validateNetworkProviderData(data: Partial<NetworkProvider>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (data.name !== undefined) {
      if (!data.name || data.name.trim().length === 0) {
        errors.push('Provider name is required');
      } else if (data.name.trim().length < 2) {
        errors.push('Provider name must be at least 2 characters');
      } else if (data.name.trim().length > 50) {
        errors.push('Provider name must not exceed 50 characters');
      }
      
      // Check for duplicate names (excluding current provider if updating)
      const duplicateExists = this.providers.some(p => 
        p.name.toLowerCase() === data.name?.toLowerCase().trim()
      );
      if (duplicateExists) {
        errors.push('A provider with this name already exists');
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

  // Notify all listeners of a specific type
  private notifyListeners(type: 'all' | 'active', providers: NetworkProvider[]): void {
    this.listeners[type].forEach(callback => {
      try {
        callback(providers);
      } catch (error) {
        console.error('Error notifying network provider listener:', error);
      }
    });
  }
}

// Export singleton instance
export const NetworkProviderService = new NetworkProviderServiceClass();