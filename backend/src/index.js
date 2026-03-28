import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import paymentRoutes from './routes/payments.js';
import adminRoutes from './routes/admin.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());

// CORS Configuration - Permissive for debugging
app.use(cors({
  origin: true, // Allow all origins
  credentials: true
}));

// Health Check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Fablota Backend is running' });
});

// Routes
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);

// Error Handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[BACKEND] Server is successfully listening on 0.0.0.0:${PORT}`);
});
