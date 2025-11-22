import { Payment, Customer } from '../types';

export const WhatsAppService = {
  // Helper: Format phone number to 91XXXXXXXXXX
  formatPhone: (phone: string) => {
    if (!phone) return '';
    // Remove non-digits (spaces, dashes)
    const clean = phone.replace(/\D/g, '');
    
    // If 10 digits, add 91. If 12 digits (91...), keep it.
    if (clean.length === 10) return `91${clean}`;
    if (clean.length === 12 && clean.startsWith('91')) return clean;
    return clean; // Return as is if unsure
  },

  openWhatsApp: (phone: string, message: string) => {
    const formattedPhone = WhatsAppService.formatPhone(phone);
    if (!formattedPhone) {
      console.error("Invalid Phone Number");
      return;
    }
    const encodedMsg = encodeURIComponent(message);
    window.open(`https://wa.me/${formattedPhone}?text=${encodedMsg}`, '_blank');
  },

  // 1. New Customer Greeting
  sendWelcomeMessage: (customer: Customer) => {
    const phone = customer.altMobileNo || customer.mobileNo;
    const msg = `🎉 *Welcome to SPT TELECOM!*
    
Dear ${customer.name},
Your connection has been successfully registered.

🆔 Customer ID: ${customer.id}
📅 Plan: ${customer.plan || 'Basic'}
📞 Registered Landline: ${customer.landline}

For any support, save this number and reply here.
- Team SPT Telecom`;
    
    WhatsAppService.openWhatsApp(phone, msg);
  },

  // 2. Payment Acknowledgement
  sendPaymentAck: (payment: Payment) => {
    // We assume landlineNo might be linked to a mobile, or we fetch mobile from customer list.
    // For now, we use the payment record's contact info if available, or we can implement a lookup.
    // Assuming landlineNo field acts as ID to find customer, but here we need a mobile number.
    // In a real app, you'd pass the 'mobileNo' string here.
    
    const msg = `✅ *Payment Received*
    
Dear ${payment.customerName},
We have received your payment of ₹${payment.billAmount}.

📅 Date: ${payment.paidDate}
💳 Mode: ${payment.modeOfPayment}
📶 Status: ACTIVE

Thank you!
- SPT Telecom`;
    
    // Note: You need to pass the actual Mobile Number here. 
    // For now, I'm triggering the window open - you might need to pass 'mobile' from the Payment component.
    return msg; 
  },

  // 3. Send Invoice / Bill
  sendBill: (customerName: string, amount: number, dueDate: string, link: string) => {
    const msg = `🧾 *Bill Generated - SPT TELECOM*
    
Dear ${customerName},
Your bill for this month is generated.

💰 Amount: ₹${amount}
📅 Due Date: ${dueDate}

🔗 View & Pay: ${link}

Please pay before due date to avoid interruption.`;
    
    return msg;
  },

  // 4. Payment Reminder (Due/Inactive)
  sendReminder: (customerName: string, amount: number, status: string) => {
    const msg = `⚠️ *Payment Reminder*
    
Dear ${customerName},
Your account status is *${status}*.
Pending Amount: ₹${amount}

Please pay immediately to restore/maintain services.
- SPT Telecom`;
    
    return msg;
  }
};