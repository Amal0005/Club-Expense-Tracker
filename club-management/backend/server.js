import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import morgan from 'morgan';
import connectDB from './config/db.js';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import paymentRoutes from './routes/payments.js';
import expenseRoutes from './routes/expenses.js';
import errorHandler from './middleware/errorHandler.js';
import bcrypt from 'bcrypt';
import User from './models/User.js';

dotenv.config();
const app = express();

await connectDB();

// Ensure a static admin account exists (username: admin, email: admin@club.com, password: Admin@Nanma123)
async function ensureAdmin() {
  const username = 'admin';
  const email = 'admin@club.com';
  const password = 'Admin@Nanma123';
  const existing = await User.findOne({ username });
  if (!existing) {
    const passwordHash = await bcrypt.hash(password, 10);
    await User.create({ name: 'Admin', username, email, passwordHash, role: 'admin', fixedAmount: 0 });
    console.log('Default admin created: username="admin" password="Admin@Nanma123"');
  }
}
await ensureAdmin();

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/expenses', expenseRoutes);

app.use(errorHandler);

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`Server running on ${port}`));
