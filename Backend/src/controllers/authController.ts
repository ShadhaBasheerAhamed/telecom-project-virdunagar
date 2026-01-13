import { Request, Response } from 'express';
import pool from '../db';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export const register = async (req: Request, res: Response) => {
    try {
        const { email, password, displayName, role } = req.body;

        const userCheck = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (userCheck.rows.length > 0) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        const newUser = await pool.query(
            'INSERT INTO users (email, password_hash, display_name, role) VALUES ($1, $2, $3, $4) RETURNING id, email, display_name, role',
            [email, passwordHash, displayName, role || 'viewer']
        );

        res.status(201).json(newUser.rows[0]);
    } catch (err: any) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        const user = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (user.rows.length === 0) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const validPassword = await bcrypt.compare(password, user.rows[0].password_hash);
        if (!validPassword) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { id: user.rows[0].id, role: user.rows[0].role },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            token,
            user: {
                id: user.rows[0].id,
                email: user.rows[0].email,
                displayName: user.rows[0].display_name,
                role: user.rows[0].role
            }
        });
    } catch (err: any) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

export const getMe = async (req: Request, res: Response) => {
    // Requires middleware to set req.user
    // For now, simple return
    res.json({ message: "User Info Placeholder" });
};
