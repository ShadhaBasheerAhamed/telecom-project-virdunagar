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
  },

  // --- PDF GENERATION METHODS (Frontend Mapped) ---
  generateCustomerReport: async (dataSource: string) => {
    try {
      const response = await api.get(`/reports/generate/customers?source=${dataSource}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `customers_${dataSource}_${new Date().toLocaleDateString()}.pdf`);
      document.body.appendChild(link);
      link.click();
      return { success: true };
    } catch (e) {
      console.error(e);
      return { success: false, message: "Generation failed" };
    }
  },

  generateComplaintsReport: async (dataSource: string) => {
    try {
      const response = await api.get(`/reports/generate/complaints?source=${dataSource}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `complaints_${dataSource}.pdf`);
      document.body.appendChild(link);
      link.click();
      return { success: true };
    } catch (e) {
      return { success: false };
    }
  },

  generateDailyCollection: async (dataSource: string) => {
    try {
      const response = await api.get(`/reports/generate/daily-collection?source=${dataSource}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `daily_collection_${dataSource}.pdf`);
      document.body.appendChild(link);
      link.click();
      return { success: true };
    } catch (e) {
      return { success: false };
    }
  },

  generateUnpaidReport: async (dataSource: string) => {
    try {
      const response = await api.get(`/reports/generate/unpaid?source=${dataSource}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `unpaid_report_${dataSource}.pdf`);
      document.body.appendChild(link);
      link.click();
      return { success: true };
    } catch (e) {
      return { success: false };
    }
  },

  generatePlanReport: async (dataSource: string) => {
    try {
      const response = await api.get(`/reports/generate/plans?source=${dataSource}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `plan_analysis_${dataSource}.pdf`);
      document.body.appendChild(link);
      link.click();
      return { success: true };
    } catch (e) {
      return { success: false };
    }
  },

  generateLeadsReport: async (dataSource: string) => {
    try {
      const response = await api.get(`/reports/generate/leads?source=${dataSource}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `leads_report_${dataSource}.pdf`);
      document.body.appendChild(link);
      link.click();
      return { success: true };
    } catch (e) {
      return { success: false };
    }
  },

  generateEmployeeReport: async () => {
    try {
      const response = await api.get(`/reports/generate/employees`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `employee_performance.pdf`);
      document.body.appendChild(link);
      link.click();
      return { success: true };
    } catch (e) {
      return { success: false };
    }
  },

  generateLowStockReport: async () => {
    try {
      const response = await api.get(`/reports/generate/low-stock`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `low_stock_report.pdf`);
      document.body.appendChild(link);
      link.click();
      return { success: true };
    } catch (e) {
      return { success: false };
    }
  }
};