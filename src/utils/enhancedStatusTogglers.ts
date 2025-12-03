import { CustomerService } from '../services/customerService';
import { PaymentService } from '../services/paymentService';
import { LeadService } from '../services/leadService';
import { MasterRecordService } from '../services/masterRecordService';
import { NotificationService } from '../services/notificationService';
import { toast } from 'sonner';
import type { StatusToggleOptions, StatusUpdateResult } from '../types/enhanced';

export class EnhancedStatusToggler {
  
  // Generic status toggle with validation and notifications
  static async toggleStatus<T extends { id: string; status: string }>(
    entityType: 'customer' | 'payment' | 'lead' | 'masterRecord',
    entityId: string,
    currentStatus: string,
    allowedStatuses: string[],
    options: StatusToggleOptions = {},
    service: any,
    additionalUpdateData?: Partial<T> & { updatedAt?: string }
  ): Promise<StatusUpdateResult> {
    try {
      // Validate status change
      const newStatus = this.getToggleStatus(currentStatus, allowedStatuses);
      if (!newStatus) {
        return {
          success: false,
          message: `Cannot toggle from status "${currentStatus}"`,
          error: 'Invalid status transition'
        };
      }

      // Show confirmation if enabled
      if (options.confirmMessage && !confirm(options.confirmMessage)) {
        return {
          success: false,
          message: 'Status change cancelled',
          error: 'User cancelled'
        };
      }

      // Update in database
      const updateData = {
        status: newStatus,
        updatedAt: new Date().toISOString(),
        ...additionalUpdateData
      };

      await service.updateCustomer(entityId, updateData);

      // Update related records if enabled
      if (options.updateRelatedRecords) {
        await this.updateRelatedRecords(entityType, entityId, newStatus, currentStatus);
      }

      // Create notification if enabled
      if (options.showNotification !== false) {
        await this.createStatusChangeNotification(entityType, entityId, currentStatus, newStatus);
      }

      return {
        success: true,
        message: `Status updated to ${newStatus}`,
        data: { newStatus, oldStatus: currentStatus }
      };

    } catch (error) {
      console.error('Status toggle error:', error);
      return {
        success: false,
        message: 'Failed to update status',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Customer Status Toggle
  static async toggleCustomerStatus(
    customerId: string,
    currentStatus: string,
    options: StatusToggleOptions = {}
  ): Promise<StatusUpdateResult> {
    const allowedStatuses = ['Active', 'Inactive', 'Suspended', 'Expired'];
    
    const result = await this.toggleStatus(
      'customer',
      customerId,
      currentStatus,
      allowedStatuses,
      {
        confirmMessage: `Change customer status from "${currentStatus}"?`,
        showNotification: true,
        updateRelatedRecords: true,
        ...options
      },
      CustomerService
    );

    if (result.success) {
      toast.success(`Customer status updated to ${result.data?.newStatus}`);
    } else {
      toast.error(result.message);
    }

    return result;
  }

  // Payment Status Toggle
  static async togglePaymentStatus(
    paymentId: string,
    currentStatus: string,
    options: StatusToggleOptions & { paymentData?: any } = {}
  ): Promise<StatusUpdateResult> {
    const allowedStatuses = ['Paid', 'Unpaid'];
    
    const result = await this.toggleStatus(
      'payment',
      paymentId,
      currentStatus,
      allowedStatuses,
      {
        confirmMessage: `Change payment status from "${currentStatus}"?`,
        showNotification: true,
        updateRelatedRecords: true,
        ...options
      },
      PaymentService,
      {
        updatedAt: new Date().toISOString()
      }
    );

    if (result.success) {
      toast.success(`Payment status updated to ${result.data?.newStatus}`);
      
      // Send WhatsApp notification if payment marked as paid
      if (result.data?.newStatus === 'Paid' && options.paymentData) {
        try {
          const { WhatsAppService } = await import('../services/whatsappService');
          const mobileNo = this.getCustomerMobile(options.paymentData.landlineNo);
          WhatsAppService.sendPaymentAck(options.paymentData, mobileNo);
        } catch (error) {
          console.warn('Failed to send WhatsApp notification:', error);
        }
      }
    } else {
      toast.error(result.message);
    }

    return result;
  }

  // Lead Status Toggle
  static async toggleLeadStatus(
    leadId: string,
    currentStatus: string,
    options: StatusToggleOptions = {}
  ): Promise<StatusUpdateResult> {
    const allowedStatuses = ['New', 'Contacted', 'Qualified', 'Sale', 'Lost'];
    
    const result = await this.toggleStatus(
      'lead',
      leadId,
      currentStatus,
      allowedStatuses,
      {
        confirmMessage: `Change lead status from "${currentStatus}"?`,
        showNotification: true,
        updateRelatedRecords: false,
        ...options
      },
      LeadService
    );

    if (result.success) {
      toast.success(`Lead status updated to ${result.data?.newStatus}`);
    } else {
      toast.error(result.message);
    }

    return result;
  }

  // Master Record Status Toggle
  static async toggleMasterRecordStatus(
    recordId: string,
    currentStatus: string,
    options: StatusToggleOptions = {}
  ): Promise<StatusUpdateResult> {
    const allowedStatuses = ['Active', 'Inactive'];
    
    const result = await this.toggleStatus(
      'masterRecord',
      recordId,
      currentStatus,
      allowedStatuses,
      {
        confirmMessage: `Change record status from "${currentStatus}"?`,
        showNotification: false,
        updateRelatedRecords: false,
        ...options
      },
      MasterRecordService
    );

    if (result.success) {
      toast.success(`Record status updated to ${result.data?.newStatus}`);
    } else {
      toast.error(result.message);
    }

    return result;
  }

  // Bulk Status Toggle
  static async bulkToggleStatus(
    entityType: 'customer' | 'payment' | 'lead',
    entityIds: string[],
    statusChanges: Array<{ id: string; currentStatus: string; newStatus: string }>,
    options: StatusToggleOptions = {}
  ): Promise<{ success: number; failed: number; errors: string[] }> {
    try {
      const errors: string[] = [];
      let success = 0;
      let failed = 0;

      for (const change of statusChanges) {
        try {
          let result;
          switch (entityType) {
            case 'customer':
              result = await this.toggleCustomerStatus(change.id, change.currentStatus, options);
              break;
            case 'payment':
              result = await this.togglePaymentStatus(change.id, change.currentStatus, options);
              break;
            case 'lead':
              result = await this.toggleLeadStatus(change.id, change.currentStatus, options);
              break;
          }

          if (result.success) {
            success++;
          } else {
            failed++;
            errors.push(`Failed to update ${entityType} ${change.id}: ${result.message}`);
          }
        } catch (error) {
          failed++;
          errors.push(`Error updating ${entityType} ${change.id}: ${error}`);
        }
      }

      const message = `Bulk update completed: ${success} successful, ${failed} failed`;
      if (success > 0) {
        toast.success(message);
      }
      if (failed > 0) {
        toast.error(message);
      }

      return { success, failed, errors };
    } catch (error) {
      console.error('Bulk status toggle error:', error);
      return { success: 0, failed: entityIds.length, errors: [error.message] };
    }
  }

  // Helper Methods
  private static getToggleStatus(currentStatus: string, allowedStatuses: string[]): string | null {
    const currentIndex = allowedStatuses.indexOf(currentStatus);
    if (currentIndex === -1) return null;
    
    const nextIndex = (currentIndex + 1) % allowedStatuses.length;
    return allowedStatuses[nextIndex];
  }

  private static async updateRelatedRecords(
    entityType: string,
    entityId: string,
    newStatus: string,
    oldStatus: string
  ): Promise<void> {
    try {
      switch (entityType) {
        case 'customer':
          // Update payment status when customer status changes
          if (['Inactive', 'Suspended'].includes(newStatus)) {
            const payments = await PaymentService.getPayments();
            const customerPayments = payments.filter(p => p.landlineNo === entityId);
            for (const payment of customerPayments) {
              await PaymentService.updatePayment(payment.id, { status: 'Unpaid' });
            }
          } else if (newStatus === 'Active' && oldStatus !== 'Active') {
            // Could trigger customer activation logic here
          }
          break;
          
        case 'payment':
          // Customer status updates based on payment status
          const payments = await PaymentService.getPayments();
          const payment = payments.find(p => p.id === entityId);
          if (payment) {
            const customerStatus = newStatus === 'Paid' ? 'Active' : 'Inactive';
            await CustomerService.updateCustomer(payment.landlineNo, { status: customerStatus });
          }
          break;
      }
    } catch (error) {
      console.error('Error updating related records:', error);
    }
  }

  private static async createStatusChangeNotification(
    entityType: string,
    entityId: string,
    oldStatus: string,
    newStatus: string
  ): Promise<void> {
    try {
      const title = `${entityType.charAt(0).toUpperCase() + entityType.slice(1)} Status Changed`;
      const message = `${entityType} ${entityId} status changed from ${oldStatus} to ${newStatus}`;
      
      await NotificationService.createSystemNotification(
        entityType === 'customer' ? 'customer' : 
        entityType === 'payment' ? 'payment' : 
        entityType === 'lead' ? 'system' : 'system',
        title,
        message,
        'low'
      );
    } catch (error) {
      console.error('Error creating status change notification:', error);
    }
  }

  private static getCustomerMobile(landlineNo: string): string {
    try {
      const stored = localStorage.getItem('customers-data');
      if (stored) {
        const customers = JSON.parse(stored);
        const found = customers.find((c: any) => c.landline === landlineNo);
        return found ? (found.altMobileNo || found.mobileNo) : landlineNo;
      }
    } catch (error) {
      console.error('Error getting customer mobile:', error);
    }
    return landlineNo;
  }

  // Utility method to get status options for UI
  static getStatusOptions(entityType: string): Array<{ value: string; label: string; color: string }> {
    const options: Record<string, Array<{ value: string; label: string; color: string }>> = {
      customer: [
        { value: 'Active', label: 'Active', color: 'bg-green-900/30 text-green-400 border-green-800' },
        { value: 'Inactive', label: 'Inactive', color: 'bg-red-900/30 text-red-400 border-red-800' },
        { value: 'Suspended', label: 'Suspended', color: 'bg-yellow-900/30 text-yellow-400 border-yellow-800' },
        { value: 'Expired', label: 'Expired', color: 'bg-gray-900/30 text-gray-400 border-gray-800' }
      ],
      payment: [
        { value: 'Paid', label: 'Paid', color: 'bg-green-900/30 text-green-400 border-green-800' },
        { value: 'Unpaid', label: 'Unpaid', color: 'bg-red-900/30 text-red-400 border-red-800' }
      ],
      lead: [
        { value: 'New', label: 'New', color: 'bg-blue-900/30 text-blue-400 border-blue-800' },
        { value: 'Contacted', label: 'Contacted', color: 'bg-yellow-900/30 text-yellow-400 border-yellow-800' },
        { value: 'Qualified', label: 'Qualified', color: 'bg-purple-900/30 text-purple-400 border-purple-800' },
        { value: 'Sale', label: 'Sale', color: 'bg-green-900/30 text-green-400 border-green-800' },
        { value: 'Lost', label: 'Lost', color: 'bg-red-900/30 text-red-400 border-red-800' }
      ],
      masterRecord: [
        { value: 'Active', label: 'Active', color: 'bg-green-900/30 text-green-400 border-green-800' },
        { value: 'Inactive', label: 'Inactive', color: 'bg-red-900/30 text-red-400 border-red-800' }
      ]
    };

    return options[entityType] || [];
  }

  // Validate status transition
  static validateStatusTransition(
    entityType: string,
    currentStatus: string,
    newStatus: string
  ): { valid: boolean; message?: string } {
    const allowedStatuses = this.getStatusOptions(entityType).map(opt => opt.value);
    
    if (!allowedStatuses.includes(currentStatus)) {
      return { valid: false, message: `Invalid current status: ${currentStatus}` };
    }
    
    if (!allowedStatuses.includes(newStatus)) {
      return { valid: false, message: `Invalid new status: ${newStatus}` };
    }

    return { valid: true };
  }
}

export default EnhancedStatusToggler;