"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const report_controller_1 = require("../Product/controllers/report.controller");
const router = (0, express_1.Router)();
router.get('/report', report_controller_1.getReports);
router.put('/report', report_controller_1.UpdateReport);
router.delete('/report', report_controller_1.DeleteReport);
exports.default = router;
