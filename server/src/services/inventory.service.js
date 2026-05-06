const modelProduct = require('../models/product.model');
const modelImport = require('../models/import.model');
const modelExport = require('../models/export.model');
const { NotFoundError } = require('../core/error.response');

class InventoryService {
    /**
     * Tồn kho tổng quan — stats
     */
    async getOverview() {
        const [totalProducts, totalQty, lowStock, outOfStock, totalValue, topLow] = await Promise.all([
            modelProduct.countDocuments({ status: { $ne: 'draft' } }),
            modelProduct.aggregate([
                { $match: { status: { $ne: 'draft' } } },
                {
                    $group: {
                        _id: null,
                        qty: { $sum: '$quantity' },
                        val: { $sum: { $multiply: ['$importPrice', '$quantity'] } },
                    },
                },
            ]),
            modelProduct.countDocuments({
                $expr: { $lte: ['$quantity', '$minStock'] },
                quantity: { $gt: 0 },
                status: { $ne: 'draft' },
            }),
            modelProduct.countDocuments({ status: 'out_of_stock' }),
            modelProduct.aggregate([
                { $match: { status: { $ne: 'draft' } } },
                { $group: { _id: null, sale: { $sum: { $multiply: ['$salePrice', '$quantity'] } } } },
            ]),
            modelProduct
                .find({ $expr: { $lte: ['$quantity', '$minStock'] }, status: { $ne: 'draft' } })
                .populate('category', 'name')
                .sort({ quantity: 1 })
                .limit(10)
                .lean({ virtuals: true }),
        ]);

        return {
            totalProducts,
            totalQuantity: totalQty[0]?.qty || 0,
            totalImportValue: totalQty[0]?.val || 0,
            totalSaleValue: totalValue[0]?.sale || 0,
            lowStock,
            outOfStock,
            topLowStock: topLow,
        };
    }

    /**
     * Danh sách tồn kho (full products + filter)
     */
    async getStockList(query = {}) {
        const { search, category, stockStatus, sortBy = 'quantity', sortOrder = 'asc', page = 1, limit = 20 } = query;

        const filter = { status: { $ne: 'draft' } };

        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { sku: { $regex: search, $options: 'i' } },
                { brand: { $regex: search, $options: 'i' } },
            ];
        }
        if (category) filter.category = category;
        if (stockStatus === 'low') {
            filter.$expr = { $lte: ['$quantity', '$minStock'] };
            filter.quantity = { $gt: 0 };
        } else if (stockStatus === 'out') {
            filter.quantity = 0;
        } else if (stockStatus === 'normal') {
            filter.$expr = { $gt: ['$quantity', '$minStock'] };
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [products, total] = await Promise.all([
            modelProduct
                .find(filter)
                .populate('category', 'name')
                .populate('supplier', 'name')
                .select(
                    'name sku brand thumbnail category supplier quantity minStock unit importPrice salePrice status lastImportDate',
                )
                .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
                .skip(skip)
                .limit(parseInt(limit))
                .lean({ virtuals: true }),
            modelProduct.countDocuments(filter),
        ]);

        return { products, total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) };
    }

    /**
     * Lịch sử xuất nhập của 1 sản phẩm
     */
    async getProductHistory(productId, query = {}) {
        const { page = 1, limit = 20 } = query;

        const product = await modelProduct.findById(productId).select('name sku quantity minStock unit');
        if (!product) throw new NotFoundError('Sản phẩm không tồn tại');

        // Song song lấy lịch sử nhập + xuất
        const [importDocs, exportDocs] = await Promise.all([
            modelImport
                .find({ 'items.product': productId, status: 'completed' })
                .select('code items totalAmount status createdAt createdBy')
                .populate('createdBy', 'name')
                .sort({ createdAt: -1 })
                .lean(),
            modelExport
                .find({ 'items.product': productId, status: 'completed' })
                .select('code items totalAmount type status createdAt createdBy')
                .populate('createdBy', 'name')
                .sort({ createdAt: -1 })
                .lean(),
        ]);

        // Gộp thành timeline
        const history = [];

        importDocs.forEach((doc) => {
            const item = doc.items.find((i) => i.product.toString() === productId);
            if (item) {
                history.push({
                    _id: doc._id,
                    type: 'import',
                    code: doc.code,
                    quantity: item.quantity,
                    price: item.importPrice,
                    total: item.totalPrice,
                    createdBy: doc.createdBy?.name || '—',
                    createdAt: doc.createdAt,
                });
            }
        });

        exportDocs.forEach((doc) => {
            const item = doc.items.find((i) => i.product.toString() === productId);
            if (item) {
                history.push({
                    _id: doc._id,
                    type: 'export',
                    exportType: doc.type,
                    code: doc.code,
                    quantity: item.quantity,
                    price: item.exportPrice,
                    total: item.totalPrice,
                    createdBy: doc.createdBy?.name || '—',
                    createdAt: doc.createdAt,
                });
            }
        });

        // Sort theo thời gian mới nhất
        history.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        // Paginate
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const paged = history.slice(skip, skip + parseInt(limit));

        return {
            product,
            history: paged,
            total: history.length,
            page: parseInt(page),
            totalPages: Math.ceil(history.length / parseInt(limit)),
        };
    }
}

module.exports = new InventoryService();
