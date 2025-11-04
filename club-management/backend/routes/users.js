import express from 'express';
import User from '../models/User.js';
import { auth } from '../middleware/auth.js';
import { requireRole } from '../middleware/roles.js';
import bcrypt from 'bcrypt';
import multer from 'multer';
import fs from 'fs';
import path from 'path';

const router = express.Router();

const avatarDir = path.resolve('uploads/avatars');
fs.mkdirSync(avatarDir, { recursive: true });
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, avatarDir),
  filename: (req, file, cb) => {
    const safe = file.originalname.replace(/[^a-zA-Z0-9_.-]/g, '_');
    cb(null, `${Date.now()}_${safe}`);
  }
});
const fileFilter = (req, file, cb) => {
  const ok = ['image/jpeg','image/png','image/gif','image/webp'].includes(file.mimetype);
  if (ok) cb(null, true); else cb(new Error('Only image files are allowed'));
};
const upload = multer({ storage, fileFilter, limits: { fileSize: 3 * 1024 * 1024 } });

router.use(auth, requireRole('admin'));

router.get('/', async (req, res, next) => {
  try {
    const users = await User.find().select('-passwordHash');
    res.json(users);
  } catch (e) { next(e); }
});

// Admin: update a user's password
router.patch('/:id/password', async (req, res, next) => {
  try {
    const { password } = req.body;
    if (!password || String(password).length < 6) {
      return res.status(400).json({ message: 'password must be at least 6 characters' });
    }
    const passwordHash = await bcrypt.hash(String(password), 10);
    await User.findByIdAndUpdate(req.params.id, { passwordHash });
    res.json({ message: 'Password updated' });
  } catch (e) { next(e); }
});

router.post('/', upload.single('avatar'), async (req, res, next) => {
  try {
    const { name, username, email, password, fixedAmount, role } = req.body;
    if (!name) return res.status(400).json({ message: 'name is required' });
    if (!username) return res.status(400).json({ message: 'username is required' });
    if (!password || String(password).length < 6) return res.status(400).json({ message: 'password must be at least 6 characters' });
    const uname = String(username).toLowerCase();
    const userByUsername = await User.findOne({ username: uname });
    if (userByUsername) return res.status(409).json({ message: 'Username exists' });
    let emailLower;
    if (email) {
      emailLower = String(email).toLowerCase();
      const userByEmail = await User.findOne({ email: emailLower });
      if (userByEmail) return res.status(409).json({ message: 'Email exists' });
    }
    if (fixedAmount !== undefined) {
      const n = Number(fixedAmount);
      if (!Number.isFinite(n) || n < 0) return res.status(400).json({ message: 'fixedAmount must be a non-negative number' });
    }
    if (role && !['admin', 'user'].includes(role)) return res.status(400).json({ message: 'invalid role' });
    const passwordHash = await bcrypt.hash(password, 10);
    const avatarUrl = req.file ? `/uploads/avatars/${req.file.filename}` : undefined;
    const user = await User.create({ name, username: uname, email: emailLower, passwordHash, fixedAmount, role: role || 'user', avatarUrl });
    res.status(201).json({ id: user._id });
  } catch (e) { next(e); }
});

router.patch('/:id', async (req, res, next) => {
  try {
    const { fixedAmount, name, role, username, email } = req.body;
    const update = {};
    if (name !== undefined) update.name = name;
    if (role !== undefined) {
      if (!['admin', 'user'].includes(role)) return res.status(400).json({ message: 'invalid role' });
      update.role = role;
    }
    if (username !== undefined) {
      const uname = String(username).toLowerCase();
      const exists = await User.findOne({ username: uname, _id: { $ne: req.params.id } });
      if (exists) return res.status(409).json({ message: 'Username exists' });
      update.username = uname;
    }
    if (email !== undefined) {
      const emailLower = email ? String(email).toLowerCase() : undefined;
      if (emailLower) {
        const exists = await User.findOne({ email: emailLower, _id: { $ne: req.params.id } });
        if (exists) return res.status(409).json({ message: 'Email exists' });
      }
      update.email = emailLower;
    }
    if (fixedAmount !== undefined) {
      const n = Number(fixedAmount);
      if (!Number.isFinite(n) || n < 0) return res.status(400).json({ message: 'fixedAmount must be a non-negative number' });
      update.fixedAmount = n;
    }
    const user = await User.findByIdAndUpdate(req.params.id, update, { new: true });
    res.json(user);
  } catch (e) { next(e); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.status(204).end();
  } catch (e) { next(e); }
});

export default router;

