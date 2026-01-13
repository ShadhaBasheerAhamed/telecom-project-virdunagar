import pool from './db';

const createNotificationsTable = async () => {
    const client = await pool.connect();
    try {
        console.log("Creating notifications table...");
        const query = `
            CREATE TABLE IF NOT EXISTS notifications (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID,
                title TEXT NOT NULL,
                message TEXT NOT NULL,
                type TEXT CHECK (type IN ('info', 'success', 'warning', 'error')) DEFAULT 'info',
                link TEXT,
                read BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );

            CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
            CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
        `;
        await client.query(query);
        console.log("Notifications table created successfully.");
    } catch (err) {
        console.error("Error creating notifications table:", err);
    } finally {
        client.release();
        process.exit();
    }
};

createNotificationsTable();
