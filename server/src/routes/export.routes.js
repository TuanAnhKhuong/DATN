const express = require('express');
const router = express.Router();
const exportController = require('../controller/export.controller');
const { asyncHandler, authUser, authorize } = require('../auth/checkAuth');

router.get('/stats', authUser, asyncHandler(exportController.getStats));
router.get('/', authUser, asyncHandler(exportController.getAll));
router.get('/:id', authUser, asyncHandler(exportController.getById));
router.post('/', authUser, authorize('admin', 'manager', 'staff'), asyncHandler(exportController.create));
router.patch('/:id/approve', authUser, authorize('admin', 'manager'), asyncHandler(exportController.approve));
router.patch('/:id/cancel', authUser, authorize('admin', 'manager'), asyncHandler(exportController.cancel));

module.exports = router;
