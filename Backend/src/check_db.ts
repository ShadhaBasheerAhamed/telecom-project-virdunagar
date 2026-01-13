import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

// Load env from current directory
dotenv.config({ path: path.resolve(__dirname, '../.env') });

console.log("Checking DB Connection...");
console.log("Host:", process.env.DB_HOST);
console.log("User:", process.env.DB_USER);
console.log("DB:", process.env.DB_NAME);
console.log("Port:", process.env.DB_PORT);
// Don't log password

const pool = new Pool({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME,
});

async function check() {
    try {
        const res = await pool.query('SELECT NOW()');
        console.log('✅ Connected successfully:', res.rows[0]);

        const tableRes = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public'");
        console.log("Tables in DB:", tableRes.rows.map(r => r.table_name));

    } catch (err: any) {
        console.error('❌ Connection failed:', err.message);
    } finally {
        await pool.end();
    }
}

check();
