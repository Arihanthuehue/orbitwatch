import { Router } from 'express';
import {
  executeSQLConsole,
  getPredefinedQueries,
  getDbObjectsCatalog,
  runTransactionDemo,
  explainQueryPlan,
  getPartitionInfo,
  getRolesAndGrants
} from '../controllers/dbmsLab.controller.js';
import { optionalJWT } from '../middleware/auth.middleware.js';

const router = Router();

router.post('/console', optionalJWT, executeSQLConsole);
router.get('/queries', getPredefinedQueries);
router.get('/objects', getDbObjectsCatalog);
router.post('/transaction-demo/:scenario', runTransactionDemo);
router.post('/explain', explainQueryPlan);
router.get('/partitions', getPartitionInfo);
router.get('/roles', getRolesAndGrants);

export default router;
