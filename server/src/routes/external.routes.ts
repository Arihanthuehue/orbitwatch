import { Router } from 'express';
import { getSpaceWeather, getAsteroids } from '../controllers/external.controller.js';

const router = Router();

router.get('/space-weather', getSpaceWeather);
router.get('/asteroids', getAsteroids);

export default router;
