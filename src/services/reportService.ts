import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase/config';

interface jsPDFWithAutoTable extends jsPDF {
  lastAutoTable: { finalY: number };
}

const formatDate = (date: any) => {
  if (!date) return '-';
  if (date.toDate) return date.toDate().toLocaleDateString();
  return date.split('T')[0]; // Handle ISO strings
};

export const ReportService = {
  
  createPdfDoc: (title: string, source: string): jsPDFWithAutoTable => {
    const doc = new jsPDF() as jsPDFWithAutoTable;
    const pageWidth = doc.internal.pageSize.getWidth();

    // Header
    doc.setFillColor(41, 128, 185); 
    doc.rect(0, 0, pageWidth, 40, 'F');
    
    doc.setFontSize(22);
    doc.setTextColor(255, 255, 255);
    doc.text("SPT TELECOM", 14, 18);
    
    doc.setFontSize(12);
    doc.text(`Source: ${source} Report`, 14, 26);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 34);

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(16);
    doc.text(title, 14, 55);

    return doc;
  },

  // --- 1. GENERAL CUSTOMER REPORT ---
  generateCustomerReport: async (source: string) => {
    try {
      const doc = ReportService.createPdfDoc('Customer Status Report', source);
      const customersRef = collection(db, 'customers');
      
      let q = query(customersRef, orderBy('createdAt', 'desc'));
      if (source !== 'All') {
        q = query(customersRef, where('source', '==', source));
      }

      const snapshot = await getDocs(q);
      if (snapshot.empty) return { success: false, message: 'No customers found' };

      const rows = snapshot.docs.map(doc => {
        const d = doc.data() as any;
        return [d.name, d.landline || d.landlineNo || '-', d.mobileNo || '-', d.plan || '-', d.status];
      });

      autoTable(doc, {
        startY: 65,
        head: [['Name', 'Landline', 'Mobile', 'Plan', 'Status']],
        body: rows,
        theme: 'striped',
        headStyles: { fillColor: [41, 128, 185] },
      });

      doc.save(`${source}_Customer_Report.pdf`);
      return { success: true };
    } catch (error) {
      console.error(error);
      return { success: false, message: 'DB Error' };
    }
  },

  // --- 2. DAILY COLLECTION REPORT (FIXED) ---
  generateDailyCollection: async (source: string) => {
    try {
      const doc = ReportService.createPdfDoc("Today's Collection Report", source);
      
      // Get Today's Date
      const today = new Date();
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const dd = String(today.getDate()).padStart(2, '0');
      const yyyy = today.getFullYear();
      
      // Formats to check against DB
      const todaySlash = `${mm}/${dd}/${yyyy}`; // "12/26/2025"
      const todayHyphen = `${yyyy}-${mm}-${dd}`; // "2025-12-26"
      
      const payRef = collection(db, 'payments');
      let q = query(payRef, where('status', '==', 'Paid')); 
      if (source !== 'All') {
         q = query(payRef, where('status', '==', 'Paid'), where('source', '==', source));
      }

      const snapshot = await getDocs(q);
      const rows: any[] = [];
      let total = 0;

      snapshot.docs.forEach(doc => {
        const d = doc.data() as any;
        const dbDate = d.paidDate || d.date || '';
        
        // Flexible Date Check
        if (dbDate.includes(todaySlash) || dbDate.includes(todayHyphen)) {
            rows.push([d.customerName, d.modeOfPayment, `Rs.${d.billAmount}`]);
            total += Number(d.billAmount || 0);
        }
      });

      if (rows.length === 0) {
          doc.setTextColor(255, 0, 0);
          doc.text(`No payments found for date: ${todaySlash}`, 14, 70);
          doc.save(`${source}_Daily_Collection.pdf`);
          return { success: true, message: 'Report generated (No Data)' };
      }

      autoTable(doc, {
        startY: 65,
        head: [['Customer', 'Mode', 'Amount']],
        body: rows,
        theme: 'grid',
        headStyles: { fillColor: [46, 204, 113] }, // Green
      });

      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text(`Total Collection: Rs. ${total}`, 14, doc.lastAutoTable.finalY + 15);

      doc.save(`${source}_Daily_Collection.pdf`);
      return { success: true };
    } catch (error) {
      return { success: false, message: 'DB Error' };
    }
  },

  // --- 3. UNPAID INVOICES ---
  generateUnpaidReport: async (source: string) => {
    try {
      const doc = ReportService.createPdfDoc('Unpaid Invoices Report', source);
      const paymentsRef = collection(db, 'payments');
      let q = query(paymentsRef, where('status', '==', 'Unpaid'));
      
      if (source !== 'All') {
         q = query(paymentsRef, where('status', '==', 'Unpaid'), where('source', '==', source));
      }

      const snapshot = await getDocs(q);
      if (snapshot.empty) return { success: false, message: 'No unpaid invoices found!' };

      const rows = snapshot.docs.map(doc => {
        const d = doc.data() as any;
        return [d.customerName, d.mobileNo || '-', `Rs.${d.billAmount}`, d.dueDate || 'Overdue'];
      });

      autoTable(doc, {
        startY: 65,
        head: [['Customer', 'Contact', 'Amount Due', 'Due Date']],
        body: rows,
        theme: 'grid',
        headStyles: { fillColor: [192, 57, 43] }, // Red
      });

      doc.save(`Unpaid_${source}_Report.pdf`);
      return { success: true };
    } catch (error) {
      return { success: false, message: 'DB Error' };
    }
  },

  // --- 4. OPEN COMPLAINTS ---
  generateComplaintsReport: async (source: string) => {
    try {
      const doc = ReportService.createPdfDoc(`${source} Open Complaints`, source);
      const compRef = collection(db, 'complaints');
      
      let q = query(compRef, where('status', 'in', ['Open', 'Pending', 'Not Resolved']));
      if (source !== 'All') {
        q = query(compRef, where('source', '==', source), where('status', 'in', ['Open', 'Pending', 'Not Resolved']));
      }
      
      const snapshot = await getDocs(q);
      if (snapshot.empty) return { success: false, message: 'No open complaints found.' };

      const rows = snapshot.docs.map(doc => {
        const d = doc.data() as any;
        return [d.customerName, d.address || 'No Address', d.complaints, d.status];
      });

      autoTable(doc, {
        startY: 65,
        head: [['Customer', 'Address', 'Issue', 'Status']],
        body: rows,
        theme: 'grid',
        headStyles: { fillColor: [243, 156, 18] },
        columnStyles: { 1: { cellWidth: 60 }, 2: { cellWidth: 60 } }
      });

      doc.save(`${source}_Complaints_List.pdf`);
      return { success: true };
    } catch (error) {
      return { success: false, message: 'DB Error' };
    }
  },

  // --- 5. PLAN POPULARITY ---
  generatePlanReport: async (source: string) => {
    try {
        const doc = ReportService.createPdfDoc('Plan Popularity Analysis', source);
        const custRef = collection(db, 'customers');
        let q = query(custRef);
        if (source !== 'All') q = query(custRef, where('source', '==', source));

        const snapshot = await getDocs(q);
        if (snapshot.empty) return { success: false, message: 'No data' };

        const planCounts: Record<string, number> = {};
        snapshot.docs.forEach(doc => {
            const d = doc.data() as any;
            const p = d.plan || 'Unknown';
            planCounts[p] = (planCounts[p] || 0) + 1;
        });

        const rows = Object.entries(planCounts)
            .sort(([,a], [,b]) => b - a)
            .map(([plan, count]) => [plan, count]);

        autoTable(doc, {
            startY: 65,
            head: [['Plan Name', 'Active Customers']],
            body: rows,
            theme: 'striped',
            headStyles: { fillColor: [52, 152, 219] },
        });

        doc.save(`${source}_Plan_Analysis.pdf`);
        return { success: true };
    } catch (error) {
        return { success: false, message: 'DB Error' };
    }
  },

  // --- 6. LEADS ANALYSIS ---
  generateLeadsReport: async (source: string) => {
    try {
        const doc = ReportService.createPdfDoc('Leads Conversion Report', source);
        const leadsRef = collection(db, 'leads');
        let q = query(leadsRef);
        if (source !== 'All') q = query(leadsRef, where('source', '==', source));

        const snapshot = await getDocs(q);
        if (snapshot.empty) return { success: false, message: 'No leads data' };

        const rows = snapshot.docs.map(doc => {
            const d = doc.data() as any;
            return [d.name, d.mobileNo || '-', d.status, formatDate(d.createdAt)];
        });

        autoTable(doc, {
            startY: 65,
            head: [['Lead Name', 'Mobile', 'Status', 'Date']],
            body: rows,
            theme: 'grid',
            headStyles: { fillColor: [155, 89, 182] }, // Purple
        });

        doc.save(`${source}_Leads_Report.pdf`);
        return { success: true };
    } catch (error) {
        return { success: false, message: 'DB Error' };
    }
  },

  // --- 7. LOW STOCK (FIXED ARGUMENT) ---
  generateLowStockReport: async (source: string = 'Global') => { // ✅ Added default argument
    try {
      const doc = ReportService.createPdfDoc('Low Stock Inventory Alert', source);
      
      const prodRef = collection(db, 'products');
      const q = query(prodRef, where('stock', '<', 10));
      const snapshot = await getDocs(q);

      if (snapshot.empty) return { success: false, message: 'Stock levels are healthy.' };

      const rows = snapshot.docs.map(doc => {
        const d = doc.data() as any;
        return [d.name, d.category, `${d.stock} ${d.unit}`, `Rs.${d.buyPrice}`];
      });

      autoTable(doc, {
        startY: 65,
        head: [['Product', 'Category', 'Current Stock', 'Buy Price']],
        body: rows,
        theme: 'grid',
        headStyles: { fillColor: [231, 76, 60] }, // Red
      });

      doc.save(`Low_Stock_Report.pdf`);
      return { success: true };
    } catch (error) {
      return { success: false, message: 'DB Error' };
    }
  },

  // --- 8. EMPLOYEE PERFORMANCE (FIXED ARGUMENT) ---
  generateEmployeeReport: async (source: string = 'Global') => { // ✅ Added default argument
    try {
        const doc = ReportService.createPdfDoc('Employee Performance (Resolved)', source);
        
        const compRef = collection(db, 'complaints');
        const q = query(compRef, where('status', '==', 'Resolved'));
        const snapshot = await getDocs(q);

        const employeeStats: Record<string, number> = {};

        snapshot.docs.forEach(doc => {
            const d = doc.data() as any;
            if (d.employee) {
                employeeStats[d.employee] = (employeeStats[d.employee] || 0) + 1;
            }
        });

        const rows = Object.entries(employeeStats).map(([name, count]) => [name, count]);

        if (rows.length === 0) return { success: false, message: 'No resolved complaints found.' };

        autoTable(doc, {
            startY: 65,
            head: [['Employee Name', 'Complaints Resolved']],
            body: rows,
            theme: 'striped',
            headStyles: { fillColor: [155, 89, 182] }, // Purple
        });

        doc.save('Employee_Performance.pdf');
        return { success: true };
    } catch (error) {
        return { success: false, message: 'DB Error' };
    }
  }
};