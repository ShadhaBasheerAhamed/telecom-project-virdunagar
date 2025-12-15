import { CustomerService } from '../services/customerService';
import { ExpiredOverviewService } from '../services/expiredOverviewService';
import type { Customer } from '../types';
import type { ExpiredOverview } from '../services/expiredOverviewService';

export class ExpiredDataMigrationService {

    /**
     * Migrate expired customers from customers collection to expired_overview collection
     * This should be run once to populate the expired_overview collection
     */
    static async migrateExpiredCustomers(): Promise<{
        success: number;
        failed: number;
        errors: string[];
        totalCustomersChecked: number;
        expiredCustomersFound: number;
    }> {
        console.log('🚀 Starting migration of expired customers...');

        try {
            // Get all customers from the customers collection
            const allCustomers = await CustomerService.getCustomers();
            console.log(`📊 Found ${allCustomers.length} total customers`);

            // Filter customers with expired status
            const expiredCustomers = allCustomers.filter(customer => {
                const status = (customer.status || '').toLowerCase();
                return status === 'expired';
            });

            console.log(`⚠️  Found ${expiredCustomers.length} expired customers`);

            if (expiredCustomers.length === 0) {
                console.log('ℹ️  No expired customers found to migrate');
                return {
                    success: 0,
                    failed: 0,
                    errors: [],
                    totalCustomersChecked: allCustomers.length,
                    expiredCustomersFound: 0
                };
            }

            // Clear existing expired_overview collection first
            console.log('🧹 Clearing existing expired_overview collection...');
            await ExpiredOverviewService.clearAllExpiredRecords();

            // Transform expired customers to expired_overview format
            const expiredOverviewRecords: Omit<ExpiredOverview, 'id'>[] = expiredCustomers.map(customer => {
                // Determine expired date (use renewalDate if available, otherwise use updatedAt or createdAt)
                let expiredDate: string;
                if (customer.renewalDate) {
                    expiredDate = new Date(customer.renewalDate).toISOString().split('T')[0];
                } else if (customer.updatedAt) {
                    expiredDate = new Date(customer.updatedAt).toISOString().split('T')[0];
                } else if (customer.createdAt) {
                    expiredDate = new Date(customer.createdAt).toISOString().split('T')[0];
                } else {
                    // Default to current date if no date information available
                    expiredDate = new Date().toISOString().split('T')[0];
                }

                // Determine reason based on customer data (using type assertion for extended properties)
                const customerAny = customer as any;
                let reason = 'service_ended'; // default reason
                if (customerAny.reason) {
                    reason = customerAny.reason;
                } else if (customerAny.notes && customerAny.notes.toLowerCase().includes('payment')) {
                    reason = 'payment_failed';
                } else if (customerAny.notes && customerAny.notes.toLowerCase().includes('request')) {
                    reason = 'customer_request';
                }

                return {
                    customerId: customer.id || '',
                    customerName: customer.name || 'Unknown Customer',
                    planType: customer.plan || 'Unknown Plan',
                    expiredDate,
                    reason,
                    source: customer.source || 'Unknown',
                    createdAt: new Date().toISOString()
                };
            });

            console.log(`📝 Prepared ${expiredOverviewRecords.length} records for migration`);

            // Batch insert the records
            const batchSize = 500;
            let success = 0;
            let failed = 0;
            const errors: string[] = [];

            for (let i = 0; i < expiredOverviewRecords.length; i += batchSize) {
                const batch = expiredOverviewRecords.slice(i, i + batchSize);
                
                try {
                    // Insert records one by one (since addDoc doesn't support batch array)
                    for (const record of batch) {
                        try {
                            await ExpiredOverviewService.addExpiredRecord(record);
                            success++;
                        } catch (error) {
                            failed++;
                            errors.push(`Failed to insert record for customer ${record.customerId}: ${error}`);
                        }
                    }
                    
                    console.log(`✅ Batch ${Math.floor(i / batchSize) + 1} completed: ${batch.length} records processed`);
                } catch (error) {
                    failed += batch.length;
                    errors.push(`Batch ${Math.floor(i / batchSize) + 1} failed: ${error}`);
                }
            }

            const result = {
                success,
                failed,
                errors,
                totalCustomersChecked: allCustomers.length,
                expiredCustomersFound: expiredCustomers.length
            };

            console.log('🎉 Migration completed!', result);
            return result;

        } catch (error) {
            console.error('💥 Migration failed:', error);
            return {
                success: 0,
                failed: 0,
                errors: [error instanceof Error ? error.message : 'Unknown error'],
                totalCustomersChecked: 0,
                expiredCustomersFound: 0
            };
        }
    }

