import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
  orderBy,
  getDoc
} from '../firebase/config';
import { db } from '../firebase/config';
import type { Lead } from '../types'; // Import Lead type from types

const LEADS_COLLECTION = 'leads';


// Helper to avoid duplicate imports in snippet
const getDocFromRef = async (ref: any) => {
  const { getDoc } = await import('../firebase/config');
  return getDoc(ref);
};

export const LeadService = {

  addLead: async (lead: Omit<Lead, 'id'>) => {
    try {
      const docRef = await addDoc(collection(db, LEADS_COLLECTION), {
        ...lead,
        createdAt: new Date().toISOString()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error adding lead:', error);
      throw error;
    }
  },

  updateLead: async (id: string, updates: Partial<Lead>) => {
    try {
      // 1. Try Direct Method
      const leadRef = doc(db, LEADS_COLLECTION, id);
      const docSnap = await getDocFromRef(leadRef); // Helper or direct getDoc

      if (docSnap.exists()) {
        await updateDoc(leadRef, updates);
        return;
      }

      // 2. Try Query Method (fallback for legacy data)
      const q = query(collection(db, LEADS_COLLECTION), where('id', '==', id));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        await updateDoc(querySnapshot.docs[0].ref, updates);
      } else {
        console.warn(`Lead ${id} not found for update`);
      }
    } catch (error) {
      console.error('Error updating lead:', error);
      throw error;
    }
  },

  deleteLead: async (id: string) => {
    try {
      // 1. Try Direct Method
      const leadRef = doc(db, LEADS_COLLECTION, id);
      // We can check existence or just try delete (delete non-existing is fine in some cases, but here we want to be sure).
      // But for robust "Find by ID field":

      const docSnap = await getDocFromRef(leadRef);
      if (docSnap.exists()) {
        await deleteDoc(leadRef);
        return;
      }

      // 2. Query fallback
      const q = query(collection(db, LEADS_COLLECTION), where('id', '==', id));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        await deleteDoc(querySnapshot.docs[0].ref);
      } else {
        console.warn(`Lead ${id} not found for delete`);
      }
    } catch (error) {
      console.error('Error deleting lead:', error);
      throw error;
    }
  },

  getLeads: async (): Promise<Lead[]> => {
    try {
      const q = query(collection(db, LEADS_COLLECTION), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Lead));
    } catch (error) {
      console.error('Error fetching leads:', error);
      return [];
    }
  }
};