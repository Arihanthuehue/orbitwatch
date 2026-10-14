import { Router } from 'express';
import {
  getStations,
  getStationById,
  createStation,
  createObservation
} from '../controllers/stations.controller.js';
import { authenticateJWT, requireRole } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/', getStations);
router.get('/:id', getStationById);
router.post('/', authenticateJWT, requireRole(['Administrator', 'Space Agency']), createStation);
router.post('/observations', authenticateJWT, requireRole(['Administrator', 'Space Agency']), createObservation);

export default router;
