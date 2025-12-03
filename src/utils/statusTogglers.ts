import type { Customer, Payment, Lead, MasterRecord } from '../types';

// ==================== CUSTOMER STATUS TOGGLERS ====================
export const updateCustomerStatus = async (
  customerId: string, 
  newStatus: Customer['status']
): Promise<boolean> => {
  try {
    // Import customer service dynamically to avoid circular dependencies
    const { CustomerService } = await import('../services/customerService');
    
    await CustomerService.updateCustomer(customerId, { 
      status: newStatus,
      updatedAt: new Date().toISOString()
    });
    
    return true;
  } catch (error) {
    console.error('Failed to update customer status:', error);
    return false;
  }
};

export const toggleCustomerStatus = async (customer: Customer): Promise<boolean> => {
  const statusCycle: Customer['status'][] = ['Active', 'Inactive', 'Suspended', 'Expired'];
  const currentIndex = statusCycle.indexOf(customer.status);
  const nextIndex = (currentIndex + 1) % statusCycle.length;
  const newStatus = statusCycle[nextIndex];
  
  return updateCustomerStatus(customer.id, newStatus);
};

export const activateCustomer = async (customerId: string): Promise<boolean> => {
  return updateCustomerStatus(customerId, 'Active');
};

export const suspendCustomer = async (customerId: string): Promise<boolean> => {
  return updateCustomerStatus(customerId, 'Suspended');
};

export const deactivateCustomer = async (customerId: string): Promise<boolean> => {
  return updateCustomerStatus(customerId, 'Inactive');
};

export const expireCustomer = async (customerId: string): Promise<boolean> => {
  return updateCustomerStatus(customerId, 'Expired');
};

// ==================== PAYMENT STATUS TOGGLERS ====================
export const updatePaymentStatus = async (
  paymentId: string, 
  newStatus: Payment['status']
): Promise<boolean> => {
  try {
    const { PaymentService } = await import('../services/paymentService');
    
    const updateData: Partial<Payment> = {
      status: newStatus,
      updatedAt: new Date().toISOString()
    };
    
    // If marking as paid, set paid date
    if (newStatus === 'Paid') {
      updateData.paidDate = new Date().toISOString();
    }
    
    await PaymentService.updatePayment(paymentId, updateData);
    return true;
  } catch (error) {
    console.error('Failed to update payment status:', error);
    return false;
  }
};

export const markPaymentAsPaid = async (paymentId: string): Promise<boolean> => {
  return updatePaymentStatus(paymentId, 'Paid');
};

export const markPaymentAsUnpaid = async (paymentId: string): Promise<boolean> => {
  return updatePaymentStatus(paymentId, 'Unpaid');
};

export const togglePaymentStatus = async (payment: Payment): Promise<boolean> => {
  const newStatus = payment.status === 'Paid' ? 'Unpaid' : 'Paid';
  return updatePaymentStatus(payment.id, newStatus);
};

// ==================== LEAD STATUS TOGGLERS ====================
export const updateLeadStatus = async (
  leadId: string, 
  newStatus: Lead['status']
): Promise<boolean> => {
  try {
    const { LeadService } = await import('../services/leadService');
    
    await LeadService.updateLead(leadId, { 
      status: newStatus,
      updatedAt: new Date().toISOString()
    });
    
    return true;
  } catch (error) {
    console.error('Failed to update lead status:', error);
    return false;
  }
};

