import fs from 'fs';
import path from 'path';
import pool from '../db.js';

export async function exportDatabaseSnapshot() {
  console.log('--- Exporting Real Database Snapshot ---');
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

  const snapshot: Record<string, any[]> = {
    _meta: [
      {
        exportedAt: new Date().toISOString(),
        version: '1.0.0',
        platform: 'ORBITWATCH Space Debris Platform',
        team: 'Pranil Vithlani, Arihant Singh, Tanzil Hassan (VIT Chennai)'
      }
    ]
  };

  const conn = await pool.getConnection();
  try {
    for (const tbl of tables) {
      const [rows] = await conn.query<any[]>(`SELECT * FROM ${tbl}`);
      snapshot[tbl] = rows;
      console.log(`Exported ${tbl}: ${rows.length} rows`);
    }

    const outDir = path.resolve(process.cwd(), '../scripts/snapshots');
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }

    const outFile = path.join(outDir, 'latest_snapshot.json');
    fs.writeFileSync(outFile, JSON.stringify(snapshot, null, 2), 'utf-8');
    console.log(`✓ Snapshot exported successfully to: ${outFile} (${(fs.statSync(outFile).size / 1024 / 1024).toFixed(2)} MB)`);
  } finally {
    conn.release();
  }
}

if (process.argv[1] && process.argv[1].endsWith('exportSnapshot.ts')) {
  exportDatabaseSnapshot().then(() => process.exit(0)).catch(() => process.exit(1));
}
