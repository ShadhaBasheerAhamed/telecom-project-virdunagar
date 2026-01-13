import api from './api';

export const ReportService = {

  getSummary: async (startDate?: string, endDate?: string): Promise<any> => {
    try {
      let url = '/reports/summary';
      if (startDate && endDate) {
        url += `?start_date=${startDate}&end_date=${endDate}`;
      }
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching report summary:', error);
      return null;
    }
  },

  getRevenueReport: async (startDate?: string, endDate?: string, groupBy: 'day' | 'month' | 'year' = 'day'): Promise<any[]> => {
    try {
      let url = `/reports/revenue?group_by=${groupBy}`;
      if (startDate && endDate) {
        url += `&start_date=${startDate}&end_date=${endDate}`;
      }
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching revenue report:', error);
      return [];
    }
  },

  getCustomerReport: async (status?: string, source?: string): Promise<any[]> => {
    try {
      let url = '/reports/customers';
      const params = new URLSearchParams();
      if (status) params.append('status', status);
      if (source) params.append('source', source);

      if (params.toString()) url += `?${params.toString()}`;

      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching customer report:', error);
      return [];
    }
  },

  getPaymentReport: async (startDate?: string, endDate?: string, status?: string): Promise<any[]> => {
    try {
      let url = '/reports/payments';
      const params = new URLSearchParams();
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);
      if (status) params.append('status', status);

      if (params.toString()) url += `?${params.toString()}`;

      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching payment report:', error);
      return [];
    }
  }
};