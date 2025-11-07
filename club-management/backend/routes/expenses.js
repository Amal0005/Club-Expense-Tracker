import express from 'express';
import { auth } from '../middleware/auth.js';
import { requireRole } from '../middleware/roles.js';
import Expense from '../models/Expense.js';
import multer from 'multer';
import cloudinary from '../config/cloudinary.js';

const router = express.Router();

// Use memory storage; upload to Cloudinary
const storage = multer.memoryStorage();
const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg','image/png','image/gif','application/pdf','image/webp'];
  if (allowed.includes(file.mimetype)) cb(null, true); else cb(new Error('Only images or PDF are allowed'));
};
const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });

router.get('/latest', auth, async (req, res, next) => {
  try {
    const items = await Expense.find().sort({ date: -1 }).limit(20);
    res.json(items);
  } catch (e) { next(e); }
});

// Authenticated: total expenses summary
router.get('/total', auth, async (req, res, next) => {
  try {
    const agg = await Expense.aggregate([
      { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
    ]);
    const row = agg[0] || { total: 0, count: 0 };
    res.json({ total: row.total || 0, count: row.count || 0 });
  } catch (e) { next(e); }
});

router.use(auth, requireRole('admin'));

router.post('/', upload.single('proof'), async (req, res, next) => {
  try {
    const { type, amount, date, note } = req.body;
    if (!type || typeof type !== 'string' || !type.trim()) return res.status(400).json({ message: 'type is required' });
    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt <= 0) return res.status(400).json({ message: 'amount must be a positive number' });
    const d = new Date(date);
    if (isNaN(d.getTime())) return res.status(400).json({ message: 'date must be a valid date' });
    let proofUrl;
    if (req.file) {
      const buffer = req.file.buffer;
      const originalname = req.file.originalname || 'expense-proof';
      const result = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: 'club-management/expenses', resource_type: 'auto', filename_override: originalname, use_filename: true, unique_filename: true },
          (error, r) => error ? reject(error) : resolve(r)
        );
        stream.end(buffer);
      });
      proofUrl = result?.secure_url;
    }
    const expense = await Expense.create({ type: type.trim(), amount: amt, date: d, note, proofUrl });
    res.status(201).json(expense);
  } catch (e) { next(e); }
});

router.patch('/:id', async (req, res, next) => {
  try {
    const update = {};
    if (req.body.type !== undefined) {
      if (!req.body.type || typeof req.body.type !== 'string' || !req.body.type.trim()) return res.status(400).json({ message: 'type cannot be empty' });
      update.type = req.body.type.trim();
    }
    if (req.body.amount !== undefined) {
      const amt = Number(req.body.amount);
      if (!Number.isFinite(amt) || amt <= 0) return res.status(400).json({ message: 'amount must be a positive number' });
      update.amount = amt;
    }
    if (req.body.date !== undefined) {
      const d = new Date(req.body.date);
      if (isNaN(d.getTime())) return res.status(400).json({ message: 'date must be a valid date' });
      update.date = d;
    }
    if (req.body.note !== undefined) update.note = req.body.note;
    const expense = await Expense.findByIdAndUpdate(req.params.id, update, { new: true });
    res.json(expense);
  } catch (e) { next(e); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    await Expense.findByIdAndDelete(req.params.id);
    res.status(204).end();
  } catch (e) { next(e); }
});

export default router;

