import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  query, 
  where, 
  orderBy 
} from '../firebase/config';
import { db } from '../firebase/config';

// Master record collection names mapping
const COLLECTION_MAPPING: { [key: string]: string } = {
  'routerMake': 'router_makes',
  'ontMake': 'ont_makes', 
  'ontType': 'ont_types',
  'plan': 'plans',
  'oltIp': 'olt_ips',
  'employee': 'employees',
  'department': 'departments',
  'designation': 'designations',
  'user': 'users'
};

export class MasterRecordService {
  
  /**
   * Add a new master record to Firebase
   */
  static async addRecord(type: string, record: any): Promise<void> {
    try {
      const collectionName = COLLECTION_MAPPING[type];
      if (!collectionName) {
        throw new Error(`Unknown record type: ${type}`);
      }

      // Auto-generate ID if not provided
      const recordData = {
        ...record,
        id: record.id || this.generateId(type),
        status: record.status || 'Active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await addDoc(collection(db, collectionName), recordData);
      console.log(`${type} record added successfully`);
    } catch (error) {
      console.error(`Error adding ${type} record:`, error);
      throw new Error(`Failed to add ${type} record`);
    }
  }

  /**
   * Update an existing master record
   */
  static async updateRecord(type: string, id: string, record: any): Promise<void> {
    try {
      const collectionName = COLLECTION_MAPPING[type];
      if (!collectionName) {
        throw new Error(`Unknown record type: ${type}`);
      }

      const recordRef = doc(db, collectionName, id);
      await updateDoc(recordRef, {
        ...record,
        updatedAt: new Date().toISOString()
      });
      console.log(`${type} record updated successfully`);
    } catch (error) {
      console.error(`Error updating ${type} record:`, error);
      throw new Error(`Failed to update ${type} record`);
    }
  }

  /**
   * Delete a master record
   */
  static async deleteRecord(type: string, id: string): Promise<void> {
    try {
      const collectionName = COLLECTION_MAPPING[type];
      if (!collectionName) {
        throw new Error(`Unknown record type: ${type}`);
      }

      await deleteDoc(doc(db, collectionName, id));
      console.log(`${type} record deleted successfully`);
    } catch (error) {
      console.error(`Error deleting ${type} record:`, error);
      throw new Error(`Failed to delete ${type} record`);
    }
  }

  /**
   * Get all records of a specific type
   */
  static async getRecords(type: string): Promise<any[]> {
    try {
      const collectionName = COLLECTION_MAPPING[type];
      if (!collectionName) {
        throw new Error(`Unknown record type: ${type}`);
      }

      const q = query(
        collection(db, collectionName),
        orderBy('name', 'asc')
      );
      
      const querySnapshot = await getDocs(q);
      
      const records: any[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        records.push({
          id: doc.id,
          ...data
        });
      });
      
      return records;
    } catch (error) {
      console.error(`Error fetching ${type} records:`, error);
      throw new Error(`Failed to fetch ${type} records`);
    }
  }

  /**
   * Search records by a specific field
   */
  static async searchRecords(type: string, searchTerm: string, searchField: string = 'name'): Promise<any[]> {
    try {
      const allRecords = await this.getRecords(type);
      
      if (!searchTerm.trim()) {
        return allRecords;
      }

      const term = searchTerm.toLowerCase();
      return allRecords.filter(record => 
        String(record[searchField] || '').toLowerCase().includes(term)
      );
    } catch (error) {
      console.error(`Error searching ${type} records:`, error);
      throw new Error(`Failed to search ${type} records`);
    }
  }

