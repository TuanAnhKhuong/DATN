const express = require('express');
const router = express.Router();
const inventoryController = require('../controller/inventory.controller');
const { asyncHandler, authUser } = require('../auth/checkAuth');

router.get('/overview', authUser, asyncHandler(inventoryController.getOverview));
router.get('/stock', authUser, asyncHandler(inventoryController.getStockList));
router.get('/history/:productId', authUser, asyncHandler(inventoryController.getProductHistory));

module.exports = router;
