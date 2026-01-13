import { Request, Response } from 'express';
import pool from '../db';

export const getRecords = async (req: Request, res: Response) => {
    try {
        const { type } = req.params;

        // Sanitize table name to prevent SQL injection
        const allowedTypes = [
            'router_makes', 'router_macs', 'ont_makes', 'ont_types', 'ont_macs',
            'plans', 'olt_ips', 'employees', 'departments', 'designations', 'users', 'otts'
        ];

        if (!allowedTypes.includes(type)) {
            return res.status(400).send(`Invalid master record type: ${type}`);
        }

        const result = await pool.query(`SELECT * FROM ${type} ORDER BY created_at DESC`);
        res.json(result.rows);
    } catch (err: any) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

export const createRecord = async (req: Request, res: Response) => {
    try {
        const { type } = req.params;
        const { name, status } = req.body;

        const allowedTypes = [
            'router_makes', 'router_macs', 'ont_makes', 'ont_types', 'ont_macs',
            'plans', 'olt_ips', 'employees', 'departments', 'designations', 'users', 'otts'
        ];

        if (!allowedTypes.includes(type)) {
            return res.status(400).send(`Invalid master record type: ${type}`);
        }

        const result = await pool.query(
            `INSERT INTO ${type} (name, status) VALUES ($1, $2) RETURNING *`,
            [name, status || 'Active']
        );
        res.status(201).json(result.rows[0]);
    } catch (err: any) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

export const updateRecord = async (req: Request, res: Response) => {
    try {
        const { type, id } = req.params;
        const { name, status } = req.body;

        const allowedTypes = [
            'router_makes', 'router_macs', 'ont_makes', 'ont_types', 'ont_macs',
            'plans', 'olt_ips', 'employees', 'departments', 'designations', 'users', 'otts'
        ];

        if (!allowedTypes.includes(type)) {
            return res.status(400).send(`Invalid master record type: ${type}`);
        }

        const result = await pool.query(
            `UPDATE ${type} SET name = $1, status = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *`,
            [name, status, id]
        );
        res.json(result.rows[0]);
    } catch (err: any) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

export const deleteRecord = async (req: Request, res: Response) => {
    try {
        const { type, id } = req.params;

        const allowedTypes = [
            'router_makes', 'router_macs', 'ont_makes', 'ont_types', 'ont_macs',
            'plans', 'olt_ips', 'employees', 'departments', 'designations', 'users', 'otts'
        ];

        if (!allowedTypes.includes(type)) {
            return res.status(400).send(`Invalid master record type: ${type}`);
        }

        await pool.query(`DELETE FROM ${type} WHERE id = $1`, [id]);
        res.json({ message: 'Record deleted' });
    } catch (err: any) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};
