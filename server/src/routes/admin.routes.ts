import { Router } from 'express';
import {
  getAuditLogs,
  getUsers,
  getSyncStatus,
  triggerDataSync,
  triggerBackup,
  getBackupList
} from '../controllers/admin.controller.js';
import { authenticateJWT, optionalJWT, requireRole } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/audit-logs', authenticateJWT, requireRole(['Administrator']), getAuditLogs);
router.get('/users', authenticateJWT, requireRole(['Administrator']), getUsers);
router.get('/sync-status', getSyncStatus);
router.post('/sync/trigger', optionalJWT, triggerDataSync);
router.post('/backup/trigger', authenticateJWT, requireRole(['Administrator']), triggerBackup);
router.get('/backup/list', authenticateJWT, requireRole(['Administrator']), getBackupList);

export default router;
