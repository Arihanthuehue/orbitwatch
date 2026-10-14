import request from 'supertest';
import app from '../index.js';
import pool from '../db.js';

async function main() {
  console.log('\n======================================================');
  console.log('ORBITWATCH AUTOMATED TEST & VERIFICATION SUITE');
  console.log('======================================================\n');

  let passed = 0;
  let failed = 0;

  async function test(name: string, fn: () => Promise<void>) {
    try {
      await fn();
      console.log(`PASS: ${name}`);
      passed++;
    } catch (err: any) {
      console.error(`FAIL: ${name} -> ${err.message}`);
      failed++;
    }
  }

  let authToken = '';

  await test('GET /api/health returns HEALTHY', async () => {
    const res = await request(app).get('/api/health');
    if (res.status !== 200 || res.body.status !== 'HEALTHY') throw new Error(`Unexpected status ${res.status}`);
  });

  await test('POST /api/auth/login logs in Administrator with bcrypt validation', async () => {
    const res = await request(app).post('/api/auth/login').send({ username: 'admin', password: 'Admin@Orbit2026' });
    if (res.status !== 200 || !res.body.token) throw new Error(`Login failed`);
    authToken = res.body.token;
  });

  await test('GET /api/auth/me verifies JWT session', async () => {
    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${authToken}`);
    if (res.status !== 200 || (res.body.user.role_name !== 'Administrator' && res.body.user.role !== 'Administrator')) {
      throw new Error(`Auth me failed: role is ${res.body.user?.role_name}`);
    }
  });

  await test('GET /api/objects/satellites returns real ingested satellites', async () => {
    const res = await request(app).get('/api/objects/satellites?limit=5');
    if (res.status !== 200 || res.body.total < 1000) throw new Error(`Total satellites ${res.body.total} too low`);
  });

  await test('GET /api/objects/debris returns real debris fragments', async () => {
    const res = await request(app).get('/api/objects/debris?limit=5');
    if (res.status !== 200 || res.body.total < 1000) throw new Error(`Total debris ${res.body.total} too low`);
  });

  await test('GET /api/conjunctions returns real SOCRATES encounters', async () => {
    const res = await request(app).get('/api/conjunctions?limit=5');
    if (res.status !== 200 || res.body.data.length === 0) throw new Error('No conjunctions returned');
  });

  await test('GET /api/stations returns 12 verified ground tracking stations', async () => {
    const res = await request(app).get('/api/stations');
    if (res.status !== 200 || res.body.stations.length < 12) throw new Error('Stations count mismatch');
  });

  await test('GET /api/analytics/kpis returns live telemetry metrics', async () => {
    const res = await request(app).get('/api/analytics/kpis');
    if (res.status !== 200 || res.body.kpis.totalTrackedObjects < 2000) throw new Error('KPI object count low');
  });

  await test('POST /api/tests/execute-all runs all 12 MySQL constraint/trigger/procedure test cases with 100% pass', async () => {
    const res = await request(app).post('/api/tests/execute-all');
    if (res.status !== 200 || res.body.passRate !== '100%') {
      throw new Error(`Test suite pass rate: ${res.body.passRate}`);
    }
  });

  console.log(`\n------------------------------------------------------`);
  console.log(`Total: ${passed + failed} | Passed: ${passed} | Failed: ${failed}`);
  console.log(`------------------------------------------------------\n`);

  await pool.end();
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
