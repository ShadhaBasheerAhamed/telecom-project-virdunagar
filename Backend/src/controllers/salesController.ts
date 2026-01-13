import { Request, Response } from 'express';
import pool from '../db';

export const getSales = async (req: Request, res: Response) => {
    try {
        const { start_date, end_date } = req.query;

        let query = 'SELECT * FROM sales';
        const params: any[] = [];

        if (start_date && end_date) {
            query += ' WHERE date BETWEEN $1 AND $2';
            params.push(start_date, end_date);
        }

        query += ' ORDER BY date DESC';

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err: any) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

export const createSale = async (req: Request, res: Response) => {
    try {
        const { customer_name, customer_phone, customer_email, items, total_amount, date } = req.body;

        const result = await pool.query(
            'INSERT INTO sales (customer_name, customer_phone, customer_email, items, total_amount, date) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [customer_name, customer_phone, customer_email, JSON.stringify(items), total_amount, date || new Date()]
        );

        res.status(201).json(result.rows[0]);
    } catch (err: any) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

export const deleteSale = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const result = await pool.query('DELETE FROM sales WHERE id = $1 RETURNING *', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Sale not found' });
        }

        res.json({ message: 'Sale deleted successfully' });
    } catch (err: any) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};
