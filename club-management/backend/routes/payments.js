import express from 'express';
import multer from 'multer';
import { auth } from '../middleware/auth.js';
import { requireRole } from '../middleware/roles.js';
import Payment from '../models/Payment.js';
import User from '../models/User.js';
import cloudinary from '../config/cloudinary.js';

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_, file, cb) => {
    const ok = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'].includes(file.mimetype);
    cb(ok ? null : new Error('Only PNG/JPEG/PDF allowed'), ok);
  }
});

router.use(auth);

router.get('/me', async (req, res, next) => {
  try {
    const payments = await Payment.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json(payments);
  } catch (e) { next(e); }
});

// Admin: payments of a specific user
router.get('/user/:id', requireRole('admin'), async (req, res, next) => {
  try {
    const payments = await Payment.find({ user: req.params.id }).sort({ createdAt: -1 });
    res.json(payments);
  } catch (e) { next(e); }
});

router.post('/submit', upload.single('proof'), async (req, res, next) => {
  try {
    const { month, amount } = req.body;
    // Validate month format YYYY-MM
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(String(month || ''))) {
      return res.status(400).json({ message: 'month must be in format YYYY-MM' });
    }
    const user = await User.findById(req.user.id);
    const existing = await Payment.findOne({ user: req.user.id, month });
    let finalAmount;
    const provided = amount !== undefined && amount !== null && String(amount) !== '' ? Number(amount) : undefined;
    if (Number.isFinite(provided) && provided > 0) {
      finalAmount = provided;
    } else if (existing && Number.isFinite(existing.amount) && existing.amount > 0) {
      finalAmount = existing.amount;
    } else if (Number.isFinite(user.fixedAmount) && user.fixedAmount > 0) {
      finalAmount = user.fixedAmount;
    } else {
      // default gracefully when no positive amount is known; admin can adjust on approval
      finalAmount = 0;
    }

    let proofUrl;
    if (req.file) {
      const buffer = req.file.buffer;
      const originalname = req.file.originalname || 'payment-proof';
      const result = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: 'club-management/payments', resource_type: 'auto', filename_override: originalname, use_filename: true, unique_filename: true },
          (error, r) => error ? reject(error) : resolve(r)
        );
        stream.end(buffer);
      });
      proofUrl = result?.secure_url;
    }
    const update = {
      amount: finalAmount,
      status: 'pending',
      proofPath: proofUrl || undefined
    };
    const payment = await Payment.findOneAndUpdate(
      { user: req.user.id, month },
      update,
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    res.status(201).json(payment);
  } catch (e) { next(e); }
});

router.get('/', async (req, res, next) => {
  try {
    const { status } = req.query;
    const query = status ? { status } : {};
    const results = await Payment.find(query).populate('user', 'name email username avatarUrl').sort({ createdAt: -1 });
    res.json(results);
  } catch (e) { next(e); }
});

// Admin: list users who have NOT completed payment for given month
router.get('/unpaid', auth, requireRole('admin'), async (req, res, next) => {
  try {
    const month = String(req.query.month || '');
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
      return res.status(400).json({ message: 'month must be in format YYYY-MM' });
    }
    // Find users with a completed payment for the month
    const paid = await Payment.find({ month, status: 'completed' }).select('user');
    const paidIds = new Set(paid.map(p => String(p.user)));
    // All users not in paidIds are unpaid (includes pending or no record)
    const users = await User.find({ _id: { $nin: Array.from(paidIds) } }).select('name email fixedAmount username avatarUrl');
    res.json({ month, users });
  } catch (e) { next(e); }
});

// Admin: mark a payment status and optionally adjust amount
router.patch('/:id/mark', auth, requireRole('admin'), async (req, res, next) => {
  try {
    const { status, amount } = req.body;
    if (!['pending', 'completed'].includes(status)) {
      return res.status(400).json({ message: 'status must be "pending" or "completed"' });
    }
    const current = await Payment.findById(req.params.id);
    if (!current) return res.status(404).json({ message: 'Payment not found' });
    if (current.status === 'completed' && status === 'pending') {
      return res.status(400).json({ message: 'Completed payments cannot be changed back to pending' });
    }
    const update = { status };
    if (amount !== undefined) {
      const n = Number(amount);
      if (!Number.isFinite(n) || n <= 0) return res.status(400).json({ message: 'amount must be a positive number' });
      update.amount = n;
    }
    const updated = await Payment.findByIdAndUpdate(req.params.id, update, { new: true });
    res.json(updated);
  } catch (e) { next(e); }
});

// Authenticated: total payments summary (optionally filter by status)
router.get('/total', auth, async (req, res, next) => {
  try {
    const { status } = req.query;
    const match = status ? { status } : {};
    const agg = await Payment.aggregate([
      { $match: match },
      { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
    ]);
    const row = agg[0] || { total: 0, count: 0 };
    res.json({ total: row.total || 0, count: row.count || 0 });
  } catch (e) { next(e); }
});

export default router;

