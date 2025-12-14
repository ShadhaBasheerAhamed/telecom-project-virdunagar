import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase/config';

export class DashboardDataService {

  // --- HELPER: Get Date Boundaries ---
  private static getDateBoundaries(date: Date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    
    // Start of Selected Day
    const startOfDay = new Date(d);
    
    // End of Selected Day
    const endOfDay = new Date(d);
    endOfDay.setHours(23, 59, 59, 999);

    // "YYYY-MM-DD" String for Payments (Local Time)
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`; 

    return { startOfDay, endOfDay, dateString };
  }

  // --- HELPER: Zero Data ---
  private static getZeroData() {
      return {
          customerStats: { total: 0, active: 0, expired: 0, suspended: 0, disabled: 0 },
          financeData: { pendingInvoices: 0, todayCollected: 0, onlineCollected: 0, offlineCollected: 0, monthlyRevenue: 0, totalPendingValue: 0 },
          registrationsData: [],
          renewalsData: [],
          expiredData: [],
          complaintsData: [{ name: 'Open', value: 0 }, { name: 'Resolved', value: 0 }, { name: 'Pending', value: 0 }],
          invoicePaymentsData: []
      };
  }

  // === MAIN FUNCTION ===
  static async generateChartData(selectedDate: Date = new Date()) {
    
    // 1. STRICT FUTURE DATE CHECK
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const checkDate = new Date(selectedDate);
    checkDate.setHours(0, 0, 0, 0);

    if (checkDate > today) {
        return this.getZeroData();
    }

    const { startOfDay, endOfDay, dateString } = this.getDateBoundaries(selectedDate);

    try {
        // --- 2. FETCH DATA ---
        const custColl = collection(db, 'customers');
        const payColl = collection(db, 'payments');
        
        // Fetch ALL customers
        const custSnap = await getDocs(custColl);
        
        // Fetch Payments for specific date string
        const paySnap = await getDocs(query(payColl, where('paidDate', '==', dateString)));

        // --- 3. FILTER CUSTOMERS (JS Logic) ---
        let total = 0;
        let active = 0;
        let suspended = 0;
        let newToday = 0;
        let disabled = 0;

        custSnap.forEach(doc => {
            const data = doc.data();
            const createdDate = new Date(data.createdAt || Date.now()); 

            // Count if created BEFORE or ON selected date
            if (createdDate <= endOfDay) {
                total++; 

                // Status Check
                const status = (data.status || '').toLowerCase();
                if (status === 'active') active++;
                else if (status === 'suspended') suspended++;
                else if (status === 'disabled' || status === 'inactive') disabled++;

                // New Customer ONLY for selected day
                if (createdDate >= startOfDay && createdDate <= endOfDay) {
                    newToday++;
                }
            }
        });

        const expired = Math.max(0, total - (active + suspended + disabled));

        // --- 4. PROCESS PAYMENTS ---
        let todayCollected = 0;
        let online = 0;
        let offline = 0;

        paySnap.forEach(doc => {
             const data = doc.data();
             const amt = Number(data.billAmount || 0);
             todayCollected += amt;
             
             const mode = (data.modeOfPayment || 'CASH').toUpperCase();
             if(['ONLINE', 'UPI', 'BSNL PAYMENT', 'GPAY', 'PHONEPE', 'GOOGLE PAY'].includes(mode)) {
                 online += amt;
             } else {
                 offline += amt;
             }
        });

        // --- 5. COMPLAINTS (Stubbed) ---
        const open = 0;
        const resolved = 0;
        const pending = 0;

        return {
            customerStats: { total, active, expired, suspended, disabled },
            financeData: { 
                pendingInvoices: 0, 
                todayCollected, 
                onlineCollected: online, 
                offlineCollected: offline, 
                monthlyRevenue: 0, 
                totalPendingValue: 0 
            },
            registrationsData: [{ day: selectedDate.getDate(), value: newToday }],
            renewalsData: [], 
            expiredData: [],
            complaintsData: [
                { name: 'Open', value: open },
                { name: 'Resolved', value: resolved },
                { name: 'Pending', value: pending }
            ],
            invoicePaymentsData: [
                { name: 'Selected Day', online: online, offline: offline, direct: 0 }
            ]
        };

    } catch (error) {
        console.error("Dashboard Data Error:", error);
        return this.getZeroData();
    }
  }
}