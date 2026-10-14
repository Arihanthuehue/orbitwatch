import { Router } from 'express';
import { getTestCases, executeAllTests } from '../controllers/tests.controller.js';

const router = Router();

router.get('/cases', getTestCases);
router.post('/execute-all', executeAllTests);

export default router;
