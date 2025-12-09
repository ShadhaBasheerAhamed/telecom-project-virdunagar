import {
  collection,
  doc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp
} from '../firebase/config';
import { db } from '../firebase/config';
import type { NetworkProvider } from '../types';

const COLLECTION_NAME = 'network_providers';

export const NetworkProviderService = {

  // Get all providers (One-time fetch)
  getNetworkProviders: async (): Promise<NetworkProvider[]> => {
    try {
      const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as NetworkProvider));
    } catch (error) {
      console.error('Error fetching network providers:', error);
      return [];
    }
  },

  // Get active providers (One-time fetch)
  getActiveNetworkProviders: async (): Promise<NetworkProvider[]> => {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where('status', '==', 'Active'),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as NetworkProvider));
    } catch (error) {
      console.error('Error fetching active network providers:', error);
      return [];
    }
  },

  // Add Provider
  addNetworkProvider: async (providerData: Omit<NetworkProvider, 'id'>): Promise<string> => {
    try {
      // Auto-generate ID using addDoc
      const docRef = await addDoc(collection(db, COLLECTION_NAME), {
        ...providerData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error adding network provider:', error);
      throw error;
    }
  },

  // Update Provider
  updateNetworkProvider: async (id: string, updates: Partial<NetworkProvider>): Promise<void> => {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      // Verify existence or handle hybrid ID? 
      // We'll rely on Doc ID as per best practice for new service.
      // But to be safe against manual edits/legacy:
      await updateDoc(docRef, {
        ...updates,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating network provider:', error);
      throw error;
    }
  },

  // Delete Provider
  deleteNetworkProvider: async (id: string): Promise<void> => {
    try {
      await deleteDoc(doc(db, COLLECTION_NAME, id));
    } catch (error) {
      console.error('Error deleting network provider:', error);
      throw error;
    }
  },

  // Real-time Subscriptions
  subscribeToNetworkProviders: (callback: (providers: NetworkProvider[]) => void) => {
    const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const providers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as NetworkProvider));
      callback(providers);
    });
  },

  subscribeToActiveNetworkProviders: (callback: (providers: NetworkProvider[]) => void) => {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('status', '==', 'Active'),
      orderBy('createdAt', 'desc')
    );
    return onSnapshot(q, (snapshot) => {
      const providers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as NetworkProvider));
      callback(providers);
    });
  },

  // Validation Logic (Ported from Mock)
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