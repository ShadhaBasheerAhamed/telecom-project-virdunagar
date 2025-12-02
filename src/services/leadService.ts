import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  query, 
  orderBy 
} from '../firebase/config';
import { db } from '../firebase/config';
import type { Lead } from '../components/pages/Leads'; // Import Lead type

const LEADS_COLLECTION = 'leads';

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
      const leadRef = doc(db, LEADS_COLLECTION, id);
      await updateDoc(leadRef, updates);
    } catch (error) {
      console.error('Error updating lead:', error);
      throw error;
    }
  },

  deleteLead: async (id: string) => {
    try {
      await deleteDoc(doc(db, LEADS_COLLECTION, id));
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