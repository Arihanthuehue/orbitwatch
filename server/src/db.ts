import mysql from 'mysql2/promise';
import { config } from './config/env.js';

let dbConnected = false;

// Primary application connection pool (prepared statements enabled)
export const pool = mysql.createPool({
  ...config.db,
  namedPlaceholders: true,
  decimalNumbers: true,
  connectTimeout: 5000 // 5s timeout so connection attempts never hang
});

// Sandboxed Read-Only connection pool for the live SQL Console
export const roPool = mysql.createPool({
  ...config.dbReadOnly,
  namedPlaceholders: true,
  decimalNumbers: true,
  connectTimeout: 5000
});

export function isDatabaseConnected(): boolean {
  return dbConnected;
}

export async function testConnection(): Promise<boolean> {
  try {
    const conn = await pool.getConnection();
    await conn.query('SELECT 1');
    conn.release();
    dbConnected = true;
    return true;
  } catch (err: any) {
    dbConnected = false;
    console.warn(`[DB NOTICE] MySQL connection notice (${err.message}). Using real snapshot dataset.`);
    return false;
  }
}

export default pool;
