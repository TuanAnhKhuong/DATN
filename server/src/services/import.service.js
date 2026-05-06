const modelImport = require('../models/import.model');
const modelProduct = require('../models/product.model');
const { BadRequestError, NotFoundError } = require('../core/error.response');

class ImportService {
    /**
     * Tạo phiếu nhập kho
     */
    async createImport(data, userId) {
        // Validate items
        if (!data.items || data.items.length === 0) {
            throw new BadRequestError('Phiếu nhập phải có ít nhất 1 sản phẩm');
        }

        // Snapshot thông tin sản phẩm
        for (const item of data.items) {
            const product = await modelProduct.findById(item.product);
            if (!product) throw new NotFoundError(`Sản phẩm ${item.product} không tồn tại`);
            item.productName = product.name;
            item.sku = product.sku;
        }

        const importData = {
            ...data,
            createdBy: userId,
            status: data.status || 'pending',
        };

        const importDoc = await modelImport.create(importData);

        // Nếu tạo với trạng thái completed → cập nhật tồn kho ngay
        if (importDoc.status === 'completed') {
            await this._updateStock(importDoc, 'add');
        }

        return await importDoc.populate([
            { path: 'supplier', select: 'name code' },
            { path: 'items.product', select: 'name sku thumbnail' },
            { path: 'createdBy', select: 'fullName email' },
        ]);
    }

    /**
     * Lấy danh sách phiếu nhập
     */
    async getAllImports(query = {}) {
        const {
            search,
            status,
            supplier,
            startDate,
            endDate,
            sortBy = 'createdAt',
            sortOrder = 'desc',
            page = 1,
            limit = 20,
        } = query;

        const filter = {};

        if (search) {
            filter.$or = [{ code: { $regex: search, $options: 'i' } }, { note: { $regex: search, $options: 'i' } }];
        }
        if (status) filter.status = status;
        if (supplier) filter.supplier = supplier;
        if (startDate || endDate) {
            const dateQuery = {};
            if (startDate) dateQuery.$gte = new Date(startDate);
            if (endDate) dateQuery.$lte = new Date(endDate + 'T23:59:59.999Z');

            if (!filter.$and) filter.$and = [];
            filter.$and.push({
                $or: [
                    { importDate: dateQuery },
                    { importDate: null, createdAt: dateQuery },
                    { importDate: { $exists: false }, createdAt: dateQuery },
                ],
            });
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const sortOptions = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

        const [imports, total] = await Promise.all([
            modelImport
                .find(filter)
                .populate('supplier', 'name code')
                .populate('createdBy', 'fullName email')
                .sort(sortOptions)
                .skip(skip)
                .limit(parseInt(limit))
                .lean(),
            modelImport.countDocuments(filter),
        ]);

        return {
            imports,
            total,
            page: parseInt(page),
            totalPages: Math.ceil(total / parseInt(limit)),
        };
    }

    /**
     * Chi tiết phiếu nhập
     */
    async getImportById(id) {
        const importDoc = await modelImport
            .findById(id)
            .populate('supplier')
            .populate('items.product', 'name sku thumbnail quantity')
            .populate('createdBy', 'fullName email');
        if (!importDoc) throw new NotFoundError('Phiếu nhập không tồn tại');
        return importDoc;
    }

    /**
     * Duyệt phiếu nhập → cộng tồn kho
     */
    async approveImport(id) {
        const importDoc = await modelImport.findById(id);
        if (!importDoc) throw new NotFoundError('Phiếu nhập không tồn tại');
        if (importDoc.status !== 'pending') {
            throw new BadRequestError('Chỉ duyệt được phiếu ở trạng thái "Chờ duyệt"');
        }

        importDoc.status = 'completed';
        await importDoc.save();

        // Cộng tồn kho
        await this._updateStock(importDoc, 'add');

        return await importDoc.populate([
            { path: 'supplier', select: 'name code' },
            { path: 'items.product', select: 'name sku' },
        ]);
    }

    /**
     * Hủy phiếu nhập
     * Nếu đã completed → trừ lại tồn kho
     */
    async cancelImport(id) {
        const importDoc = await modelImport.findById(id);
        if (!importDoc) throw new NotFoundError('Phiếu nhập không tồn tại');
        if (importDoc.status === 'cancelled') {
            throw new BadRequestError('Phiếu đã bị hủy trước đó');
        }

        const wasCompleted = importDoc.status === 'completed';
        importDoc.status = 'cancelled';
        await importDoc.save();

        // Nếu đã cộng tồn kho → trừ lại
        if (wasCompleted) {
            await this._updateStock(importDoc, 'subtract');
        }

        return importDoc;
    }

    /**
     * Thống kê nhập kho
     */
    async getImportStats() {
        const [total, pending, completed, cancelled, totalValue] = await Promise.all([
            modelImport.countDocuments(),
            modelImport.countDocuments({ status: 'pending' }),
            modelImport.countDocuments({ status: 'completed' }),
            modelImport.countDocuments({ status: 'cancelled' }),
            modelImport.aggregate([
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

    /**
     * Cập nhật tồn kho sản phẩm
     * Gom nhóm items trùng product trước để tránh xử lý trùng
     */
    async _updateStock(importDoc, action) {
        // Gom nhóm: nếu cùng product → cộng dồn số lượng
        const grouped = {};
        for (const item of importDoc.items) {
            const pid = item.product.toString();
            if (!grouped[pid]) {
                grouped[pid] = { quantity: 0, importPrice: item.importPrice };
            }
            grouped[pid].quantity += item.quantity;
            grouped[pid].importPrice = item.importPrice; // lấy giá nhập mới nhất
        }

        for (const [pid, data] of Object.entries(grouped)) {
            const product = await modelProduct.findById(pid);
            if (!product) continue;

            if (action === 'add') {
                product.quantity += data.quantity;
                // Cập nhật giá nhập mới nhất
                product.importPrice = data.importPrice;
                // Ghi nhận thời điểm nhập kho lần cuối (ưu tiên ngày nhập thực tế)
                product.lastImportDate = importDoc.importDate || new Date();
            } else if (action === 'subtract') {
                product.quantity = Math.max(0, product.quantity - data.quantity);
            }

            await product.save();
        }
    }
}

module.exports = new ImportService();
