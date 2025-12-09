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
  'routerMac': 'router_macs',
  'ontMake': 'ont_makes',
  'ontType': 'ont_types',
  'ontMac': 'ont_macs',
  'plan': 'plans',
  'oltIp': 'olt_ips',
  'employee': 'employees',
  'department': 'departments',
  'designation': 'designations',
  'user': 'users'
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
        status: record.status || 'Active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await addDoc(collection(db, collectionName), recordData);
    } catch (error) {
      console.error(`Error adding ${type} record:`, error);
      throw new Error(`Failed to add ${type} record`);
    }
  }

  static async updateRecord(type: string, id: string, record: any): Promise<void> {
    try {
      const collectionName = COLLECTION_MAPPING[type];
      if (!collectionName) throw new Error(`Unknown record type: ${type}`);

      const recordRef = doc(db, collectionName, id);
      await updateDoc(recordRef, {
        ...record,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error(`Error updating ${type} record:`, error);
      throw new Error(`Failed to update ${type} record`);
    }
  }

  static async deleteRecord(type: string, id: string): Promise<void> {
    try {
      const collectionName = COLLECTION_MAPPING[type];
      if (!collectionName) throw new Error(`Unknown record type: ${type}`);
      await deleteDoc(doc(db, collectionName, id));
    } catch (error) {
      console.error(`Error deleting ${type} record:`, error);
      throw new Error(`Failed to delete ${type} record`);
    }
  }

  static async getRecords(type: string): Promise<any[]> {
    try {
      const collectionName = COLLECTION_MAPPING[type];
      if (!collectionName) throw new Error(`Unknown record type: ${type}`);

      const q = query(collection(db, collectionName), orderBy('name', 'asc'));
      const querySnapshot = await getDocs(q);
      
      const records: any[] = [];
      querySnapshot.forEach((doc) => {
        records.push({ id: doc.id, ...doc.data() });
      });
      
      return records;
    } catch (error) {
      console.error(`Error fetching ${type} records:`, error);
      throw new Error(`Failed to fetch ${type} records`);
    }
  }

  static async getRecordsByStatus(type: string, status: string): Promise<any[]> {
    try {
      const collectionName = COLLECTION_MAPPING[type];
      if (!collectionName) throw new Error(`Unknown record type: ${type}`);

      const q = query(collection(db, collectionName), where('status', '==', status), orderBy('name', 'asc'));
      const querySnapshot = await getDocs(q);
      
      const records: any[] = [];
      querySnapshot.forEach((doc) => {
        records.push({ id: doc.id, ...doc.data() });
      });
      
      return records;
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