import { useState, useEffect, useCallback } from 'react';
import { NetworkProviderService } from '@/services/networkProviderService';
import type { NetworkProvider } from '@/types';
import { toast } from 'sonner';

export const useNetworkProviders = () => {
  const [providers, setProviders] = useState<NetworkProvider[]>([]);
  const [activeProviders, setActiveProviders] = useState<NetworkProvider[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setIsLoading(true);
        const [allProviders, activeOnes] = await Promise.all([
          NetworkProviderService.getNetworkProviders(),
          NetworkProviderService.getActiveNetworkProviders()
        ]);

        setProviders(allProviders);
        setActiveProviders(activeOnes);
        setError(null);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load network providers';
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialData();
  }, []);

  // Subscribe to real-time updates
  useEffect(() => {
    const unsubscribeAll = NetworkProviderService.subscribeToNetworkProviders((updatedProviders) => {
      setProviders(updatedProviders);
      setError(null);
    });

    const unsubscribeActive = NetworkProviderService.subscribeToActiveNetworkProviders((updatedActiveProviders) => {
      setActiveProviders(updatedActiveProviders);
    });

    return () => {
      unsubscribeAll();
      unsubscribeActive();
    };
  }, []);

  // CRUD operations
  const addProvider = useCallback(async (providerData: Omit<NetworkProvider, 'id'>) => {
    try {
      // Validate data
      const validation = NetworkProviderService.validateNetworkProviderData(providerData);
      if (!validation.isValid) {
        toast.error(validation.errors.join(', '));
        return null;
      }

      const id = await NetworkProviderService.addNetworkProvider(providerData);
      toast.success('Network provider added successfully');
      return id;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add network provider';
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    }
  }, []);

  const updateProvider = useCallback(async (id: string, updates: Partial<NetworkProvider>) => {
    try {
      // Validate data if name is being updated
      if (updates.name) {
        const validation = NetworkProviderService.validateNetworkProviderData(updates);
        if (!validation.isValid) {
          toast.error(validation.errors.join(', '));
          return false;
        }
      }

      await NetworkProviderService.updateNetworkProvider(id, updates);
      toast.success('Network provider updated successfully');
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update network provider';
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    }
  }, []);

  const deleteProvider = useCallback(async (id: string) => {
    try {
      await NetworkProviderService.deleteNetworkProvider(id);
      toast.success('Network provider deleted successfully');
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete network provider';
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    }
  }, []);

  const toggleProviderStatus = useCallback(async (id: string, currentStatus: 'Active' | 'Inactive') => {
    const newStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
    return updateProvider(id, { status: newStatus });
  }, [updateProvider]);

  // Get data source options for header filter
  const getDataSourceOptions = useCallback(() => {
    const options = [{ value: 'All', label: 'All Sources' }];
    activeProviders.forEach(provider => {
      options.push({ value: provider.name, label: provider.name });
    });
    return options;
  }, [activeProviders]);

  // Refresh data
  const refresh = useCallback(async () => {
    try {
      setIsLoading(true);
      const [allProviders, activeOnes] = await Promise.all([
        NetworkProviderService.getNetworkProviders(),
        NetworkProviderService.getActiveNetworkProviders()
      ]);

      setProviders(allProviders);
      setActiveProviders(activeOnes);
      setError(null);
      toast.success('Data refreshed');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to refresh data';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    providers,
    activeProviders,
    isLoading,
    error,
    addProvider,
    updateProvider,
    deleteProvider,
    toggleProviderStatus,
    getDataSourceOptions,
    refresh
  };
};
