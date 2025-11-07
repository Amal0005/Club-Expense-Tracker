import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export async function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return res.status(401).json({ message: 'No token' });
  try {
    const token = header.split(' ')[1];
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    // Ensure user still exists and is not blocked
    const u = await User.findById(payload.id).select('isBlocked');
    if (!u) return res.status(401).json({ message: 'Invalid token' });
    if (u.isBlocked) return res.status(403).json({ message: 'Account is blocked. Contact admin.' });
    req.user = payload; // { id, role }
    next();
  } catch (e) {
    return res.status(401).json({ message: 'Invalid token' });
  }
}