  /**
   * Get records by status
   */
  static async getRecordsByStatus(type: string, status: string): Promise<any[]> {
    try {
      const collectionName = COLLECTION_MAPPING[type];
      if (!collectionName) {
        throw new Error(`Unknown record type: ${type}`);
      }

      const q = query(
        collection(db, collectionName),
        where('status', '==', status),
        orderBy('name', 'asc')
      );
      
      const querySnapshot = await getDocs(q);
      
      const records: any[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        records.push({
          id: doc.id,
          ...data
        });
      });
      
      return records;
    } catch (error) {
      console.error(`Error fetching ${type} records by status:`, error);
      throw new Error(`Failed to fetch ${type} records by status`);
    }
  }

  /**
   * Validate record data based on type
   */
  static validateRecord(type: string, record: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Common validations
    if (!record.name || typeof record.name !== 'string' || record.name.trim().length === 0) {
      errors.push('Name is required and must be a non-empty string');
    }

    // Type-specific validations
    switch (type) {
      case 'plan':
        if (!record.price || isNaN(record.price) || record.price < 0) {
          errors.push('Price must be a valid positive number');
        }
        if (!record.gst || isNaN(record.gst) || record.gst < 0 || record.gst > 100) {
          errors.push('GST must be a valid percentage between 0 and 100');
        }
        if (!record.total || isNaN(record.total) || record.total < 0) {
          errors.push('Total must be a valid positive number');
        }
        break;

      case 'employee':
        if (!record.mobile || !/^\d{10}$/.test(record.mobile)) {
          errors.push('Mobile number must be exactly 10 digits');
        }
        if (!record.aadhaar || !/^\d{12}$/.test(record.aadhaar)) {
          errors.push('Aadhaar number must be exactly 12 digits');
        }
        if (!record.address || record.address.trim().length === 0) {
          errors.push('Address is required');
        }
        break;

      case 'oltIp':
        if (!record.name || !this.isValidIP(record.name)) {
          errors.push('Name must be a valid IP address or description');
        }
        break;

      case 'designation':
        if (!record.department || record.department.trim().length === 0) {
          errors.push('Department is required');
        }
        break;

      case 'user':
        if (!record.role || record.role.trim().length === 0) {
          errors.push('Role is required');
        }
        break;
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Generate a unique ID for a record type
   */
  static generateId(type: string): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    
    switch (type) {
      case 'routerMake':
      case 'ontMake':
      case 'ontType':
      case 'oltIp':
        return `${timestamp}`;
      
      case 'plan':
        return `${Math.floor(Math.random() * 90) + 10}`; // 2-digit plan ID
      
      case 'employee':
      case 'department':
      case 'designation':
        return `${Math.floor(Math.random() * 999) + 1}`;
      
      case 'user':
        return `USR-${String(timestamp).slice(-6)}`;
      
      default:
        return `ID-${timestamp}`;
    }
  }

  /**
   * Auto-calculate total for plan records
   */
  static calculatePlanTotal(price: number, gst: number): number {
    return parseFloat(((price * (1 + gst / 100))).toFixed(2));
  }

  /**
   * Check if a string is a valid IP address
   */
  private static isValidIP(ip: string): boolean {
    const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    return ipRegex.test(ip);
  }

  /**
   * Get record type statistics
   */
  static async getRecordStats(type: string): Promise<{
    total: number;
    active: number;
    inactive: number;
  }> {
    try {
      const records = await this.getRecords(type);
      
      const total = records.length;
      const active = records.filter(r => r.status === 'Active').length;
      const inactive = records.filter(r => r.status === 'Inactive').length;

      return { total, active, inactive };
    } catch (error) {
      console.error(`Error calculating ${type} stats:`, error);
      return { total: 0, active: 0, inactive: 0 };
    }
  }

  /**
   * Bulk operations for multiple records
   */
  static async addMultipleRecords(type: string, records: any[]): Promise<void> {
    try {
      const promises = records.map(record => this.addRecord(type, record));
      await Promise.all(promises);
      console.log(`Successfully added ${records.length} ${type} records`);
    } catch (error) {
      console.error(`Error adding multiple ${type} records:`, error);
      throw new Error(`Failed to add multiple ${type} records`);
    }
  }

  /**
   * Import records from CSV or JSON data
   */
  static async importRecords(type: string, data: any[]): Promise<{ success: number; failed: number; errors: string[] }> {
    let success = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const record of data) {
      try {
        const validation = this.validateRecord(type, record);
        if (!validation.isValid) {
          errors.push(...validation.errors.map(err => `Record ${record.name || record.id}: ${err}`));
          failed++;
          continue;
        }

        await this.addRecord(type, record);
        success++;
      } catch (error) {
        errors.push(`Record ${record.name || record.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        failed++;
      }
    }

    return { success, failed, errors };
  }
}