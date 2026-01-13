import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pool from './db';

import customerRoutes from './routes/customerRoutes';
import paymentRoutes from './routes/paymentRoutes';

import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

import authRoutes from './routes/authRoutes';
import leadRoutes from './routes/leadRoutes';
import complaintRoutes from './routes/complaintRoutes';
import planRoutes from './routes/planRoutes';
import networkProviderRoutes from './routes/networkProviderRoutes';
import productRoutes from './routes/productRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import inventoryRoutes from './routes/inventoryRoutes';
import expenseRoutes from './routes/expenseRoutes';
import notificationRoutes from './routes/notificationRoutes';
import reportRoutes from './routes/reportRoutes';
import salesRoutes from './routes/salesRoutes';
// import uploadRoutes from './routes/uploadRoutes'; // Temporarily disabled until multer installs

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/plans', planRoutes);
app.use('/api/network-providers', networkProviderRoutes);
app.use('/api/products', productRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/sales', salesRoutes);
// app.use('/api/upload', uploadRoutes); // Temporarily disabled until multer installs

// Health Check
app.get('/', (req, res) => {
    res.send('Telecom API is running');
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
