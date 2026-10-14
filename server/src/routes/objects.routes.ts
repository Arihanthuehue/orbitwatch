import { Router } from 'express';
import {
  getAllObjectsForGlobe,
  getSatellites,
  getSatelliteById,
  createSatellite,
  updateSatellite,
  deleteSatellite,
  getDebris,
  getDebrisById,
  getDebrisLineage,
  createDebris,
  updateDebris,
  deleteDebris
} from '../controllers/objects.controller.js';
import { authenticateJWT, requireRole } from '../middleware/auth.middleware.js';

const router = Router();

// 3D Orbit Explorer instanced buffer endpoint
router.get('/all', getAllObjectsForGlobe);

// Satellites
router.get('/satellites', getSatellites);
router.get('/satellites/:id', getSatelliteById);
router.post('/satellites', authenticateJWT, requireRole(['Administrator', 'Space Agency']), createSatellite);
router.put('/satellites/:id', authenticateJWT, requireRole(['Administrator', 'Space Agency', 'Satellite Operator']), updateSatellite);
router.delete('/satellites/:id', authenticateJWT, requireRole(['Administrator', 'Space Agency']), deleteSatellite);

// Debris
router.get('/debris', getDebris);
router.get('/debris/:id', getDebrisById);
router.get('/debris/lineage/:noradId', getDebrisLineage);
router.post('/debris', authenticateJWT, requireRole(['Administrator', 'Space Agency']), createDebris);
router.put('/debris/:id', authenticateJWT, requireRole(['Administrator', 'Space Agency', 'Satellite Operator']), updateDebris);
router.delete('/debris/:id', authenticateJWT, requireRole(['Administrator', 'Space Agency']), deleteDebris);

export default router;
