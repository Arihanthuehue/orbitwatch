import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import cron from 'node-cron';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from './config/env.js';
import { testConnection } from './db.js';
import apiRoutes from './routes/index.js';
import { errorHandler } from './middleware/error.middleware.js';
import { ensureDatabaseInitialized } from './services/autoMigrate.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Security headers
app.use(helmet({
  crossOriginResourcePolicy: false,
  contentSecurityPolicy: false
}));

// Cross-Origin Resource Sharing
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Polite Rate Limiting for auth
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many login attempts. Please try again after 15 minutes.' }
});

app.use('/api/auth/login', authLimiter);

// Mount API router
app.use('/api', apiRoutes);

// Serve frontend static build in production (single unified deployment)
const possibleDistPaths = [
  path.resolve(process.cwd(), '../client/dist'),
  path.resolve(process.cwd(), 'client/dist'),
  path.resolve(__dirname, '../../client/dist'),
  path.resolve(__dirname, '../../../client/dist')
];

const clientDist = possibleDistPaths.find((p) => fs.existsSync(p));
if (clientDist) {
  console.log(`✓ Serving React production bundle from: ${clientDist}`);
  app.use(express.static(clientDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

// Global centralized error handling
app.use(errorHandler);

export async function startServer() {
  const isDbReady = await testConnection();
  if (!isDbReady) {
    console.error('CRITICAL: Could not establish connection to MySQL database.');
    process.exit(1);
  }
  console.log(`✓ MySQL Connection Pool established (Database: ${config.db.database} on ${config.db.host}:${config.db.port})`);

  // Auto-initialize schema and seed data on clean cloud deployment
  await ensureDatabaseInitialized();

  // Scheduled periodic sync (every 6 hours)
  cron.schedule('0 */6 * * *', async () => {
    console.log('[CRON] Running scheduled periodic space weather check...');
    try {
      const { runIngestionPipeline } = await import('./scripts/ingest.js');
      await runIngestionPipeline();
    } catch (err: any) {
      console.error('[CRON] Background ingestion error:', err.message);
    }
  });

  return app.listen(config.port, () => {
    console.log(`\n======================================================`);
    console.log(`ORBITWATCH FULL-STACK APPLICATION RUNNING`);
    console.log(`Port: ${config.port}`);
    console.log(`Environment: ${config.nodeEnv}`);
    console.log(`Web App & API: http://localhost:${config.port}`);
    console.log(`======================================================\n`);
  });
}

// Auto-start if invoked directly
if (process.argv[1] && process.argv[1].endsWith('index.ts')) {
  startServer();
}

export default app;
