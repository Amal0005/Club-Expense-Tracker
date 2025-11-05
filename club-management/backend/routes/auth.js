import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import nodemailer from 'nodemailer';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// In-memory pending OTP store for signup by email: email -> { hash, exp }
const pendingEmailOtps = new Map();

// Send OTP to email for signup
router.post('/request-signup-otp-email', async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });
    const emailLower = String(email).toLowerCase();
    const exists = await User.findOne({ email: emailLower });
    if (exists) return res.status(409).json({ message: 'Email already in use' });

    const code = String(Math.floor(100000 + Math.random() * 900000));
    const hash = await bcrypt.hash(code, 10);
    const exp = new Date(Date.now() + 5 * 60 * 1000);
    pendingEmailOtps.set(emailLower, { hash, exp });

    // SMTP config from env
    const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM } = process.env;
    let sent = false;
    if (SMTP_HOST && SMTP_PORT && SMTP_USER && SMTP_PASS) {
      const transporter = nodemailer.createTransport({
        host: SMTP_HOST,
        port: Number(SMTP_PORT),
        secure: Number(SMTP_PORT) === 465,
        auth: { user: SMTP_USER, pass: SMTP_PASS },
      });
      await transporter.sendMail({
        from: SMTP_FROM || SMTP_USER,
        to: emailLower,
        subject: 'Your Signup OTP',
        text: `Your OTP is: ${code}. It expires in 5 minutes.`,
      });
      sent = true;
    }
    if (!sent && process.env.NODE_ENV !== 'production') {
      console.log(`[SIGNUP EMAIL OTP] Email: ${emailLower} Code: ${code}`);
    }
    res.json({ message: 'OTP sent to email' });
  } catch (e) { next(e); }
});

// Public signup is disabled; users are created by admin
router.post('/signup', (req, res) => {
  return res.status(403).json({ message: 'Signup disabled. Contact admin for an account.' });
});

router.post('/login', async (req, res, next) => {
  try {
    const { username, password } = req.body;
    const uname = String(username || '').toLowerCase();
    const user = await User.findOne({ username: uname });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ message: 'Invalid credentials' });
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, name: user.name, role: user.role, fixedAmount: user.fixedAmount, avatarUrl: user.avatarUrl } });
  } catch (e) { next(e); }
});

// Get current user using token
router.get('/me', auth, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('name role fixedAmount avatarUrl');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ id: user._id, name: user.name, role: user.role, fixedAmount: user.fixedAmount, avatarUrl: user.avatarUrl });
  } catch (e) { next(e); }
});

export default router;
