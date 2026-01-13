const { Pool } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME,
});

async function seedUser() {
    try {
        console.log("Seeding Admin User...");

        const email = "admin@example.com";
        const password = "password123";
        const displayName = "Super Admin";
        const role = "admin";

        // Check if exists
        const check = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (check.rows.length > 0) {
            console.log("✅ Admin user already exists.");
            await pool.end();
            return;
        }

        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);

        const res = await pool.query(
            'INSERT INTO users (email, password_hash, display_name, role) VALUES ($1, $2, $3, $4) RETURNING *',
            [email, hash, displayName, role]
        );

        console.log("✅ Admin User Created:", res.rows[0].email);

    } catch (err) {
        console.error("❌ Seeding Failed:", err.message);
    } finally {
        await pool.end();
    }
}

seedUser();
