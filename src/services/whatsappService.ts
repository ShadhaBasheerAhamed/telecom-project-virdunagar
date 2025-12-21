import { Payment, Customer } from '../types';

// Helper: Clean phone number
const getPhone = (customer?: Partial<Customer>, landline?: string, altMobile?: string) => {
    let phone = altMobile || customer?.altMobileNo || customer?.mobileNo || landline || '';
    phone = phone.replace(/\D/g, ''); 
    if (phone.length === 10) return `91${phone}`;
    if (phone.length === 12 && phone.startsWith('91')) return phone;
    return phone; 
};

// Helper: Open WhatsApp safely
const openWA = (phone: string, text: string) => {
    if (!phone || phone.length < 10) {
        console.warn("Invalid Mobile Number for WhatsApp:", phone);
        alert("Mobile number not found for WhatsApp!");
        return;
    }
    // Using setTimeout helps sometimes with async popup blockers
    setTimeout(() => {
        const url = `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
        window.open(url, '_blank');
    }, 100);
};

export const WhatsAppService = {
  
  // 1. Welcome Message
  sendWelcome: (customer: Customer) => {
    const msg = `🎉 *Welcome to SPT TELECOM!*
    
Dear ${customer.name},
Your connection is successfully registered.

🆔 ID: ${customer.id}
📅 Plan: ${customer.plan || 'Standard'}
📞 Landline: ${customer.landline}

Save this number for support.
- Team SPT Telecom`;
    openWA(getPhone(customer), msg);
  },

  // 2. Payment Acknowledgement (Paid)
  sendPaymentAck: (payment: Payment, mobileNo?: string) => {
    // Priority: Input Mobile -> Payment Mobile -> Landline
    const phone = mobileNo || payment.mobileNo || payment.landlineNo; 
    
    console.log("Attempting WhatsApp to:", phone); // Debug log

    const msg = `✅ *Payment Received*
    
Dear ${payment.customerName},
We have received your payment of *₹${payment.billAmount}*.

📅 Date: ${payment.paidDate}
💳 Mode: ${payment.modeOfPayment}
✅ Status: ACTIVE
📅 Renewal: ${payment.renewalDate}

Download Invoice from your email.
Thank you!
*SPT TELECOM SERVICES*`;

    openWA(getPhone(undefined, undefined, phone), msg);
  },

  // 3. Pending Due Reminder
  sendDueReminder: (name: string, phone: string, amount: number, dueDate: string) => {
    const msg = `⚠️ *Bill Reminder*
    
Dear ${name},
Your bill of ₹${amount} is due on ${dueDate}.
Please pay to avoid interruption.

- SPT Telecom`;
    openWA(getPhone(undefined, undefined, phone), msg);
  }
};