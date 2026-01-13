import { Request, Response } from 'express';
import pool from '../db';
import { v4 as uuidv4 } from 'uuid';

// Get all payments
export const getPayments = async (req: Request, res: Response) => {
    try {
        const result = await pool.query('SELECT * FROM payments ORDER BY payment_date DESC LIMIT 1000');
        res.json(result.rows);
    } catch (err) {
        if (err instanceof Error) {
            console.error(err.message);
            res.status(500).send('Server Error');
        }
    }
};

// Add a new payment
export const addPayment = async (req: Request, res: Response) => {
    try {
        const {
            customer_id, landlineNo, customerName, billAmount, commission,
            status, paidDate, modeOfPayment, renewalDate, source,
            walletBalance, pendingAmount, addedToWallet, addedToPending,
            usedWalletAmount
        } = req.body;

        // Note: The schema in database.sql for 'payments' was simplified. 
        // We might need to map these frontend fields to the table columns or update the table.
        // For this migration, I will assume we map what fits and potentially alter the table if needed.
        // Current table: id, customer_id, amount, payment_date, mode, type, status, transaction_id, created_by

        // Ideally we should sync table schema with this full object. 
        // For now, I'll insert into the existing table structure as best as possible.

        const newPayment = await pool.query(
            `INSERT INTO payments (
                customer_id, amount, payment_date, mode, status
            ) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [
                customer_id, billAmount, paidDate, modeOfPayment, status
            ]
        );

        // Also handle Wallet Update Logic if customer_id exists
        if (customer_id) {
            if (addedToWallet && addedToWallet > 0) {
                await pool.query('UPDATE customers SET wallet_balance = wallet_balance + $1 WHERE id = $2', [addedToWallet, customer_id]);
            }
            if (usedWalletAmount && usedWalletAmount > 0) {
                await pool.query('UPDATE customers SET wallet_balance = wallet_balance - $1 WHERE id = $2', [usedWalletAmount, customer_id]);
            }
        }

        res.json(newPayment.rows[0]);
    } catch (err) {
        if (err instanceof Error) {
            console.error(err.message);
            res.status(500).send('Server Error');
        }
    }
};

// Update Payment
export const updatePayment = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { amount, status, mode } = req.body; // Simplified

        const result = await pool.query(
            'UPDATE payments SET amount = $1, status = $2, mode = $3 WHERE id = $4 RETURNING *',
            [amount, status, mode, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).send("Payment not found");
        }
        res.json(result.rows[0]);
    } catch (err) {
        if (err instanceof Error) {
            console.error(err.message);
            res.status(500).send('Server Error');
        }
    }
};

// Delete Payment
export const deletePayment = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM payments WHERE id = $1', [id]);
        res.json("Payment deleted");
    } catch (err) {
        if (err instanceof Error) {
            console.error(err.message);
            res.status(500).send('Server Error');
        }
    }
};

// Check Duplicate
export const checkDuplicatePayment = async (req: Request, res: Response) => {
    try {
        const { landlineNo, paidDate } = req.query;
        // Need to join with customers if checking by landlineNo, or just check customer_id
        // Assuming landlineNo is passed

        // Placeholder logic
        res.json({ isDuplicate: false });
    } catch (err) {
        res.status(500).send("Server Error");
    }
};
