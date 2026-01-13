import { Request, Response } from 'express';
import pool from '../db';

export const getDashboardStats = async (req: Request, res: Response) => {
    try {
        // Customer Stats - handle if table is empty or doesn't exist
        let customerStats;
        try {
            customerStats = await pool.query(`
                SELECT 
                    COUNT(*) as total,
                    COUNT(*) FILTER (WHERE status = 'Active') as active,
                    COUNT(*) FILTER (WHERE status = 'Inactive') as inactive,
                    COUNT(*) FILTER (WHERE status = 'Suspended') as suspended,
                    COUNT(*) FILTER (WHERE status = 'Expired') as expired
                FROM customers
            `);
        } catch (err) {
            customerStats = { rows: [{ total: 0, active: 0, inactive: 0, suspended: 0, expired: 0 }] };
        }

        // Payment Stats
        let paymentStats;
        try {
            paymentStats = await pool.query(`
                SELECT 
                    COUNT(*) FILTER (WHERE status = 'Paid') as completed_payments,
                    COUNT(*) FILTER (WHERE status = 'Unpaid') as pending_payments,
                    COALESCE(SUM(bill_amount) FILTER (WHERE status = 'Paid'), 0) as total_revenue,
                    COALESCE(SUM(bill_amount) FILTER (WHERE status = 'Paid' AND DATE(paid_date) = CURRENT_DATE), 0) as today_collection
                FROM payments
            `);
        } catch (err) {
            paymentStats = { rows: [{ completed_payments: 0, pending_payments: 0, total_revenue: 0, today_collection: 0 }] };
        }

        // Monthly Revenue
        let monthlyRevenue;
        try {
            monthlyRevenue = await pool.query(`
                SELECT COALESCE(SUM(bill_amount), 0) as monthly_revenue
                FROM payments
                WHERE status = 'Paid' 
                AND EXTRACT(MONTH FROM paid_date) = EXTRACT(MONTH FROM CURRENT_DATE)
                AND EXTRACT(YEAR FROM paid_date) = EXTRACT(YEAR FROM CURRENT_DATE)
            `);
        } catch (err) {
            monthlyRevenue = { rows: [{ monthly_revenue: 0 }] };
        }

        // Leads Stats
        let leadsStats;
        try {
            leadsStats = await pool.query(`
                SELECT 
                    COUNT(*) as total_leads,
                    COUNT(*) FILTER (WHERE status = 'New') as new_leads
                FROM leads
            `);
        } catch (err) {
            leadsStats = { rows: [{ total_leads: 0, new_leads: 0 }] };
        }

        // Complaints Stats
        let complaintsStats;
        try {
            complaintsStats = await pool.query(`
                SELECT 
                    COUNT(*) FILTER (WHERE status = 'Open') as open_complaints,
                    COUNT(*) FILTER (WHERE status = 'Resolved') as resolved_complaints,
                    COUNT(*) FILTER (WHERE status = 'Pending') as pending_complaints
                FROM complaints
            `);
        } catch (err) {
            complaintsStats = { rows: [{ open_complaints: 0, resolved_complaints: 0, pending_complaints: 0 }] };
        }

        // New Customers Today
        let newToday;
        try {
            newToday = await pool.query(`
                SELECT COUNT(*) as new_today
                FROM customers
                WHERE DATE(created_at) = CURRENT_DATE
            `);
        } catch (err) {
            newToday = { rows: [{ new_today: 0 }] };
        }

        const stats = {
            customers: customerStats.rows[0] || { total: 0, active: 0, inactive: 0, suspended: 0, expired: 0 },
            payments: {
                ...(paymentStats.rows[0] || { completed_payments: 0, pending_payments: 0, total_revenue: 0, today_collection: 0 }),
                monthly_revenue: monthlyRevenue.rows[0]?.monthly_revenue || 0
            },
            leads: leadsStats.rows[0] || { total_leads: 0, new_leads: 0 },
            complaints: complaintsStats.rows[0] || { open_complaints: 0, resolved_complaints: 0, pending_complaints: 0 },
            new_today: newToday.rows[0]?.new_today || 0
        };

        res.json(stats);
    } catch (err: any) {
        console.error('Dashboard stats error:', err.message);
        // Return empty stats instead of error
        res.json({
            customers: { total: 0, active: 0, inactive: 0, suspended: 0, expired: 0 },
            payments: { completed_payments: 0, pending_payments: 0, total_revenue: 0, today_collection: 0, monthly_revenue: 0 },
            leads: { total_leads: 0, new_leads: 0 },
            complaints: { open_complaints: 0, resolved_complaints: 0, pending_complaints: 0 },
            new_today: 0
        });
    }
};

export const getRevenueChart = async (req: Request, res: Response) => {
    try {
        const result = await pool.query(`
            SELECT 
                TO_CHAR(paid_date, 'YYYY-MM') as month,
                COALESCE(SUM(bill_amount), 0) as revenue,
                COUNT(*) as payment_count
            FROM payments
            WHERE status = 'Paid' AND paid_date IS NOT NULL
            GROUP BY TO_CHAR(paid_date, 'YYYY-MM')
            ORDER BY month DESC
            LIMIT 12
        `);

        res.json(result.rows);
    } catch (err: any) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

export const getCustomerGrowth = async (req: Request, res: Response) => {
    try {
        const result = await pool.query(`
            SELECT 
                DATE(created_at) as date,
                COUNT(*) as new_customers
            FROM customers
            WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
            GROUP BY DATE(created_at)
            ORDER BY date
        `);

        res.json(result.rows);
    } catch (err: any) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

export const getPaymentModeDistribution = async (req: Request, res: Response) => {
    try {
        const result = await pool.query(`
            SELECT 
                mode_of_payment as mode,
                COUNT(*) as count,
                COALESCE(SUM(bill_amount), 0) as amount
            FROM payments
            WHERE status = 'Paid'
            GROUP BY mode_of_payment
            ORDER BY amount DESC
        `);

        res.json(result.rows);
    } catch (err: any) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};
