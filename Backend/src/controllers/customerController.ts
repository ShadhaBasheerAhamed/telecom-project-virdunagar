import { Request, Response } from 'express';
import pool from '../db';

// Get all customers
export const getCustomers = async (req: Request, res: Response) => {
    try {
        const result = await pool.query('SELECT * FROM customers ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (err) {
        if (err instanceof Error) {
            console.error(err.message);
            res.status(500).send('Server Error');
        } else {
            res.status(500).send('Unknown Server Error');
        }
    }
};

// Add a new customer
export const createCustomer = async (req: Request, res: Response) => {
    try {
        const {
            landline, name, email, mobileNo, altMobileNo,
            vlanId, bbId, voipPassword,
            ontMake, ontType, ontMacAddress, ontBillNo, ont, offerPrize,
            routerMake, routerMacId, oltIp,
            installationDate, status, planStatus, ottSubscription,
            source, plan, address, walletBalance, pendingAmount, renewalDate
        } = req.body;

        const newCustomer = await pool.query(
            `INSERT INTO customers (
                landline, name, email, mobile_no, alt_mobile_no,
                vlan_id, bb_id, voip_password, 
                ont_make, ont_type, ont_mac_address, ont_bill_no, ont, offer_prize,
                router_make, router_mac_id, olt_ip, 
                installation_date, status, plan_status, ott_subscription,
                source, plan, address, wallet_balance, pending_amount, renewal_date
            ) VALUES (
                $1, $2, $3, $4, $5, 
                $6, $7, $8, 
                $9, $10, $11, $12, $13, $14,
                $15, $16, $17,
                $18, $19, $20, $21,
                $22, $23, $24, $25, $26, $27
            ) RETURNING *`,
            [
                landline, name, email, mobileNo, altMobileNo,
                vlanId, bbId, voipPassword,
                ontMake, ontType, ontMacAddress, ontBillNo, ont, offerPrize,
                routerMake, routerMacId, oltIp,
                installationDate, status, planStatus, ottSubscription,
                source, plan, address, walletBalance || 0, pendingAmount || 0, renewalDate
            ]
        );

        res.json(newCustomer.rows[0]);
    } catch (err) {
        if (err instanceof Error) {
            console.error(err.message);
            res.status(500).send('Server Error');
        }
    }
};

// Update a customer
export const updateCustomer = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        // This is a simplified update to demonstrate. Ideally, build dynamic query.
        const {
            customer_name, mobile_no, status
        } = req.body;

        // In production, we'd loop through keys to build the SET clause dynamically.
        // For now, I'll update a few key fields as an example or use a dynamic approach.

        // Dynamic Update Builder
        const updates = req.body;
        const keys = Object.keys(updates);
        const values = Object.values(updates);

        if (keys.length === 0) return res.status(400).send("No updates provided");

        const setClause = keys.map((key, index) => `${key} = $${index + 2}`).join(', ');

        const query = `UPDATE customers SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`;

        const result = await pool.query(query, [id, ...values]);

        if (result.rows.length === 0) {
            return res.status(404).send("Customer not found");
        }

        res.json(result.rows[0]);
    } catch (err) {
        if (err instanceof Error) {
            console.error(err.message);
            res.status(500).send('Server Error');
        }
    }
};

// Delete a customer
export const deleteCustomer = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const deleteCustomer = await pool.query('DELETE FROM customers WHERE id = $1', [id]);

        if (deleteCustomer.rowCount === 0) { // Check rowCount instead of rows for DELETE
            return res.status(404).send("Customer not found");
        }

        res.json("Customer was deleted!");
    } catch (err) {
        if (err instanceof Error) {
            console.error(err.message);
            res.status(500).send('Server Error');
        }
    }
};
