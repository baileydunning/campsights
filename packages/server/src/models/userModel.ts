import bcrypt from 'bcryptjs';
import usersDb from '../config/usersDb';

export interface User {
  id: number;
  username: string;
  passwordHash: string;
}

export function findUserByUsername(username: string): User | undefined {
  const row = usersDb.prepare('SELECT * FROM users WHERE username = ?').get(username) as User | undefined;
  if (!row) return undefined;
  return row;
}

export function createUser(username: string, password: string): User {
  const passwordHash = bcrypt.hashSync(password, 10);
  const stmt = usersDb.prepare('INSERT INTO users (username, passwordHash) VALUES (?, ?)');
  const info = stmt.run(username, passwordHash);
  return { id: info.lastInsertRowid as number, username, passwordHash };
}

export function validatePassword(user: User, password: string): boolean {
  return bcrypt.compareSync(password, user.passwordHash);
}