export const convertLeadToCustomer = async (leadId: string, customerData: Partial<Customer>): Promise<{ success: boolean; customerId?: string; error?: string }> => {
  try {
    const { LeadService } = await import('../services/leadService');
    const { CustomerService } = await import('../services/customerService');
    
    // First, get the lead data
    const leads = await LeadService.getLeads();
    const lead = leads.find(l => l.id === leadId);
    
    if (!lead) {
      throw new Error('Lead not found');
    }
    
    // Create customer from lead data
    const customer: Omit<Customer, 'id'> = {
      landline: customerData.landline || '',
      name: lead.customerName,
      mobileNo: lead.phoneNo,
      altMobileNo: '',
      vlanId: customerData.vlanId || '',
      bbId: customerData.bbId || '',
      voipPassword: customerData.voipPassword || '',
      ontMake: customerData.ontMake || '',
      ontType: customerData.ontType || '',
      ontMacAddress: customerData.ontMacAddress || '',
      ontBillNo: customerData.ontBillNo || '',
      ont: 'Free ONT',
      offerPrize: customerData.offerPrize || '', // Required field for Customer type
      routerMake: customerData.routerMake || '',
      routerMacId: customerData.routerMacId || '',
      oltIp: customerData.oltIp || '',
      installationDate: new Date().toISOString(),
      status: 'Active',
      source: customerData.source || 'BSNL',
      email: customerData.email || ''
    };
    
    // Add customer to database
    const customerId = await CustomerService.addCustomer(customer);
    
    // Update lead status to 'Sale'
    await updateLeadStatus(leadId, 'Sale');
    
    return { success: true, customerId };
  } catch (error) {
    console.error('Failed to convert lead to customer:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

export const markLeadAsSuccess = async (leadId: string): Promise<boolean> => {
  return updateLeadStatus(leadId, 'Success');
};

export const markLeadAsRejected = async (leadId: string): Promise<boolean> => {
  return updateLeadStatus(leadId, 'Rejected');
};

export const markLeadAsPending = async (leadId: string): Promise<boolean> => {
  return updateLeadStatus(leadId, 'Pending');
};

export const toggleLeadStatus = async (lead: Lead): Promise<boolean> => {
  const statusCycle: Lead['status'][] = ['Pending', 'Success', 'Rejected', 'Sale'];
  const currentIndex = statusCycle.indexOf(lead.status);
  const nextIndex = (currentIndex + 1) % statusCycle.length;
  const newStatus = statusCycle[nextIndex];
  
  return updateLeadStatus(lead.id, newStatus);
};

// ==================== MASTER RECORD STATUS TOGGLERS ====================
export const updateMasterRecordStatus = async (
  type: string,
  recordId: string, 
  newStatus: MasterRecord['status']
): Promise<boolean> => {
  try {
    const { MasterRecordService } = await import('../services/masterRecordService');
    
    await MasterRecordService.updateRecord(type, recordId, { 
      status: newStatus,
      updatedAt: new Date().toISOString()
    });
    
    return true;
  } catch (error) {
    console.error('Failed to update master record status:', error);
    return false;
  }
};

export const activateMasterRecord = async (type: string, recordId: string): Promise<boolean> => {
  return updateMasterRecordStatus(type, recordId, 'Active');
};

export const deactivateMasterRecord = async (type: string, recordId: string): Promise<boolean> => {
  return updateMasterRecordStatus(type, recordId, 'Inactive');
};

export const toggleMasterRecordStatus = async (type: string, record: MasterRecord): Promise<boolean> => {
  const newStatus: MasterRecord['status'] = record.status === 'Active' ? 'Inactive' : 'Active';
  return updateMasterRecordStatus(type, record.id, newStatus);
};

// ==================== BULK STATUS UPDATE HELPERS ====================
export const bulkUpdateCustomerStatus = async (
  customerIds: string[], 
  newStatus: Customer['status']
): Promise<{ success: number; failed: number; errors: string[] }> => {
  const results = {
    success: 0,
    failed: 0,
    errors: [] as string[]
  };
  
  for (const customerId of customerIds) {
    try {
      const success = await updateCustomerStatus(customerId, newStatus);
      if (success) {
        results.success++;
      } else {
        results.failed++;
        results.errors.push(`Failed to update customer ${customerId}`);
      }
    } catch (error) {
      results.failed++;
      results.errors.push(`Error updating customer ${customerId}: ${error}`);
    }
  }
  
  return results;
};

export const bulkUpdatePaymentStatus = async (
  paymentIds: string[], 
  newStatus: Payment['status']
): Promise<{ success: number; failed: number; errors: string[] }> => {
  const results = {
    success: 0,
    failed: 0,
    errors: [] as string[]
  };
  
  for (const paymentId of paymentIds) {
    try {
      const success = await updatePaymentStatus(paymentId, newStatus);
      if (success) {
        results.success++;
      } else {
        results.failed++;
        results.errors.push(`Failed to update payment ${paymentId}`);
      }
    } catch (error) {
      results.failed++;
      results.errors.push(`Error updating payment ${paymentId}: ${error}`);
    }
  }
  
  return results;
};

// ==================== STATUS VALIDATION HELPERS ====================
export const isValidCustomerStatus = (status: string): status is Customer['status'] => {
  return ['Active', 'Inactive', 'Suspended', 'Expired'].includes(status);
};

export const isValidPaymentStatus = (status: string): status is Payment['status'] => {
  return ['Paid', 'Unpaid'].includes(status);
};

export const isValidLeadStatus = (status: string): status is Lead['status'] => {
  return ['Success', 'Rejected', 'Sale', 'Pending'].includes(status);
};

export const isValidMasterRecordStatus = (status: string): status is MasterRecord['status'] => {
  return ['Active', 'Inactive'].includes(status);
};

// ==================== STATUS CHANGE LOGGING ====================
export const logStatusChange = (
  entityType: string,
  entityId: string,
  oldStatus: string,
  newStatus: string,
  userId?: string
): void => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    entityType,
    entityId,
    oldStatus,
    newStatus,
    userId: userId || 'system'
  };
  
  console.log('Status Change:', logEntry);
  
  // In a real application, you might want to store this in a logs collection
  // or send to a logging service
};

// ==================== STATUS CHANGE NOTIFICATIONS ====================
export const createStatusChangeNotification = (
  entityType: string,
  entityId: string,
  oldStatus: string,
  newStatus: string,
  entityName?: string
): Partial<import('../types').Notification> => {
  const notification: Partial<import('../types').Notification> = {
    title: `${entityType} Status Updated`,
    message: `${entityType} "${entityName || entityId}" status changed from ${oldStatus} to ${newStatus}`,
    type: newStatus === 'Active' || newStatus === 'Paid' || newStatus === 'Success' ? 'success' : 'warning',
    priority: newStatus === 'Suspended' || newStatus === 'Expired' ? 'high' : 'medium',
    category: entityType.toLowerCase() as any,
    actionRequired: false,
    entityId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  return notification;
};