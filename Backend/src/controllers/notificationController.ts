import { Request, Response } from 'express';
import pool from '../db';

export const getNotifications = async (req: Request, res: Response) => {
    try {
        const { user_id, unread_only } = req.query;

        let query = 'SELECT * FROM notifications';
        const params: any[] = [];
        const conditions: string[] = [];

        if (user_id) {
            conditions.push(`user_id = $${params.length + 1}`);
            params.push(user_id);
        }

        if (unread_only === 'true') {
            conditions.push(`read = false`);
        }

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }

        query += ' ORDER BY created_at DESC';

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err: any) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

export const createNotification = async (req: Request, res: Response) => {
    try {
        const { user_id, title, message, type, link } = req.body;

        const result = await pool.query(
            'INSERT INTO notifications (user_id, title, message, type, link, read) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [user_id, title, message, type || 'info', link || null, false]
        );

        res.status(201).json(result.rows[0]);
    } catch (err: any) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

export const markAsRead = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            'UPDATE notifications SET read = true WHERE id = $1 RETURNING *',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Notification not found' });
        }

        res.json(result.rows[0]);
    } catch (err: any) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

export const deleteNotification = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const result = await pool.query('DELETE FROM notifications WHERE id = $1 RETURNING *', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Notification not found' });
        }

        res.json({ message: 'Notification deleted successfully' });
    } catch (err: any) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};
