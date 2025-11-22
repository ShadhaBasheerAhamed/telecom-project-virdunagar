// Payment interface moved from component to shared types
export interface Payment {
  id: string;
  landlineNo: string;
  customerName: string;
  rechargePlan: string;
  duration: string;
  billAmount: number;
  commission: number;
  status: 'Paid' | 'Unpaid';
  paidDate: string;
  modeOfPayment: string;
  renewalDate: string;
  source: string;
  createdAt?: string;
  updatedAt?: string;
}

// Common master record types
export interface MasterRecord {
  id: string;
  name: string;
  status: 'Active' | 'Inactive';
  createdAt?: string;
  updatedAt?: string;
}

// Plan specific fields
export interface Plan extends MasterRecord {
  price: number;
  gst: number;
  total: number;
}

// Employee specific fields
export interface Employee extends MasterRecord {
  mobile: string;
  address: string;
  aadhaar: string;
}

// Department specific fields
export interface Department extends MasterRecord {
  head: string;
  location: string;
}

// Designation specific fields
export interface Designation extends MasterRecord {
  department: string;
}

// User specific fields
export interface User extends MasterRecord {
  role: string;
  lastLogin: string;
}

// OLT IP specific fields (already in base MasterRecord)
export interface OltIp extends MasterRecord {}

// --- NEW: Shared Customer Interface ---
export interface Customer {
  id: string;
  landline: string;
  name: string;
  mobileNo: string;
  altMobileNo: string;
  vlanId: string;
  bbId: string;
  voipPassword: string;
  ontMake: string;
  ontType: string;
  ontMacAddress: string;
  ontBillNo: string;
  ont: string;
  offerPrize: string;
  routerMake: string;
  routerMacId: string;
  oltIp: string;
  installationDate: string;
  status: string;
  source: string;
  email?: string;
  plan?: string;
}