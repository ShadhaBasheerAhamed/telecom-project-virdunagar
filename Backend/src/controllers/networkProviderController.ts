import { Request, Response } from 'express';
import pool from '../db';

export const getNetworkProviders = async (req: Request, res: Response) => {
    try {
        const { status } = req.query;

        let query = 'SELECT * FROM network_providers';
        const params: any[] = [];

        if (status) {
            query += ' WHERE status = $1';
            params.push(status);
        }

        query += ' ORDER BY name';

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err: any) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

export const createNetworkProvider = async (req: Request, res: Response) => {
    try {
        const { name, type, contact_person, contact_number, email, address } = req.body;

        const result = await pool.query(
            'INSERT INTO network_providers (name, type, contact_person, contact_number, email, address) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [name, type, contact_person, contact_number, email, address]
        );

        res.status(201).json(result.rows[0]);
    } catch (err: any) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

export const updateNetworkProvider = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const fields = Object.keys(updates);
        const values = Object.values(updates);

        const setClause = fields.map((field, index) => `${field} = $${index + 1}`).join(', ');

        const result = await pool.query(
            `UPDATE network_providers SET ${setClause} WHERE id = $${fields.length + 1} RETURNING *`,
            [...values, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Network provider not found' });
        }

        res.json(result.rows[0]);
    } catch (err: any) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

export const deleteNetworkProvider = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const result = await pool.query('DELETE FROM network_providers WHERE id = $1 RETURNING *', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Network provider not found' });
        }

        res.json({ message: 'Network provider deleted successfully' });
    } catch (err: any) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};
