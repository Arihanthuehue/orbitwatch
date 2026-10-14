import fs from 'fs';
import path from 'path';
import pool from '../db.js';

export async function importDatabaseSnapshot() {
  console.log('--- Importing Database Snapshot for Offline Demo ---');
  const snapshotPath = path.resolve(process.cwd(), '../scripts/snapshots/latest_snapshot.json');

  if (!fs.existsSync(snapshotPath)) {
    throw new Error(`Snapshot file not found at: ${snapshotPath}`);
  }

  const raw = fs.readFileSync(snapshotPath, 'utf-8');
  const snapshot = JSON.parse(raw);

  const tables = [
    'TRACKING_STATION',
    'ROLE',
    'APP_USER',
    'SATELLITE',
    'DEBRIS',
    'COLLISION_EVENT',
    'DEBRIS_LINEAGE',
    'OBSERVATION',
    'SPACE_WEATHER',
    'NEAR_EARTH_OBJECT',
    'ALERT',
    'TEST_CASE'
  ];

  const conn = await pool.getConnection();
  try {
    await conn.query('SET FOREIGN_KEY_CHECKS = 0');

    for (const tbl of tables) {
      const rows = snapshot[tbl];
      if (!Array.isArray(rows) || rows.length === 0) continue;

      console.log(`Importing ${tbl} (${rows.length} rows)...`);
      const cols = Object.keys(rows[0]);
      const placeholders = `(${cols.map(() => '?').join(', ')})`;

      // Batch insert in chunks of 500
      const chunkSize = 500;
      for (let i = 0; i < rows.length; i += chunkSize) {
        const chunk = rows.slice(i, i + chunkSize);
        const values: any[] = [];
        const sqlParts: string[] = [];

        for (const row of chunk) {
          sqlParts.push(placeholders);
          for (const col of cols) {
            values.push(row[col]);
          }
        }

        const query = `INSERT IGNORE INTO ${tbl} (${cols.join(', ')}) VALUES ${sqlParts.join(', ')}`;
        await conn.query(query, values);
      }
    }

    await conn.query('SET FOREIGN_KEY_CHECKS = 1');
    console.log('✓ Snapshot import successfully completed.');
  } finally {
    conn.release();
  }
}

if (process.argv[1] && process.argv[1].endsWith('importSnapshot.ts')) {
  importDatabaseSnapshot().then(() => process.exit(0)).catch(() => process.exit(1));
}
