const express = require('express');
const router = express.Router();
const categoryController = require('../controller/category.controller');
const { asyncHandler, authUser, authorize } = require('../auth/checkAuth');

router.get('/', authUser, asyncHandler(categoryController.getAll));
router.get('/:id', authUser, asyncHandler(categoryController.getById));
router.post('/', authUser, authorize('admin', 'manager'), asyncHandler(categoryController.create));
router.put('/:id', authUser, authorize('admin', 'manager'), asyncHandler(categoryController.update));
router.delete('/:id', authUser, authorize('admin'), asyncHandler(categoryController.delete));

module.exports = router;
