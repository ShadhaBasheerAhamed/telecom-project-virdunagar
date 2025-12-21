// frontend/src/services/emailService.ts
import { Payment } from '../types';

export const EmailService = {
    // ---------------------------------------------------------
    // Open Mail Client with Pre-filled Invoice Details
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
    }
};