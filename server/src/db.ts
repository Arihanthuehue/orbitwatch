import mysql from 'mysql2/promise';
import { config } from './config/env.js';

// Primary application connection pool (prepared statements enabled)
export const pool = mysql.createPool({
  ...config.db,
  namedPlaceholders: true,
  decimalNumbers: true
});

// Sandboxed Read-Only connection pool for the live SQL Console
export const roPool = mysql.createPool({
  ...config.dbReadOnly,
  namedPlaceholders: true,
  decimalNumbers: true
});

export async function testConnection(): Promise<boolean> {
  try {
    const conn = await pool.getConnection();
    await conn.query('SELECT 1');
    conn.release();
    return true;
  } catch (err) {
    console.error('MySQL connection error:', err);
    return false;
  }
}

export default pool;
