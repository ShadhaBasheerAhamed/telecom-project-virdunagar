import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { NetworkProvider } from '../types';
import { NetworkProviderService } from '../services/networkProviderService';

interface NetworkProviderContextType {
    selectedProvider: NetworkProvider | null; // Changed from 'provider' to 'selectedProvider' for clarity
    setSelectedProvider: (provider: NetworkProvider | null) => void;
    availableProviders: NetworkProvider[];
    isLoading: boolean;
}

const NetworkProviderContext = createContext<NetworkProviderContextType | undefined>(undefined);

export function NetworkProviderProvider({ children }: { children: ReactNode }) {
    const [selectedProvider, setSelectedProvider] = useState<NetworkProvider | null>(null);
    const [availableProviders, setAvailableProviders] = useState<NetworkProvider[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isInitialized, setIsInitialized] = useState(false);

    useEffect(() => {
        // Subscribe to active providers
        const unsubscribe = NetworkProviderService.subscribeToActiveNetworkProviders((providers) => {
            setAvailableProviders(providers);
            setIsLoading(false);

            // Auto-select first provider ONLY on initial load, not when user chooses "All"
            if (!isInitialized && providers.length > 0) {
                // Try to restore from localStorage if needed, or default to first
                const stored = localStorage.getItem('selectedNetworkProviderId');
                if (stored) {
                    const found = providers.find(p => p.id === stored);
                    if (found) {
                        setSelectedProvider(found);
                        setIsInitialized(true);
                        return;
                    }
                }
                setSelectedProvider(providers[0]);
                setIsInitialized(true);
            }
        });
        return () => unsubscribe();
    }, [isInitialized]);

    // Persist selection
    useEffect(() => {
        if (selectedProvider) {
            localStorage.setItem('selectedNetworkProviderId', selectedProvider.id);
        } else {
            // Clear localStorage when "All Sources" is selected
            localStorage.removeItem('selectedNetworkProviderId');
        }
    }, [selectedProvider]);

    return (
        <NetworkProviderContext.Provider value={{ selectedProvider, setSelectedProvider, availableProviders, isLoading }}>
            {children}
        </NetworkProviderContext.Provider>
    );
}

export function useNetworkProvider() {
    const context = useContext(NetworkProviderContext);
    if (context === undefined) {
        throw new Error('useNetworkProvider must be used within a NetworkProviderProvider');
    }
    return context;
}
