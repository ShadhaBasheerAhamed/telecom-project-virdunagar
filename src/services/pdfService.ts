import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Payment, Customer } from '../types';

export const PDFService = {
  generateInvoice: (payment: Payment, customer: Customer) => {
    const doc = new jsPDF();

    // --- HEADER (Blue Bar) ---
    doc.setFillColor(0, 102, 204); // SPT Blue
    doc.rect(0, 0, 210, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text('SPT TELECOM SERVICES', 105, 18, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text('High Speed Internet | Fiber | Broadband', 105, 26, { align: 'center' });
    doc.text('Support: +91-9876543210 | Email: support@spttelecom.com', 105, 32, { align: 'center' });

    // --- CUSTOMER & INVOICE DETAILS ---
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);

    const startY = 50;
    
    // Left Side: Customer Info
    doc.setFont("helvetica", "bold");
    doc.text("BILL TO:", 14, startY);
    doc.setFont("helvetica", "normal");
    doc.text(customer.name.toUpperCase(), 14, startY + 6);
    doc.text(`Landline: ${payment.landlineNo}`, 14, startY + 12);
    doc.text(`Mobile: ${payment.mobileNo || customer.mobileNo || '-'}`, 14, startY + 18);
    doc.text(`Email: ${payment.email || customer.email || '-'}`, 14, startY + 24);
    // if(customer.address) doc.text(customer.address, 14, startY + 24);

    // Right Side: Invoice Info
    doc.setFont("helvetica", "bold");
    doc.text("INVOICE DETAILS:", 140, startY);
    doc.setFont("helvetica", "normal");
    doc.text(`Invoice No: INV-${payment.id.slice(-6).toUpperCase()}`, 140, startY + 6);
    doc.text(`Date: ${payment.paidDate}`, 140, startY + 12);
    doc.text(`Bill Period: ${payment.duration}`, 140, startY + 18);
    doc.text(`Next Renewal: ${payment.renewalDate}`, 140, startY + 24);

    // --- BILLING TABLE ---
    const tableBody = [
        ['Plan Charges', payment.rechargePlan, `Rs. ${payment.billAmount.toFixed(2)}`],
        ['Wallet Adjustment', payment.usedWalletAmount ? 'Deducted from Wallet' : '-', `Rs. -${(payment.usedWalletAmount || 0).toFixed(2)}`],
    ];

    // Add Table
    autoTable(doc, {
        startY: startY + 35,
        head: [['Description', 'Details', 'Amount']],
        body: tableBody,
        theme: 'grid',
        headStyles: { fillColor: [0, 102, 204], textColor: 255, fontStyle: 'bold' },
        styles: { fontSize: 10, cellPadding: 3 },
        columnStyles: { 
            0: { cellWidth: 80 },
            1: { cellWidth: 60 },
            2: { cellWidth: 40, halign: 'right' }
        }
    });

    // --- TOTALS SECTION ---
    let finalY = (doc as any).lastAutoTable.finalY + 10;

    doc.setFont("helvetica", "normal");
    doc.text(`Sub Total:`, 140, finalY);
    doc.text(`Rs. ${payment.billAmount.toFixed(2)}`, 190, finalY, { align: 'right' });

    if(payment.usedWalletAmount) {
        finalY += 6;
        doc.text(`Wallet Used:`, 140, finalY);
        doc.text(`- Rs. ${payment.usedWalletAmount.toFixed(2)}`, 190, finalY, { align: 'right' });
    }

    // Grand Total Box
    finalY += 10;
    doc.setFillColor(240, 240, 240);
    doc.rect(130, finalY - 6, 70, 12, 'F');
    doc.setFont("helvetica", "bold");
    doc.text(`NET PAID:`, 140, finalY + 2);
    doc.text(`Rs. ${(payment.billAmount - (payment.usedWalletAmount || 0)).toFixed(2)}`, 190, finalY + 2, { align: 'right' });

    // Wallet Balance Info (Footer)
    finalY += 20;
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    
    if (payment.addedToWallet && payment.addedToWallet > 0) {
        doc.text(`* Excess amount of Rs. ${payment.addedToWallet} has been added to your wallet.`, 14, finalY);
        finalY += 5;
    }
    
    doc.text(`* Current Wallet Balance: Rs. ${customer.walletBalance.toFixed(2)}`, 14, finalY);

    // --- TERMS & SIGNATURE ---
    doc.setFontSize(8);
    doc.text("Terms & Conditions:", 14, 270);
    doc.text("1. This is a computer generated invoice.", 14, 275);
    doc.text("2. Late payments may attract penalty.", 14, 280);

    doc.text("Authorized Signatory", 160, 280, { align: 'center' });
    doc.text("SPT Telecom", 160, 285, { align: 'center' });

    // Save File
    doc.save(`Invoice_${payment.landlineNo}_${payment.paidDate}.pdf`);
  }
};