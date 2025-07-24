import usersDb from './usersDb';
import { describe, it, expect, beforeAll } from 'vitest';

const TEST_USER = {
  username: `testuser_${Date.now()}`,
  passwordHash: 'testhash',
};

describe('usersDb', () => {
  beforeAll(() => {
    usersDb.exec('DELETE FROM users'); // Clean slate
  });

  it('should insert and retrieve a user', () => {
    const stmt = usersDb.prepare('INSERT INTO users (username, passwordHash) VALUES (?, ?)');
    const info = stmt.run(TEST_USER.username, TEST_USER.passwordHash);
    expect(info.changes).toBe(1);
    const row = usersDb.prepare('SELECT * FROM users WHERE username = ?').get(TEST_USER.username);
    expect(row).toMatchObject({ username: TEST_USER.username, passwordHash: TEST_USER.passwordHash });
  });

  it('should enforce unique usernames', () => {
    const stmt = usersDb.prepare('INSERT INTO users (username, passwordHash) VALUES (?, ?)');
    expect(() => stmt.run(TEST_USER.username, 'anotherhash')).toThrow();
  });

  it('should return undefined for missing user', () => {
    const row = usersDb.prepare('SELECT * FROM users WHERE username = ?').get('nonexistent');
    expect(row).toBeUndefined();
  });
});
