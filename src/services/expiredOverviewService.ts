import { CustomerService } from './customerService';

export class ExpiredOverviewService {

    static async getExpiredChartData(startDate: Date, endDate: Date, groupPeriod: 'day' | 'week' | 'month' | 'year', dataSource: string = 'All') {
        try {
            // Get all customers and filter expired ones
            const customers = await CustomerService.getCustomers();

            const expiredCustomers = customers.filter(customer => {
                if (customer.status?.toLowerCase() !== 'expired') return false;
                if (dataSource !== 'All' && customer.source !== dataSource) return false;

                // Check if expired within date range
                if (customer.renewalDate) {
                    const renewalDate = new Date(customer.renewalDate);
                    return renewalDate >= startDate && renewalDate <= endDate;
                }
                return false;
            });

            // Group by period
            const grouped: { [key: string]: number } = {};

            expiredCustomers.forEach(customer => {
                const date = new Date(customer.renewalDate!);
                let key: string;

                if (groupPeriod === 'day') {
                    key = date.toISOString().split('T')[0];
                } else if (groupPeriod === 'month') {
                    key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                } else {
                    key = date.getFullYear().toString();
                }

                grouped[key] = (grouped[key] || 0) + 1;
            });

            return Object.entries(grouped).map(([name, value]) => ({ name, value }));
        } catch (error) {
            console.error('Error getting expired chart data:', error);
            return [];
        }
    }

    static subscribeToExpiredData(callback: (data: any) => void) {
        const fetchData = async () => {
            const data = await this.getExpiredChartData(
                new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                new Date(),
                'day'
            );
            callback(data);
        };

        fetchData();
        const interval = setInterval(fetchData, 10000); // Poll every 10 seconds

        return () => clearInterval(interval);
    }
}