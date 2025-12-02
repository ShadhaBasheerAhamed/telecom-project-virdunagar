import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  query, 
  orderBy,
  limit 
} from '../firebase/config';
import { db } from '../firebase/config';
import type { Complaint } from '../components/pages/Complaints'; // Assuming types are updated

const COMPLAINTS_COLLECTION = 'complaints';

export const ComplaintsService = {
  
  addComplaint: async (complaint: Omit<Complaint, 'id'>) => {
    try {
      const docRef = await addDoc(collection(db, COMPLAINTS_COLLECTION), {
        ...complaint,
        createdAt: new Date().toISOString()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error adding complaint:', error);
      throw error;
    }
  },

  updateComplaint: async (id: string, updates: Partial<Complaint>) => {
    try {
      const ref = doc(db, COMPLAINTS_COLLECTION, id);
      await updateDoc(ref, updates);
    } catch (error) {
      console.error('Error updating complaint:', error);
      throw error;
    }
  },

  deleteComplaint: async (id: string) => {
    try {
      await deleteDoc(doc(db, COMPLAINTS_COLLECTION, id));
    } catch (error) {
      console.error('Error deleting complaint:', error);
      throw error;
    }
  },

  getComplaints: async (): Promise<Complaint[]> => {
    try {
      const q = query(collection(db, COMPLAINTS_COLLECTION), orderBy('createdAt', 'desc'), limit(500));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Complaint));
    } catch (error) {
      console.error('Error fetching complaints:', error);
      return [];
    }
  }
};