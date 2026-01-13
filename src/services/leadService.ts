import api from './api';
import type { Lead } from '../types';

export const LeadService = {

  addLead: async (lead: Omit<Lead, 'id'>) => {
    try {
      const response = await api.post('/leads', lead);
      return response.data.id;
    } catch (error) {
      console.error('Error adding lead:', error);
      throw error;
    }
  },

  updateLead: async (id: string, updates: Partial<Lead>) => {
    try {
      await api.put(`/leads/${id}`, updates);
    } catch (error) {
      console.error('Error updating lead:', error);
      throw error;
    }
  },

  deleteLead: async (id: string) => {
    try {
      await api.delete(`/leads/${id}`);
    } catch (error) {
      console.error('Error deleting lead:', error);
      throw error;
    }
  },

  getLeads: async (): Promise<Lead[]> => {
    try {
      const response = await api.get('/leads');
      return response.data;
    } catch (error) {
      console.error('Error fetching leads:', error);
      return [];
    }
  }
};
