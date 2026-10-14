import dotenv from 'dotenv';
import path from 'path';

// Load .env from project root or server folder
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// Parse DATABASE_URL / MYSQL_URL if provided by Railway / Render
const dbUrl = process.env.MYSQL_URL || process.env.DATABASE_URL;
let dbHost = process.env.DB_HOST || process.env.MYSQLHOST || 'localhost';
let dbPort = parseInt(process.env.DB_PORT || process.env.MYSQLPORT || '3306', 10);
let dbUser = process.env.DB_USER || process.env.MYSQLUSER || 'root';
let dbPassword = process.env.DB_PASSWORD || process.env.MYSQLPASSWORD || 'Arihant@006';
let dbName = process.env.DB_NAME || process.env.MYSQLDATABASE || 'orbitwatch_db';

if (dbUrl && (dbUrl.startsWith('mysql://') || dbUrl.startsWith('mysql2://'))) {
  try {
    const cleanUrl = dbUrl.replace(/^mysql2:\/\//, 'mysql://');
    const parsed = new URL(cleanUrl);
    dbHost = parsed.hostname;
    dbPort = parseInt(parsed.port || '3306', 10);
    dbUser = parsed.username || 'root';
    dbPassword = decodeURIComponent(parsed.password || '');
    dbName = parsed.pathname.replace(/^\//, '') || 'orbitwatch_db';
  } catch (e) {
    console.warn('Could not parse database URL:', e);
  }
}

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'orbitwatch_super_secure_jwt_secret_key_2026_vit_chennai',
  db: {
    host: dbHost,
    port: dbPort,
    user: dbUser,
    password: dbPassword,
    database: dbName,
    connectionLimit: 20,
    waitForConnections: true,
    queueLimit: 0,
    timezone: '+00:00'
  },
  dbReadOnly: {
    host: dbHost,
    port: dbPort,
    user: process.env.DB_RO_USER || dbUser,
    password: process.env.DB_RO_PASSWORD || dbPassword,
    database: dbName,
    connectionLimit: 10
  },
  nasaApiKey: process.env.NASA_API_KEY || 'DEMO_KEY',
  spacetrack: {
    user: process.env.SPACETRACK_USER || '',
    password: process.env.SPACETRACK_PASSWORD || ''
  },
  discosToken: process.env.DISCOS_TOKEN || ''
};
