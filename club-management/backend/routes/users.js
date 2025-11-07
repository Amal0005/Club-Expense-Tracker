import express from 'express';
import User from '../models/User.js';
import { auth } from '../middleware/auth.js';
import { requireRole } from '../middleware/roles.js';
import bcrypt from 'bcrypt';
import multer from 'multer';
import cloudinary from '../config/cloudinary.js';

const router = express.Router();

const storage = multer.memoryStorage();
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
    let avatarUrl;
    if (req.file) {
      const buffer = req.file.buffer;
      const originalname = req.file.originalname || 'avatar';
      const uploadResult = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: 'club-management/avatars', resource_type: 'image', filename_override: originalname, use_filename: true, unique_filename: true },
          (error, result) => {
            if (error) return reject(error);
            resolve(result);
          }
        );
        stream.end(buffer);
      });
      avatarUrl = uploadResult?.secure_url;
    }
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

router.patch('/:id/block', async (req, res, next) => {
  try {
    const { blocked } = req.body;
    const val = blocked === true || blocked === 'true' || blocked === 1 || blocked === '1';
    if (String(req.params.id) === String(req.user.id) && val) {
      return res.status(400).json({ message: 'You cannot block your own account' });
    }
    const user = await User.findByIdAndUpdate(req.params.id, { isBlocked: val }, { new: true }).select('-passwordHash');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: val ? 'User blocked' : 'User unblocked', user });
  } catch (e) { next(e); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.status(204).end();
  } catch (e) { next(e); }
});

export default router;

