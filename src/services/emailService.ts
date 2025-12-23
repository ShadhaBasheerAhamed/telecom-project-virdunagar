// frontend/src/services/emailService.ts
import { Payment } from '../types';

export const EmailService = {
    // ---------------------------------------------------------
    // 1. PAYMENT INVOICE EMAIL (For Plans/Recharges)
    // ---------------------------------------------------------
    sendInvoiceEmail: (payment: Payment, email?: string) => {
        if (!email) {
            console.warn("No email provided for invoice.");
            return;
        }

        const subject = `Invoice Receipt - ${payment.landlineNo} - SPT Telecom`;
        
        // Format the email body
        const body = `Dear ${payment.customerName},%0D%0A%0D%0A` +
                     `We have received your payment of Rs. ${payment.billAmount}.%0D%0A%0D%0A` +
                     `Payment Details:%0D%0A` +
                     `-------------------------%0D%0A` +
                     `Invoice No: ${payment.id}%0D%0A` +
                     `Plan: ${payment.rechargePlan}%0D%0A` +
                     `Paid Date: ${payment.paidDate}%0D%0A` +
                     `-------------------------%0D%0A%0D%0A` +
                     `Please find the invoice attached (downloaded separately).%0D%0A%0D%0A` +
                     `Thank you,%0D%0ASPT Telecom Services`;

        // Open default mail app
        window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
    },

    // ---------------------------------------------------------
    // 2. PRODUCT SALES EMAIL (For Inventory/POS)
    // ---------------------------------------------------------
    sendProductInvoiceEmail: (data: { name: string, email: string, total: number, items: any[] }) => {
        if (!data.email) {
             console.warn("No email provided for product invoice.");
             return;
        }

        const subject = `Sales Receipt - SPT Telecom`;
        
        // Format item list for email body
        let itemListStr = data.items.map(i => `- ${i.name} (x${i.qty}): Rs. ${(i.sellPrice * i.qty).toFixed(2)}`).join('%0D%0A');

        const body = `Dear ${data.name},%0D%0A%0D%0A` +
                     `Thank you for your purchase.%0D%0A%0D%0A` +
                     `Order Summary:%0D%0A` +
                     `-------------------------%0D%0A` +
                     `${itemListStr}%0D%0A` +
                     `-------------------------%0D%0A` +
                     `TOTAL PAID: Rs. ${data.total.toFixed(2)}%0D%0A%0D%0A` +
                     `Your official invoice has been downloaded to your device.%0D%0A%0D%0A` +
                     `Regards,%0D%0ASPT Telecom Services`;

        window.location.href = `mailto:${data.email}?subject=${subject}&body=${body}`;
    }
};