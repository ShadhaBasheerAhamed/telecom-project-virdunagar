import { MasterRecordService } from '../services/masterRecordService';
import { toast } from 'sonner';

export const seedDatabase = async () => {
  const initialData = {
    // 1. Router Makes
    routerMake: [
      { name: 'TP-LINK' },
      { name: 'D-Link' },
      { name: 'Tenda' },
      { name: 'Mercusys' }
    ],
    // 2. Router MACs (Examples)
    routerMac: [
      { name: 'AA:BB:CC:DD:EE:01', status: 'Active' },
      { name: 'AA:BB:CC:DD:EE:02', status: 'Active' },
      { name: 'AA:BB:CC:DD:EE:03', status: 'Active' }
    ],
    // 3. ONT Makes
    ontMake: [
      { name: 'HUAWEI' },
      { name: 'NOKIA' },
      { name: 'SYROTECH' },
      { name: 'ZTE' }
    ],
    // 4. ONT Types
    ontType: [
      { name: 'Dual Band' },
      { name: 'Single Band' },
      { name: 'XPON' },
      { name: 'EPON' }
    ],
    // 5. ONT MACs (Examples)
    ontMac: [
      { name: '11:22:33:44:55:01', status: 'Active' },
      { name: '11:22:33:44:55:02', status: 'Active' },
      { name: '11:22:33:44:55:03', status: 'Active' }
    ],
    // 6. Plans
    plan: [
      { name: 'FIBER ULTRA 999', price: 999, gst: 18, total: 1179 },
      { name: 'FIBER BASIC 499', price: 499, gst: 18, total: 589 },
      { name: 'FIBER VALUE 799', price: 799, gst: 18, total: 943 },
      { name: 'PREMIUM PLUS 1299', price: 1299, gst: 18, total: 1533 }
    ],
    // 7. OLT IPs
    oltIp: [
      { name: '192.168.1.50' },
      { name: '192.168.1.51' },
      { name: '10.215.10.1' }
    ],
    // 8. Departments
    department: [
      { name: 'Sales', head: 'Suresh', location: 'Main Branch' },
      { name: 'Technical', head: 'Ramesh', location: 'Main Branch' },
      { name: 'Accounts', head: 'Priya', location: 'Main Branch' }
    ],
    // 9. Designations
    designation: [
      { name: 'Senior Technician', department: 'Technical' },
      { name: 'Sales Executive', department: 'Sales' },
      { name: 'Field Engineer', department: 'Technical' },
      { name: 'Admin', department: 'Accounts' }
    ],
    // 10. Employees
    employee: [
      { 
        name: 'Rajesh Kumar', 
        mobile: '9876543210', 
        address: '12, Gandhi St, Madurai', 
        aadhaar: '123456789012',
        status: 'Active'
      }
    ],
    // 11. Initial Admin User (For Record purposes)
    user: [
      {
        name: 'admin',
        role: 'Super Admin',
        status: 'Active',
        lastLogin: new Date().toISOString()
      }
    ]
  };

  try {
    let count = 0;
    console.log("Starting Database Seed...");
    
    // Iterate over each category
    for (const [key, records] of Object.entries(initialData)) {
      console.log(`Seeding ${key}...`);
      
      // Process records in parallel for speed
      await Promise.all(
        records.map(async (record) => {
          try {
            await MasterRecordService.addRecord(key, record);
            count++;
          } catch (err) {
            console.warn(`Skipped duplicate or error for ${key}:`, err);
          }
        })
      );
    }

    console.log("Database Seed Completed!");
    toast.success(`Successfully added ${count} master records!`);
    return true;
  } catch (error) {
    console.error("Seeding failed:", error);
    toast.error("Failed to seed database");
    return false;
  }
};