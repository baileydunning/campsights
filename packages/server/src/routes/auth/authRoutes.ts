import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { findUserByUsername, createUser, validatePassword } from '../../models/userModel';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

router.post('/register', (req: Request, res: Response) => {
  const { username, password } = req.body;
  if (!username || !password) {
    res.status(400).json({ error: 'Username and password required' });
    return;
  }
  if (findUserByUsername(username)) {
    res.status(409).json({ error: 'Username already exists' });
    return;
  }
  const user = createUser(username, password);
  const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token });
});

router.post('/login', (req: Request, res: Response) => {
  const { username, password } = req.body;
  if (!username || !password) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }
  const user = findUserByUsername(username);
  if (!user || !validatePassword(user, password)) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }
  const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token });
});

export default router;
