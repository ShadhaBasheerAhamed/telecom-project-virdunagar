import {
    collection,
    doc,
    addDoc,
    updateDoc,
    deleteDoc,
    getDocs,
    query,
    where,
    orderBy,
    limit,
    onSnapshot,
    writeBatch,
    Timestamp,
    setDoc,
    getDoc
} from '../firebase/config';
import { db } from '../firebase/config';

const EXPIRED_OVERVIEW_COLLECTION = 'expired_overview';

export interface ExpiredOverview {
    id?: string;
    customerId: string;
    customerName: string;
    planType: string;
    expiredDate: string;
    reason: string;
    source: string;
    createdAt: string;
    updatedAt?: string;
}

export const ExpiredOverviewService = {

    // Add Expired Overview Record
    addExpiredRecord: async (expiredRecord: Omit<ExpiredOverview, 'id'>): Promise<string> => {
        try {
            const docRef = await addDoc(collection(db, EXPIRED_OVERVIEW_COLLECTION), {
                ...expiredRecord,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });
            return docRef.id;
        } catch (error) {
            console.error('Error adding expired record:', error);
            throw new Error('Failed to add expired record');
        }
    },

    // Update Expired Overview Record
    updateExpiredRecord: async (id: string, updates: Partial<ExpiredOverview>): Promise<void> => {
        try {
            const docRef = doc(db, EXPIRED_OVERVIEW_COLLECTION, id);
            await updateDoc(docRef, {
                ...updates,
                updatedAt: new Date().toISOString()
            });
        } catch (error) {
            console.error('Error updating expired record:', error);
            throw new Error('Failed to update expired record');
        }
    },

    // Delete Expired Overview Record
    deleteExpiredRecord: async (id: string): Promise<void> => {
        try {
            const docRef = doc(db, EXPIRED_OVERVIEW_COLLECTION, id);
            await deleteDoc(docRef);
        } catch (error) {
            console.error('Error deleting expired record:', error);
            throw new Error('Failed to delete expired record');
        }
    },

    // Get All Expired Records
    getExpiredRecords: async (): Promise<ExpiredOverview[]> => {
        try {
            const q = query(
                collection(db, EXPIRED_OVERVIEW_COLLECTION),
                orderBy('expiredDate', 'desc'),
                limit(1000)
            );
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ExpiredOverview));
        } catch (error) {
            console.error('Error fetching expired records:', error);
            return [];
        }
    },

    // Get Expired Records by Date Range
    getExpiredRecordsByDateRange: async (startDate: Date, endDate: Date): Promise<ExpiredOverview[]> => {
        try {
            const q = query(
                collection(db, EXPIRED_OVERVIEW_COLLECTION),
                where('expiredDate', '>=', startDate.toISOString().split('T')[0]),
                where('expiredDate', '<=', endDate.toISOString().split('T')[0]),
                orderBy('expiredDate', 'desc')
            );
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ExpiredOverview));
        } catch (error) {
            console.error('Error fetching expired records by date range:', error);
            return [];
        }
    },

    // Get Expired Records by Source
    getExpiredRecordsBySource: async (source: string): Promise<ExpiredOverview[]> => {
        try {
            const q = query(
                collection(db, EXPIRED_OVERVIEW_COLLECTION),
                where('source', '==', source),
                orderBy('expiredDate', 'desc')
            );
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ExpiredOverview));
        } catch (error) {
            console.error('Error fetching expired records by source:', error);
            return [];
        }
    },

    // Get Expired Records by Reason
    getExpiredRecordsByReason: async (reason: string): Promise<ExpiredOverview[]> => {
        try {
            const q = query(
                collection(db, EXPIRED_OVERVIEW_COLLECTION),
                where('reason', '==', reason),
                orderBy('expiredDate', 'desc')
            );
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ExpiredOverview));
        } catch (error) {
            console.error('Error fetching expired records by reason:', error);
            return [];
        }
    },

    // Subscribe to Expired Records (Real-time)
    subscribeToExpiredRecords: (callback: (records: ExpiredOverview[]) => void) => {
        const q = query(
            collection(db, EXPIRED_OVERVIEW_COLLECTION),
            orderBy('expiredDate', 'desc'),
            limit(100)
        );

        return onSnapshot(q, (snapshot) => {
            const records = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as ExpiredOverview[];

            callback(records);
        });
    },

    // Subscribe to Expired Records by Date Range (Real-time)
    subscribeToExpiredRecordsByDateRange: (
        startDate: Date,
        endDate: Date,
        callback: (records: ExpiredOverview[]) => void
    ) => {
        const q = query(
            collection(db, EXPIRED_OVERVIEW_COLLECTION),
            where('expiredDate', '>=', startDate.toISOString().split('T')[0]),
            where('expiredDate', '<=', endDate.toISOString().split('T')[0]),
            orderBy('expiredDate', 'desc')
        );

        return onSnapshot(q, (snapshot) => {
            const records = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as ExpiredOverview[];

            callback(records);
        });
    },

    // Get Chart Data for Expired Overview (for Dashboard) - Updated with source filtering
    getExpiredChartData: async (startDate: Date, endDate: Date, groupPeriod: 'day' | 'week' | 'month' | 'year' = 'day', dataSource: string = 'All'): Promise<any[]> => {
        try {
            let records = await ExpiredOverviewService.getExpiredRecordsByDateRange(startDate, endDate);
            
            // Filter by source if not 'All'
            if (dataSource !== 'All') {
                records = records.filter(record => record.source === dataSource);
            }
            
            const groupedData: { [key: string]: number } = {};
            
            records.forEach(record => {
                const date = new Date(record.expiredDate);
                let key = '';
                
                switch (groupPeriod) {
                    case 'day':
                        key = date.getDate().toString();
                        break;
                    case 'week':
                        const weekStart = new Date(date);
                        weekStart.setDate(date.getDate() - date.getDay());
                        key = `${weekStart.getDate()}/${weekStart.getMonth() + 1}`;
                        break;
                    case 'month':
                        key = date.toLocaleString('default', { month: 'short' });
                        break;
                    case 'year':
                        key = date.toLocaleString('default', { month: 'short' });
                        break;
                }
                
                groupedData[key] = (groupedData[key] || 0) + 1;
            });
            
            return Object.entries(groupedData).map(([name, value]) => ({ name, value }));
        } catch (error) {
            console.error('Error generating expired chart data:', error);
            return [];
        }
    },

    // Get Expired Overview Statistics
    getExpiredOverviewStats: async () => {
        try {
            const records = await ExpiredOverviewService.getExpiredRecords();
            
            const stats = {
                totalExpired: records.length,
                byReason: {} as Record<string, number>,
                bySource: {} as Record<string, number>,
                byPlan: {} as Record<string, number>,
                thisMonth: 0,
                lastMonth: 0
            };

            const now = new Date();
            const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
            const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

            records.forEach(record => {
                // Count by reason
                stats.byReason[record.reason] = (stats.byReason[record.reason] || 0) + 1;

                // Count by source
                stats.bySource[record.source] = (stats.bySource[record.source] || 0) + 1;

                // Count by plan
                stats.byPlan[record.planType] = (stats.byPlan[record.planType] || 0) + 1;

                // Count by month
                const expiredDate = new Date(record.expiredDate);
                if (expiredDate >= thisMonthStart) {
                    stats.thisMonth++;
                } else if (expiredDate >= lastMonthStart && expiredDate <= lastMonthEnd) {
                    stats.lastMonth++;
                }
            });

            return stats;
        } catch (error) {
            console.error('Error calculating expired overview stats:', error);
            return {
                totalExpired: 0,
                byReason: {},
                bySource: {},
                byPlan: {},
                thisMonth: 0,
                lastMonth: 0
            };
        }
    },

    // Clear All Expired Records (for migration/reset)
    clearAllExpiredRecords: async (): Promise<{ success: number; failed: number; errors: string[] }> => {
        try {
            const records = await ExpiredOverviewService.getExpiredRecords();
            const batchSize = 500;
            let success = 0;
            let failed = 0;
            const errors: string[] = [];

            for (let i = 0; i < records.length; i += batchSize) {
                const batch = writeBatch(db);
                const chunk = records.slice(i, i + batchSize);

                chunk.forEach((record) => {
                    if (record.id) {
                        const docRef = doc(db, EXPIRED_OVERVIEW_COLLECTION, record.id);
                        batch.delete(docRef);
                    }
                });

                try {
                    await batch.commit();
                    success += chunk.length;
                } catch (error) {
                    failed += chunk.length;
                    errors.push(`Batch ${Math.floor(i / batchSize) + 1} failed: ${error}`);
                }
            }

            console.log(`Expired records cleanup completed: ${success} success, ${failed} failed`);
            return { success, failed, errors };
        } catch (error) {
            console.error('Failed to clear expired records:', error);
            return { success: 0, failed: 0, errors: [error instanceof Error ? error.message : 'Unknown error'] };
        }
    }
};