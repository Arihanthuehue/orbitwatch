import request from 'supertest';
import app from '../index.js';
import pool from '../db.js';

describe('ORBITWATCH API Automated Test Suite', () => {
  let authToken = '';

  afterAll(async () => {
    await pool.end();
  });

  it('GET /api/health should return HEALTHY and database status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('HEALTHY');
    expect(res.body.db).toContain('MySQL');
  });

  it('POST /api/auth/login should authenticate administrator and return JWT', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        username: 'admin',
        password: 'Admin@Orbit2026'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.role).toBe('Administrator');
    authToken = res.body.token;
  });

  it('GET /api/auth/me should return authenticated user profile', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user.username).toBe('admin');
  });

  it('GET /api/objects/satellites should return real paginated satellites', async () => {
    const res = await request(app).get('/api/objects/satellites?limit=10');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.total).toBeGreaterThan(0);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('GET /api/objects/debris should return real debris catalog', async () => {
    const res = await request(app).get('/api/objects/debris?limit=10');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.total).toBeGreaterThan(0);
  });

  it('GET /api/conjunctions should return real close encounters', async () => {
    const res = await request(app).get('/api/conjunctions');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('GET /api/stations should return tracking stations with workload metrics', async () => {
    const res = await request(app).get('/api/stations');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.stations.length).toBeGreaterThanOrEqual(12);
  });

  it('GET /api/analytics/kpis should return system telemetry counts', async () => {
    const res = await request(app).get('/api/analytics/kpis');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.kpis.totalTrackedObjects).toBeGreaterThan(1000);
  });

  it('POST /api/tests/execute-all should execute 12 DBMS test cases with 100% pass', async () => {
    const res = await request(app).post('/api/tests/execute-all');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.totalTests).toBe(12);
    expect(res.body.passedCount).toBe(12);
    expect(res.body.passRate).toBe('100%');
  });
});
