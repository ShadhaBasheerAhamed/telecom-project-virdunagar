import { Request, Response } from 'express';
import pool from '../db';

export const getExpenses = async (req: Request, res: Response) => {
    try {
        const { month, year } = req.query;

        let query = 'SELECT * FROM expenses';
        const params: any[] = [];

        if (month && year) {
            query += ' WHERE EXTRACT(MONTH FROM date) = $1 AND EXTRACT(YEAR FROM date) = $2';
            params.push(month, year);
        }

        query += ' ORDER BY date DESC';

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err: any) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

export const createExpense = async (req: Request, res: Response) => {
    try {
        const { category, description, amount, date, payment_mode } = req.body;

        const result = await pool.query(
            'INSERT INTO expenses (category, description, amount, date, payment_mode) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [category, description, amount, date || new Date(), payment_mode || 'Cash']
        );

        res.status(201).json(result.rows[0]);
    } catch (err: any) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

export const updateExpense = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const fields = Object.keys(updates);
        const values = Object.values(updates);

        const setClause = fields.map((field, index) => `${field} = $${index + 1}`).join(', ');

        const result = await pool.query(
            `UPDATE expenses SET ${setClause} WHERE id = $${fields.length + 1} RETURNING *`,
            [...values, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Expense not found' });
        }

        res.json(result.rows[0]);
    } catch (err: any) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

export const deleteExpense = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const result = await pool.query('DELETE FROM expenses WHERE id = $1 RETURNING *', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Expense not found' });
        }

        res.json({ message: 'Expense deleted successfully' });
    } catch (err: any) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// Get profit/loss summary for a specific month
export const getProfitLossSummary = async (req: Request, res: Response) => {
    try {
        const { month, year } = req.query;

        // Calculate total income from payments
        let incomeQuery = `
            SELECT 
                COALESCE(SUM(bill_amount), 0) as total_income,
                COUNT(*) as payment_count
            FROM payments 
            WHERE status = 'Paid'
        `;
        const incomeParams: any[] = [];

        if (month && year) {
            incomeQuery += ' AND EXTRACT(MONTH FROM paid_date) = $1 AND EXTRACT(YEAR FROM paid_date) = $2';
            incomeParams.push(month, year);
        }

        const incomeResult = await pool.query(incomeQuery, incomeParams);

        // Calculate total expenses
        let expenseQuery = `
            SELECT 
                COALESCE(SUM(amount), 0) as total_expenses,
                COUNT(*) as expense_count
            FROM expenses
        `;
        const expenseParams: any[] = [];

        if (month && year) {
            expenseQuery += ' WHERE EXTRACT(MONTH FROM date) = $1 AND EXTRACT(YEAR FROM date) = $2';
            expenseParams.push(month, year);
        }

        const expenseResult = await pool.query(expenseQuery, expenseParams);

        const totalIncome = Number(incomeResult.rows[0].total_income) || 0;
        const totalExpenses = Number(expenseResult.rows[0].total_expenses) || 0;
        const netProfit = totalIncome - totalExpenses;
        const profitMargin = totalIncome > 0 ? ((netProfit / totalIncome) * 100).toFixed(2) : 0;

        res.json({
            total_income: totalIncome,
            total_expenses: totalExpenses,
            net_profit: netProfit,
            profit_margin: profitMargin,
            payment_count: incomeResult.rows[0].payment_count,
            expense_count: expenseResult.rows[0].expense_count
        });
    } catch (err: any) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};
