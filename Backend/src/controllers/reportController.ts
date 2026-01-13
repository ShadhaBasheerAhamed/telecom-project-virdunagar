import { Request, Response } from 'express';
import pool from '../db';

export const getReportSummary = async (req: Request, res: Response) => {
    try {
        const { start_date, end_date } = req.query;

        // Get customer counts
        const customerStats = await pool.query(`
            SELECT 
                COUNT(*) as total,
                COUNT(*) FILTER (WHERE status = 'Active') as active,
                COUNT(*) FILTER (WHERE status = 'Expired') as expired
            FROM customers
        `);

        // Get payment stats for date range
        let paymentQuery = 'SELECT COUNT(*) as count, COALESCE(SUM(bill_amount), 0) as total FROM payments WHERE status = \'Paid\'';
        const params: any[] = [];

        if (start_date && end_date) {
            paymentQuery += ' AND paid_date BETWEEN $1 AND $2';
            params.push(start_date, end_date);
        }

        const paymentStats = await pool.query(paymentQuery, params);

        // Get leads stats
        const leadsStats = await pool.query('SELECT COUNT(*) as total FROM leads');

        res.json({
            customers: customerStats.rows[0],
            payments: paymentStats.rows[0],
            leads: leadsStats.rows[0]
        });
    } catch (err: any) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

export const getRevenueReport = async (req: Request, res: Response) => {
    try {
        const { start_date, end_date, group_by } = req.query;

        let groupByClause = 'DATE(paid_date)';
        if (group_by === 'month') {
            groupByClause = 'TO_CHAR(paid_date, \'YYYY-MM\')';
        } else if (group_by === 'year') {
            groupByClause = 'EXTRACT(YEAR FROM paid_date)';
        }

        let query = `
            SELECT 
                ${groupByClause} as period,
                COUNT(*) as payment_count,
                COALESCE(SUM(bill_amount), 0) as total_revenue
            FROM payments
            WHERE status = 'Paid'
        `;

        const params: any[] = [];

        if (start_date && end_date) {
            query += ' AND paid_date BETWEEN $1 AND $2';
            params.push(start_date, end_date);
        }

        query += ` GROUP BY ${groupByClause} ORDER BY period`;

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err: any) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

export const getCustomerReport = async (req: Request, res: Response) => {
    try {
        const { status, source } = req.query;

        let query = 'SELECT * FROM customers WHERE 1=1';
        const params: any[] = [];

        if (status) {
            query += ` AND status = $${params.length + 1}`;
            params.push(status);
        }

        if (source) {
            query += ` AND source = $${params.length + 1}`;
            params.push(source);
        }

        query += ' ORDER BY created_at DESC LIMIT 1000';

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err: any) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

export const getPaymentReport = async (req: Request, res: Response) => {
    try {
        const { start_date, end_date, status } = req.query;

        let query = 'SELECT * FROM payments WHERE 1=1';
        const params: any[] = [];

        if (start_date && end_date) {
            query += ` AND paid_date BETWEEN $${params.length + 1} AND $${params.length + 2}`;
            params.push(start_date, end_date);
        }

        if (status) {
            query += ` AND status = $${params.length + 1}`;
            params.push(status);
        }

        query += ' ORDER BY paid_date DESC LIMIT 1000';

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err: any) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};
