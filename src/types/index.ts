// Payment interface
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
  validity?: string; // e.g., "30 Days", "1 Month"
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

// OLT IP specific fields
export interface OltIp extends MasterRecord {}

// Inventory Product
export interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  buyPrice: number;
  sellPrice: number;
  stock: number;
  unit: 'Nos' | 'Mtr'; 
  gst: number; // Percentage (e.g., 18)
  image: string; 
}

// --- SHARED CUSTOMER INTERFACE ---
export interface Customer {
  id: string;
  landline: string; // Unique Identifier
  name: string;
  mobileNo: string;
  altMobileNo: string;
  vlanId: string;
  bbId: string;
  voipPassword: string;
  
  // Dynamic Master Record Links
  ontMake: string; 
  ontType: string;
  ontMacAddress: string;
  ontBillNo: string;
  
  // ONT Status Logic
  ont: 'Paid ONT' | 'Free ONT' | 'Offer Price' | 'Rented ONT';
  offerPrize: string; // Only if 'Offer Price' is selected
  
  routerMake: string;
  routerMacId: string;
  oltIp: string; // Dropdown from Master Records
  
  installationDate: string;
  
  // Status Logic Update
  status: 'Active' | 'Inactive' | 'Suspended' | 'Expired'; 
  planStatus?: string; // e.g., "Plan Active", "Plan Expired"
  ottSubscription?: string; // New Field
  
  source: 'BSNL' | 'RMAX' | 'Private';
  email?: string;
  plan?: string;
}

export interface Lead {
  id: string;
  customerName: string;
  phoneNo: string;
  address: string;
  remarks: string;
  followupDate: string;
  status: 'Success' | 'Rejected' | 'Sale' | 'Pending';
  source: string;
}