import { Router } from 'express';
import { getReports, UpdateReport, DeleteReport } from '../Product/controllers/report.controller';

const router = Router();

router.get('/report', getReports);
router.put('/report', UpdateReport);
router.delete('/report', DeleteReport);

export default router;