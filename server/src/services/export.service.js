const modelExport = require('../models/export.model');
const modelProduct = require('../models/product.model');
const { BadRequestError, NotFoundError } = require('../core/error.response');

class ExportService {
    async createExport(data, userId) {
        if (!data.items || data.items.length === 0) {
            throw new BadRequestError('Phiếu xuất phải có ít nhất 1 sản phẩm');
        }

        // Validate tồn kho + snapshot
        for (const item of data.items) {
            const product = await modelProduct.findById(item.product);
            if (!product) throw new NotFoundError(`Sản phẩm ${item.product} không tồn tại`);
            if (product.quantity < item.quantity) {
                throw new BadRequestError(
                    `${product.name} chỉ còn ${product.quantity} ${product.unit}, không đủ xuất ${item.quantity}`,
                );
            }
            item.productName = product.name;
            item.sku = product.sku;
        }

        const exportDoc = await modelExport.create({ ...data, createdBy: userId });

        if (exportDoc.status === 'completed') {
            await this._updateStock(exportDoc, 'subtract');
        }

        return await exportDoc.populate([
            { path: 'items.product', select: 'name sku thumbnail' },
            { path: 'createdBy', select: 'fullName email' },
        ]);
    }

    async getAllExports(query = {}) {
        const {
            search,
            status,
            type,
            startDate,
            endDate,
            sortBy = 'createdAt',
            sortOrder = 'desc',
            page = 1,
            limit = 20,
        } = query;

        const filter = {};
        if (search) {
            filter.$or = [
                { code: { $regex: search, $options: 'i' } },
                { receiver: { $regex: search, $options: 'i' } },
                { note: { $regex: search, $options: 'i' } },
            ];
        }
        if (status) filter.status = status;
        if (type) filter.type = type;
        if (startDate || endDate) {
            const dateQuery = {};
            if (startDate) dateQuery.$gte = new Date(startDate);
            if (endDate) dateQuery.$lte = new Date(endDate + 'T23:59:59.999Z');

            if (!filter.$and) filter.$and = [];
            filter.$and.push({
                $or: [
                    { exportDate: dateQuery },
                    { exportDate: null, createdAt: dateQuery },
                    { exportDate: { $exists: false }, createdAt: dateQuery },
                ],
            });
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [exports, total] = await Promise.all([
            modelExport
                .find(filter)
                .populate('createdBy', 'fullName email')
                .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
                .skip(skip)
                .limit(parseInt(limit))
                .lean(),
            modelExport.countDocuments(filter),
        ]);

        return { exports, total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) };
    }

    async getExportById(id) {
        const doc = await modelExport
            .findById(id)
            .populate('items.product', 'name sku thumbnail quantity unit')
            .populate('createdBy', 'fullName email');
        if (!doc) throw new NotFoundError('Phiếu xuất không tồn tại');
        return doc;
    }

    async approveExport(id) {
        const doc = await modelExport.findById(id);
        if (!doc) throw new NotFoundError('Phiếu xuất không tồn tại');
        if (doc.status !== 'pending') throw new BadRequestError('Chỉ duyệt phiếu ở trạng thái "Chờ duyệt"');

        // Re-validate tồn kho trước khi duyệt
        for (const item of doc.items) {
            const product = await modelProduct.findById(item.product);
            if (!product) throw new NotFoundError(`Sản phẩm ${item.productName} không tồn tại`);
            if (product.quantity < item.quantity) {
                throw new BadRequestError(
                    `${product.name} chỉ còn ${product.quantity}, không đủ xuất ${item.quantity}`,
                );
            }
        }

        doc.status = 'completed';
        await doc.save();
        await this._updateStock(doc, 'subtract');

        return await doc.populate([{ path: 'items.product', select: 'name sku' }]);
    }

    async cancelExport(id) {
        const doc = await modelExport.findById(id);
        if (!doc) throw new NotFoundError('Phiếu xuất không tồn tại');
        if (doc.status === 'cancelled') throw new BadRequestError('Phiếu đã bị hủy trước đó');

        const wasCompleted = doc.status === 'completed';
        doc.status = 'cancelled';
        await doc.save();

        if (wasCompleted) {
            await this._updateStock(doc, 'add');
        }
        return doc;
    }

    async getExportStats() {
        const [total, pending, completed, cancelled, totalValue] = await Promise.all([
            modelExport.countDocuments(),
            modelExport.countDocuments({ status: 'pending' }),
            modelExport.countDocuments({ status: 'completed' }),
            modelExport.countDocuments({ status: 'cancelled' }),
            modelExport.aggregate([
                { $match: { status: 'completed' } },
                { $group: { _id: null, total: { $sum: '$totalAmount' }, totalItems: { $sum: '$totalItems' } } },
            ]),
        ]);
        return {
            total,
            pending,
            completed,
            cancelled,
            totalValue: totalValue[0]?.total || 0,
            totalItems: totalValue[0]?.totalItems || 0,
        };
    }

    async _updateStock(exportDoc, action) {
        for (const item of exportDoc.items) {
            const product = await modelProduct.findById(item.product);
            if (!product) continue;
            if (action === 'subtract') {
                product.quantity = Math.max(0, product.quantity - item.quantity);
                product.soldCount = (product.soldCount || 0) + item.quantity;
            } else {
                product.quantity += item.quantity;
                product.soldCount = Math.max(0, (product.soldCount || 0) - item.quantity);
            }
            await product.save();
        }
    }
}

module.exports = new ExportService();
