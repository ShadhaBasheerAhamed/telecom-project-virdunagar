import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

console.log("Initializing DB Pool...");
console.log("DB Host:", process.env.DB_HOST);
console.log("DB User:", process.env.DB_USER);
console.log("DB Name:", process.env.DB_NAME);

const pool = new Pool({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME,
});

export default pool;
