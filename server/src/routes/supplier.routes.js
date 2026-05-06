const express = require('express');
const router = express.Router();
const supplierController = require('../controller/supplier.controller');
const { asyncHandler, authUser, authorize } = require('../auth/checkAuth');

router.get('/simple', authUser, asyncHandler(supplierController.getSimpleList));
router.get('/', authUser, asyncHandler(supplierController.getAll));
router.get('/:id', authUser, asyncHandler(supplierController.getById));
router.post('/', authUser, authorize('admin', 'manager'), asyncHandler(supplierController.create));
router.put('/:id', authUser, authorize('admin', 'manager'), asyncHandler(supplierController.update));
router.delete('/:id', authUser, authorize('admin'), asyncHandler(supplierController.delete));

module.exports = router;
