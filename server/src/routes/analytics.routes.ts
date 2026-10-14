import { Router } from 'express';
import {
  getDashboardKPIs,
  getOrbitDistribution,
  getSizeDistribution,
  getAltitudeHistogram,
  getBreakupEventBreakdown,
  getCountryDistribution
} from '../controllers/analytics.controller.js';

const router = Router();

router.get('/kpis', getDashboardKPIs);
router.get('/orbit-distribution', getOrbitDistribution);
router.get('/size-distribution', getSizeDistribution);
router.get('/altitude-histogram', getAltitudeHistogram);
router.get('/breakup-events', getBreakupEventBreakdown);
router.get('/country-distribution', getCountryDistribution);

export default router;
