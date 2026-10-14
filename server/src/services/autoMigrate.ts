import fs from 'fs';
import path from 'path';
import pool from '../db.js';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function ensureDatabaseInitialized(): Promise<void> {
  const conn = await pool.getConnection();
  try {
    // Check if tables already exist
    const [tables] = await conn.query<any[]>(
      "SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'SATELLITE'"
    );

    if (tables.length > 0) {
      console.log('✓ Database schema verified. Tables already initialized.');
      return;
    }

    console.log('--- Initializing Clean Database Schema for Deployment ---');

    // Locate db sql directory
    const possibleDbDirs = [
      path.resolve(process.cwd(), '../db'),
      path.resolve(process.cwd(), 'db'),
      path.resolve(__dirname, '../../../db'),
      path.resolve(__dirname, '../../db')
    ];

    const dbDir = possibleDbDirs.find((d) => fs.existsSync(d));

    if (dbDir) {
      const sqlFiles = [
        '01_schema.sql',
        '02_constraints_indexes.sql',
        '03_views.sql',
        '04_functions.sql',
        '05_procedures.sql',
        '06_triggers.sql',
        '07_roles.sql'
      ];

      for (const file of sqlFiles) {
        const filePath = path.join(dbDir, file);
        if (fs.existsSync(filePath)) {
          const rawSql = fs.readFileSync(filePath, 'utf-8');
          // Split by delimiter or execute statements
          const statements = rawSql
            .replace(/DELIMITER \$\$/g, '')
            .replace(/DELIMITER ;/g, '')
            .split(/;\s*$/m)
            .map((s) => s.trim())
            .filter((s) => s.length > 0 && !s.startsWith('--') && !s.startsWith('USE '));

          for (const stmt of statements) {
            try {
              await conn.query(stmt.replace(/\$\$$/, ''));
            } catch (err: any) {
              // Ignore routine exists or role exists
              if (!err.message.includes('already exists') && !err.message.includes('Operation CREATE USER failed')) {
                console.warn(`[AutoMigrate] Notice on ${file}:`, err.message.slice(0, 100));
              }
            }
          }
          console.log(`✓ Applied ${file}`);
        }
      }
    }

    // Seed roles and static data
    const { seedStaticData } = await import('../scripts/seed.js');
    await seedStaticData();

    // Import real snapshot if present
    const { importDatabaseSnapshot } = await import('../scripts/importSnapshot.js');
    await importDatabaseSnapshot();

    console.log('✓ Database auto-initialization successfully finished.');
  } catch (err: any) {
    console.warn('[AutoMigrate] Database auto-initialization notice:', err.message);
  } finally {
    conn.release();
  }
}
