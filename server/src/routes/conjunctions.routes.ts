import { Router } from 'express';
import {
  getConjunctions,
  getTopRiskyDebris,
  getHighRiskEventsFromView,
  recordConjunction,
  escalateHighRiskEvents,
  screenComputedConjunctions
} from '../controllers/conjunctions.controller.js';
import { authenticateJWT, requireRole } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/', getConjunctions);
router.get('/top-risky', getTopRiskyDebris);
router.get('/high-risk-view', getHighRiskEventsFromView);
router.post('/record', authenticateJWT, requireRole(['Administrator', 'Space Agency', 'Satellite Operator']), recordConjunction);
router.post('/escalate', authenticateJWT, requireRole(['Administrator', 'Satellite Operator']), escalateHighRiskEvents);
router.post('/screen-computed', authenticateJWT, requireRole(['Administrator', 'Space Agency']), screenComputedConjunctions);

export default router;
