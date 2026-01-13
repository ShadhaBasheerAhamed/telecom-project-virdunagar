import { Request, Response } from 'express';
import pool from '../db';

export const getComplaints = async (req: Request, res: Response) => {
    try {
        const result = await pool.query('SELECT * FROM complaints ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (err: any) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

export const createComplaint = async (req: Request, res: Response) => {
    try {
        const { customer_id, customer_name, mobile_no, complaint_type, description, priority, status, assigned_to } = req.body;

        const result = await pool.query(
            'INSERT INTO complaints (customer_id, customer_name, mobile_no, complaint_type, description, priority, status, assigned_to, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW()) RETURNING *',
            [customer_id, customer_name, mobile_no, complaint_type, description, priority || 'Medium', status || 'Open', assigned_to]
        );

        res.status(201).json(result.rows[0]);
    } catch (err: any) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

export const updateComplaint = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const fields = Object.keys(updates);
        const values = Object.values(updates);

        const setClause = fields.map((field, index) => `${field} = $${index + 1}`).join(', ');

        const result = await pool.query(
            `UPDATE complaints SET ${setClause} WHERE id = $${fields.length + 1} RETURNING *`,
            [...values, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Complaint not found' });
        }

        res.json(result.rows[0]);
    } catch (err: any) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

export const deleteComplaint = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const result = await pool.query('DELETE FROM complaints WHERE id = $1 RETURNING *', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Complaint not found' });
        }

        res.json({ message: 'Complaint deleted successfully' });
    } catch (err: any) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};
