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

    useEffect(() => {
        // Subscribe to active providers
        const unsubscribe = NetworkProviderService.subscribeToActiveNetworkProviders((providers) => {
            setAvailableProviders(providers);
            setIsLoading(false);

            // Auto-select first provider if none selected and providers exist
            if (!selectedProvider && providers.length > 0) {
                // Try to restore from localStorage if needed, or default to first
                const stored = localStorage.getItem('selectedNetworkProviderId');
                if (stored) {
                    const found = providers.find(p => p.id === stored);
                    if (found) {
                        setSelectedProvider(found);
                        return;
                    }
                }
                setSelectedProvider(providers[0]);
            }
        });
        return () => unsubscribe();
    }, [selectedProvider]);

    // Persist selection
    useEffect(() => {
        if (selectedProvider) {
            localStorage.setItem('selectedNetworkProviderId', selectedProvider.id);
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
