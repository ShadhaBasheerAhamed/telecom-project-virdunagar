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
        // alert("Mobile number not found for WhatsApp!"); // Optional: Uncomment to debug
        return;
    }
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
    const phone = mobileNo || payment.mobileNo || payment.landlineNo; 
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
  },

  // --- NEW: COMPLAINT MESSAGES ---

  // 4. Complaint Registered (Received)
  sendComplaintReceived: (name: string, phone: string, complaintId: string, issue: string) => {
      const msg = `🛠️ *Complaint Registered*

Dear ${name},
We have received your complaint.

🆔 Ticket ID: ${complaintId}
⚠️ Issue: ${issue}
🕒 Status: OPEN

Our team is working on it and will resolve it shortly.
- SPT Support Team`;
      openWA(getPhone(undefined, undefined, phone), msg);
  },

  // 5. Complaint Resolved
  sendComplaintResolved: (name: string, phone: string, complaintId: string) => {
      const msg = `✅ *Issue Resolved*

Dear ${name},
Your complaint (ID: ${complaintId}) has been successfully RESOLVED.

If you face any further issues, feel free to contact us.
Thank you for choosing SPT Telecom.`;
      openWA(getPhone(undefined, undefined, phone), msg);
  }
};