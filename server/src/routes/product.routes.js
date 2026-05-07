const express = require('express');
const router = express.Router();
const productController = require('../controller/product.controller');
const { asyncHandler, authUser, authorize } = require('../auth/checkAuth');

// Các route đặc biệt (đặt TRƯỚC /:id)
router.get('/low-stock', authUser, asyncHandler(productController.getLowStock));
router.get('/stats', authUser, asyncHandler(productController.getStats));
router.get('/barcode/:code', authUser, asyncHandler(productController.lookupBarcode));

// CRUD chính
router.get('/', authUser, asyncHandler(productController.getAll));
router.get('/:id', authUser, asyncHandler(productController.getById));
router.post('/', authUser, authorize('admin', 'manager'), asyncHandler(productController.create));
router.put('/:id', authUser, authorize('admin', 'manager'), asyncHandler(productController.update));
router.delete('/:id', authUser, authorize('admin', 'manager'), asyncHandler(productController.delete));

// Variant management
router.post('/:id/variants', authUser, authorize('admin', 'manager'), asyncHandler(productController.addVariant));
router.put(
    '/:id/variants/:variantId',
    authUser,
    authorize('admin', 'manager'),
    asyncHandler(productController.updateVariant),
);
router.delete(
    '/:id/variants/:variantId',
    authUser,
    authorize('admin', 'manager'),
    asyncHandler(productController.removeVariant),
);

// AI Recommendation
router.get('/:id/recommended', authUser, asyncHandler(productController.getRecommended));

module.exports = router;
