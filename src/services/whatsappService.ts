import { Payment, Customer } from '../types';

// Helper to clean and format phone numbers to International format (91XXXXXXXXXX)
const getPhone = (customer?: Partial<Customer>, landline?: string, altMobile?: string) => {
    // Priority: Alt Mobile -> Main Mobile -> Landline
    let phone = altMobile || customer?.altMobileNo || customer?.mobileNo || landline || '';
    
    // Remove non-digits
    phone = phone.replace(/\D/g, ''); 
    
    // Basic validation for India numbers
    if (phone.length === 10) return `91${phone}`;
    if (phone.length === 12 && phone.startsWith('91')) return phone;
    
    return phone; 
};

const openWA = (phone: string, text: string) => {
    if (!phone || phone.length < 10) {
        console.warn("Valid mobile number not found for WhatsApp.");
        return;
    }
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
};

export const WhatsAppService = {
  
  // 1. New Customer / Sale Conversion Greeting
  sendWelcome: (customer: Customer) => {
    const msg = `🎉 *Welcome to SPT TELECOM!*
    
Dear ${customer.name},
Your connection has been successfully registered.

🆔 Customer ID: ${customer.id}
📅 Plan: ${customer.plan || 'Standard'}
📞 Landline: ${customer.landline}

For support, reply to this message.
- Team SPT Telecom`;
    openWA(getPhone(customer), msg);
  },

  // 2. Payment Acknowledgement (Paid)
  sendPaymentAck: (payment: Payment, mobileNo?: string) => {
    const phone = mobileNo || payment.landlineNo; 

    const msg = `✅ *Payment Received - Acknowledgement*
    
Dear ${payment.customerName},
We received your payment of ₹${payment.billAmount}.

📅 Date: ${payment.paidDate}
💳 Mode: ${payment.modeOfPayment}
✅ Status: ACTIVE
📅 Next Renewal: ${payment.renewalDate}

Thank you,
*SPT GLOBAL TELECOM SERVICES*`;
    openWA(getPhone(undefined, undefined, phone), msg);
  },

  // 3. Payment Due Reminder (BSNL 5th & 15th / RMAX Expiry)
  sendDueReminder: (name: string, phone: string, amount: number, dueDate: string) => {
    const msg = `⚠️ *Bill Due Reminder*
    
Dear ${name},
Your bill of ₹${amount} is due on ${dueDate}.
Please pay to avoid service interruption/penalty.

Ignore if already paid.
- SPT Telecom`;
    openWA(getPhone(undefined, undefined, phone), msg);
  },

  // 4. Inactive / Service Suspended Alert
  sendInactiveAlert: (name: string, phone: string) => {
    const msg = `❌ *Service Suspended*
    
Dear ${name},
Your connection has been deactivated due to non-payment.
Please pay immediately to restore services.

- SPT Telecom`;
    openWA(getPhone(undefined, undefined, phone), msg);
  },

  // 5. Sales Invoice (Inventory)
  sendInvoice: (name: string, phone: string, items: string, total: number) => {
    const msg = `🧾 *Invoice Generated*
    
Customer: ${name}
----------------
${items}
----------------
💰 *Total Bill: ₹${total} (Inc. GST)*

Thank you for your purchase!
- SPT Telecom`;
    openWA(getPhone(undefined, undefined, phone), msg);
  }
};