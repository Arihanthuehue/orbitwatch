import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import pool from '../db.js';
import { runIngestionPipeline } from '../scripts/ingest.js';
import { exportDatabaseSnapshot } from '../scripts/exportSnapshot.js';

export async function getAuditLogs(req: Request, res: Response): Promise<void> {
  try {
    const page = parseInt(req.query.page as string || '1', 10);
    const limit = parseInt(req.query.limit as string || '25', 10);
    const offset = (page - 1) * limit;

    const actionType = (req.query.actionType as string || '').trim();

    let whereClause = 'WHERE 1=1';
    const params: any[] = [];

    if (actionType && actionType !== 'ALL') {
      whereClause += ' AND a.action_type = ?';
      params.push(actionType);
    }

    const [countResult] = await pool.query<any[]>(
      `SELECT COUNT(*) AS total FROM AUDIT_LOG a ${whereClause}`,
      params
    );
    const total = countResult[0].total;

    const [rows] = await pool.query<any[]>(
      `SELECT a.*, u.username, u.role_name
       FROM AUDIT_LOG a
       LEFT JOIN APP_USER u ON a.user_id = u.User_ID
       ${whereClause}
       ORDER BY a.Log_ID DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    res.json({
      success: true,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      logs: rows
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function getUsers(_req: Request, res: Response): Promise<void> {
  try {
    const [rows] = await pool.query<any[]>(
      'SELECT User_ID, username, email, role_name, full_name, organization, created_at FROM APP_USER ORDER BY User_ID ASC'
    );
    res.json({
      success: true,
      users: rows
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function getSyncStatus(_req: Request, res: Response): Promise<void> {
  try {
    const [history] = await pool.query<any[]>(
      'SELECT * FROM DATA_SYNC_LOG ORDER BY Sync_ID DESC LIMIT 10'
    );
    res.json({
      success: true,
      latest: history[0] || null,
      history
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

import { runFastLiveSync } from '../services/liveSync.js';

export async function triggerDataSync(_req: Request, res: Response): Promise<void> {
  try {
    const result = await runFastLiveSync();
    res.json({
      success: true,
      recordsSynced: result.recordsSynced,
      message: result.message
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function triggerBackup(_req: Request, res: Response): Promise<void> {
  try {
    await exportDatabaseSnapshot();
    const backupDir = path.resolve(process.cwd(), '../scripts/snapshots');
    const files = fs.existsSync(backupDir) ? fs.readdirSync(backupDir) : [];

    res.json({
      success: true,
      message: 'Database backup snapshot created successfully.',
      files
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function getBackupList(_req: Request, res: Response): Promise<void> {
  try {
    const backupDir = path.resolve(process.cwd(), '../scripts/snapshots');
    if (!fs.existsSync(backupDir)) {
      res.json({ success: true, files: [] });
      return;
    }

    const fileNames = fs.readdirSync(backupDir);
    const files = fileNames.map((name) => {
      const fullPath = path.join(backupDir, name);
      const stat = fs.statSync(fullPath);
      return {
        name,
        sizeBytes: stat.size,
        sizeMB: (stat.size / 1024 / 1024).toFixed(2),
        createdAt: stat.birthtime
      };
    });

    res.json({ success: true, files });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}
