import request from 'supertest';
import app from '../../index';

describe('Auth API', () => {
  const testUser = { username: 'testuser', password: 'testpass' };
  let token: string;

  it('should register a new user', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send(testUser);
    expect(res.statusCode).toBe(200);
    expect(res.body.token).toBeDefined();
    token = res.body.token;
  });

  it('should not allow duplicate registration', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send(testUser);
    expect(res.statusCode).toBe(409);
    expect(res.body.error).toMatch(/exists/i);
  });

  it('should login with correct credentials', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send(testUser);
    expect(res.statusCode).toBe(200);
    expect(res.body.token).toBeDefined();
  });

  it('should not login with wrong password', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ username: testUser.username, password: 'wrongpass' });
    expect(res.statusCode).toBe(401);
    expect(res.body.error).toMatch(/invalid/i);
  });

  it('should not login with missing fields', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ username: testUser.username });
    expect(res.statusCode).toBe(401);
  });
});
