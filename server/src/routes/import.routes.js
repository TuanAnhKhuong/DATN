const express = require('express');
const router = express.Router();
const importController = require('../controller/import.controller');
const { asyncHandler, authUser, authorize } = require('../auth/checkAuth');

// Routes đặc biệt (TRƯỚC /:id)
router.get('/stats', authUser, asyncHandler(importController.getStats));

// CRUD
router.get('/', authUser, asyncHandler(importController.getAll));
router.get('/:id', authUser, asyncHandler(importController.getById));
router.post('/', authUser, authorize('admin', 'manager', 'staff'), asyncHandler(importController.create));

// Duyệt / Hủy
router.patch('/:id/approve', authUser, authorize('admin', 'manager'), asyncHandler(importController.approve));
router.patch('/:id/cancel', authUser, authorize('admin', 'manager'), asyncHandler(importController.cancel));

module.exports = router;
