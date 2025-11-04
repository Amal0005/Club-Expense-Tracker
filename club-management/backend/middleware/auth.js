import jwt from 'jsonwebtoken';

export function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return res.status(401).json({ message: 'No token' });
  try {
    const token = header.split(' ')[1];
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload; // { id, role }
    next();
  } catch (e) {
    return res.status(401).json({ message: 'Invalid token' });
  }
}
