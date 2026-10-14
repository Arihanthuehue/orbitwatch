import { Router } from 'express';
import authRoutes from './auth.routes.js';
import objectsRoutes from './objects.routes.js';
import conjunctionsRoutes from './conjunctions.routes.js';
import stationsRoutes from './stations.routes.js';
import externalRoutes from './external.routes.js';
import analyticsRoutes from './analytics.routes.js';
import dbmsLabRoutes from './dbmsLab.routes.js';
import testsRoutes from './tests.routes.js';
import adminRoutes from './admin.routes.js';
import { isDatabaseConnected } from '../db.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/objects', objectsRoutes);
router.use('/conjunctions', conjunctionsRoutes);
router.use('/stations', stationsRoutes);
router.use('/external', externalRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/dbms', dbmsLabRoutes);
router.use('/tests', testsRoutes);
router.use('/admin', adminRoutes);

// System health check
router.get('/health', (_req, res) => {
  const isConnected = isDatabaseConnected();
  res.json({
    status: 'HEALTHY',
    service: 'ORBITWATCH Backend API',
    version: '1.0.0',
    db: isConnected ? 'Connected (MySQL 8.x InnoDB)' : 'Snapshot Mode (latest_snapshot.json)',
    mode: isConnected ? 'LIVE_MYSQL' : 'REAL_SNAPSHOT_FALLBACK',
    timestamp: new Date().toISOString()
  });
});

export default router;
