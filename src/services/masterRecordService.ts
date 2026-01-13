import api from './api';

// Master record collection names mapping
const COLLECTION_MAPPING: { [key: string]: string } = {
  'routerMake': 'router_makes',
  'routerMac': 'router_macs',
  'ontMake': 'ont_makes',
  'ontType': 'ont_types',
  'ontMac': 'ont_macs',
  'plan': 'plans',
  'oltIp': 'olt_ips',
  'employee': 'employees',
  'department': 'departments',
  'designation': 'designations',
  'user': 'users',
  'ott': 'otts'
};

export class MasterRecordService {

  static async addRecord(type: string, record: any): Promise<void> {
    try {
      const collectionName = COLLECTION_MAPPING[type];
      if (!collectionName) {
        throw new Error(`Unknown record type: ${type}`);
      }

      const recordData = {
        ...record,
        status: record.status || 'Active'
      };

      await api.post(`/master-records/${collectionName}`, recordData);
    } catch (error) {
      console.error(`Error adding ${type} record:`, error);
      throw new Error(`Failed to add ${type} record`);
    }
  }

  static async updateRecord(type: string, id: string, record: any): Promise<void> {
    try {
      const collectionName = COLLECTION_MAPPING[type];
      if (!collectionName) throw new Error(`Unknown record type: ${type}`);

      await api.put(`/master-records/${collectionName}/${id}`, record);
    } catch (error) {
      console.error(`Error updating ${type} record:`, error);
      throw new Error(`Failed to update ${type} record`);
    }
  }

  static async deleteRecord(type: string, id: string): Promise<void> {
    try {
      const collectionName = COLLECTION_MAPPING[type];
      if (!collectionName) throw new Error(`Unknown record type: ${type}`);
      await api.delete(`/master-records/${collectionName}/${id}`);
    } catch (error) {
      console.error(`Error deleting ${type} record:`, error);
      throw new Error(`Failed to delete ${type} record`);
    }
  }

  static async getRecords(type: string): Promise<any[]> {
    try {
      const collectionName = COLLECTION_MAPPING[type];
      if (!collectionName) throw new Error(`Unknown record type: ${type}`);

      const response = await api.get(`/master-records/${collectionName}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching ${type} records:`, error);
      throw new Error(`Failed to fetch ${type} records`);
    }
  }

  static async getRecordsByStatus(type: string, status: string): Promise<any[]> {
    try {
      const collectionName = COLLECTION_MAPPING[type];
      if (!collectionName) throw new Error(`Unknown record type: ${type}`);

      const response = await api.get(`/master-records/${collectionName}?status=${status}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching ${type} records by status:`, error);
      throw new Error(`Failed to fetch ${type} records by status`);
    }
  }

  static validateRecord(type: string, record: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (!record.name || typeof record.name !== 'string' || record.name.trim().length === 0) {
      errors.push('Name/Value is required');
    }
    return { isValid: errors.length === 0, errors };
  }

  static calculatePlanTotal(price: number, gst: number): number {
    return parseFloat(((price * (1 + gst / 100))).toFixed(2));
  }
}