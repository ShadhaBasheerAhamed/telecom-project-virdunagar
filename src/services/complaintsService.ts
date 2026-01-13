import api from './api';
import type { Complaint } from '../components/pages/Complaints';

export const ComplaintsService = {

  // 1. Add Complaint
  addComplaint: async (complaint: Omit<Complaint, 'id'>) => {
    try {
      const response = await api.post('/complaints', complaint);
      return response.data.id;
    } catch (error) {
      console.error('Error adding complaint:', error);
      throw error;
    }
  },

  // 2. Update Complaint
  updateComplaint: async (id: string, updates: Partial<Complaint>) => {
    try {
      await api.put(`/complaints/${id}`, updates);
    } catch (error) {
      console.error('Error updating complaint:', error);
      throw error;
    }
  },

  // 3. Delete Complaint
  deleteComplaint: async (id: string) => {
    try {
      await api.delete(`/complaints/${id}`);
    } catch (error) {
      console.error('Error deleting complaint:', error);
      throw error;
    }
  },

  // 4. Get All Complaints
  getComplaints: async (): Promise<Complaint[]> => {
    try {
      const response = await api.get('/complaints');
      return response.data;
    } catch (error) {
      console.error('Error fetching complaints:', error);
      return [];
    }
  }
};