    /**
     * Update expired_overview collection with new expired customers
     * This should be run periodically to sync new expired customers
     */
    static async syncNewExpiredCustomers(): Promise<{
        newRecordsAdded: number;
        errors: string[];
    }> {
        console.log('🔄 Starting sync of new expired customers...');

        try {
            // Get all expired customers from customers collection
            const allCustomers = await CustomerService.getCustomers();
            const expiredCustomers = allCustomers.filter(customer => {
                const status = (customer.status || '').toLowerCase();
                return status === 'expired';
            });

            // Get existing expired_overview records
            const existingExpiredRecords = await ExpiredOverviewService.getExpiredRecords();
            const existingCustomerIds = new Set(existingExpiredRecords.map(record => record.customerId));

            // Find new expired customers not in expired_overview
            const newExpiredCustomers = expiredCustomers.filter(customer => 
                customer.id && !existingCustomerIds.has(customer.id)
            );

            console.log(`📊 Found ${newExpiredCustomers.length} new expired customers to add`);

            if (newExpiredCustomers.length === 0) {
                return {
                    newRecordsAdded: 0,
                    errors: []
                };
            }

            // Transform and add new records
            let newRecordsAdded = 0;
            const errors: string[] = [];

            for (const customer of newExpiredCustomers) {
                try {
                    // Determine expired date
                    let expiredDate: string;
                    if (customer.renewalDate) {
                        expiredDate = new Date(customer.renewalDate).toISOString().split('T')[0];
                    } else if (customer.updatedAt) {
                        expiredDate = new Date(customer.updatedAt).toISOString().split('T')[0];
                    } else if (customer.createdAt) {
                        expiredDate = new Date(customer.createdAt).toISOString().split('T')[0];
                    } else {
                        expiredDate = new Date().toISOString().split('T')[0];
                    }

                    // Determine reason (using type assertion for extended properties)
                    const customerAny = customer as any;
                    let reason = 'service_ended';
                    if (customerAny.reason) {
                        reason = customerAny.reason;
                    } else if (customerAny.notes && customerAny.notes.toLowerCase().includes('payment')) {
                        reason = 'payment_failed';
                    } else if (customerAny.notes && customerAny.notes.toLowerCase().includes('request')) {
                        reason = 'customer_request';
                    }

                    const expiredOverviewRecord: Omit<ExpiredOverview, 'id'> = {
                        customerId: customer.id || '',
                        customerName: customer.name || 'Unknown Customer',
                        planType: customer.plan || 'Unknown Plan',
                        expiredDate,
                        reason,
                        source: customer.source || 'Unknown',
                        createdAt: new Date().toISOString()
                    };

                    await ExpiredOverviewService.addExpiredRecord(expiredOverviewRecord);
                    newRecordsAdded++;

                } catch (error) {
                    errors.push(`Failed to add record for customer ${customer.id}: ${error}`);
                }
            }

            console.log(`✅ Sync completed! Added ${newRecordsAdded} new records`);
            return {
                newRecordsAdded,
                errors
            };

        } catch (error) {
            console.error('💥 Sync failed:', error);
            return {
                newRecordsAdded: 0,
                errors: [error instanceof Error ? error.message : 'Unknown error']
            };
        }
    }

    /**
     * Remove expired records for customers that are no longer expired
     * This should be run periodically to clean up the expired_overview collection
     */
    static async cleanupNonExpiredCustomers(): Promise<{
        recordsRemoved: number;
        errors: string[];
    }> {
        console.log('🧹 Starting cleanup of non-expired customers...');

        try {
            // Get all customers and expired_overview records
            const allCustomers = await CustomerService.getCustomers();
            const expiredRecords = await ExpiredOverviewService.getExpiredRecords();

            // Create a map of customer IDs to their current status
            const customerStatusMap = new Map<string, string>();
            allCustomers.forEach(customer => {
                if (customer.id) {
                    customerStatusMap.set(customer.id, (customer.status || '').toLowerCase());
                }
            });

            // Find expired records that should be removed (customer is no longer expired)
            const recordsToRemove = expiredRecords.filter(record => {
                const currentStatus = customerStatusMap.get(record.customerId);
                return currentStatus && currentStatus !== 'expired';
            });

            console.log(`📊 Found ${recordsToRemove.length} records to remove`);

            if (recordsToRemove.length === 0) {
                return {
                    recordsRemoved: 0,
                    errors: []
                };
            }

            // Remove the records
            let recordsRemoved = 0;
            const errors: string[] = [];

            for (const record of recordsToRemove) {
                try {
                    if (record.id) {
                        await ExpiredOverviewService.deleteExpiredRecord(record.id);
                        recordsRemoved++;
                    }
                } catch (error) {
                    errors.push(`Failed to remove record ${record.id}: ${error}`);
                }
            }

            console.log(`✅ Cleanup completed! Removed ${recordsRemoved} records`);
            return {
                recordsRemoved,
                errors
            };

        } catch (error) {
            console.error('💥 Cleanup failed:', error);
            return {
                recordsRemoved: 0,
                errors: [error instanceof Error ? error.message : 'Unknown error']
            };
        }
    }

    /**
     * Run full migration and sync process
     */
    static async runFullMigration(): Promise<{
        migration: any;
        sync: any;
        cleanup: any;
        overallSuccess: boolean;
    }> {
        console.log('🚀 Starting full migration process...');

        const migration = await this.migrateExpiredCustomers();
        const sync = await this.syncNewExpiredCustomers();
        const cleanup = await this.cleanupNonExpiredCustomers();

        const overallSuccess = migration.success > 0 || sync.newRecordsAdded > 0 || cleanup.recordsRemoved > 0;

        console.log('🎉 Full migration process completed!', {
            migration,
            sync,
            cleanup,
            overallSuccess
        });

        return {
            migration,
            sync,
            cleanup,
            overallSuccess
        };
    }
}