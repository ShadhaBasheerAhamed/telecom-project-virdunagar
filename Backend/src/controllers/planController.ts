import { Request, Response } from 'express';
import pool from '../db';

export const getPlans = async (req: Request, res: Response) => {
    try {
        const result = await pool.query('SELECT * FROM plans ORDER BY name');
        res.json(result.rows);
    } catch (err: any) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

export const createPlan = async (req: Request, res: Response) => {
    try {
        const { name, speed, price, validity, description, type } = req.body;

        const result = await pool.query(
            'INSERT INTO plans (name, speed, price, validity, description, type) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [name, speed, price, validity, description, type]
        );

        res.status(201).json(result.rows[0]);
    } catch (err: any) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

export const updatePlan = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const fields = Object.keys(updates);
        const values = Object.values(updates);

        const setClause = fields.map((field, index) => `${field} = $${index + 1}`).join(', ');

        const result = await pool.query(
            `UPDATE plans SET ${setClause} WHERE id = $${fields.length + 1} RETURNING *`,
            [...values, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Plan not found' });
        }

        res.json(result.rows[0]);
    } catch (err: any) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

export const deletePlan = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const result = await pool.query('DELETE FROM plans WHERE id = $1 RETURNING *', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Plan not found' });
        }

        res.json({ message: 'Plan deleted successfully' });
    } catch (err: any) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};
