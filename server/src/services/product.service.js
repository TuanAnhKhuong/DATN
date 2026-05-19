const modelProduct = require('../models/product.model');
const { BadRequestError, NotFoundError } = require('../core/error.response');

class ProductService {
    async createProduct(data) {
    const existingProduct = await modelProduct.findOne({
        name: {
            $regex: `^${data.name}$`,
            $options: 'i'
        }
    });

    if (existingProduct) {
        throw new BadRequestError('Sản phẩm đã tồn tại trong kho');
    }

    const product = await modelProduct.create(data);
    return await product.populate(['category', 'supplier']);
    }

    async getAllProducts(query = {}) {
        const { search, category, supplier, brand, status, minPrice, maxPrice, tags,
            sortBy = 'createdAt', sortOrder = 'desc', page = 1, limit = 20 } = query;

        const filter = {};

        // Text search
        if (search) {
            filter.$text = { $search: search };
        }

        // Filter category, supplier, brand
        if (category) filter.category = category;
        if (supplier) filter.supplier = supplier;
        if (brand) filter.brand = { $regex: brand, $options: 'i' };

        // Filter giá
        if (minPrice || maxPrice) {
            filter.salePrice = {};
            if (minPrice) filter.salePrice.$gte = Number(minPrice);
            if (maxPrice) filter.salePrice.$lte = Number(maxPrice);
        }

        // Filter trạng thái
        if (status) filter.status = status;

        // Filter tags
        if (tags) {
            const tagArray = typeof tags === 'string' ? tags.split(',') : tags;
            filter.tags = { $in: tagArray };
        }

        // Sorting
        const sortOptions = {};
        if (search) {
            sortOptions.score = { $meta: 'textScore' };
        }
        sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [products, total] = await Promise.all([
            modelProduct
                .find(filter, search ? { score: { $meta: 'textScore' } } : {})
                .populate('category', 'name')
                .populate('supplier', 'name code')
                .sort(sortOptions)
                .skip(skip)
                .limit(parseInt(limit))
                .lean({ virtuals: true }),
            modelProduct.countDocuments(filter),
        ]);

        return {
            products,
            total,
            page: parseInt(page),
            totalPages: Math.ceil(total / parseInt(limit)),
        };
    }

    async getProductById(id) {
        const product = await modelProduct
            .findById(id)
            .populate('category')
            .populate('supplier');
        if (!product) {
            throw new NotFoundError('Sản phẩm không tồn tại');
        }
        // Tăng lượt xem
        product.viewCount += 1;
        await product.save();
        return product;
    }

    async updateProduct(id, data) {
        const product = await modelProduct.findById(id);
        if (!product) {
            throw new NotFoundError('Sản phẩm không tồn tại');
        }
        Object.assign(product, data);
        await product.save();
        return await product.populate(['category', 'supplier']);
    }

    async deleteProduct(id) {
        const product = await modelProduct.findById(id);
        if (!product) {
            throw new NotFoundError('Sản phẩm không tồn tại');
        }
        await product.deleteOne();
        return product;
    }

    async getLowStockProducts() {
        const products = await modelProduct
            .find({
                $expr: { $lte: ['$quantity', '$minStock'] },
                status: { $ne: 'inactive' },
            })
            .populate('category', 'name')
            .populate('supplier', 'name')
            .sort({ quantity: 1 })
            .lean({ virtuals: true });
        return products;
    }

    async getProductStats() {
        const [totalProducts, outOfStock, lowStock, totalValue, byCategory] = await Promise.all([
            modelProduct.countDocuments({ status: { $ne: 'draft' } }),
            modelProduct.countDocuments({ status: 'out_of_stock' }),
            modelProduct.countDocuments({ $expr: { $lte: ['$quantity', '$minStock'] }, quantity: { $gt: 0 } }),
            modelProduct.aggregate([
                { $match: { status: { $ne: 'draft' } } },
                {
                    $group: {
                        _id: null,
                        totalImportValue: { $sum: { $multiply: ['$importPrice', '$quantity'] } },
                        totalSaleValue: { $sum: { $multiply: ['$salePrice', '$quantity'] } },
                        totalQuantity: { $sum: '$quantity' },
                    },
                },
            ]),
            modelProduct.aggregate([
                { $match: { status: { $ne: 'draft' } } },
                { $group: { _id: '$category', count: { $sum: 1 }, totalQty: { $sum: '$quantity' } } },
                {
                    $lookup: {
                        from: 'categories',
                        localField: '_id',
                        foreignField: '_id',
                        as: 'category',
                    },
                },
                { $unwind: '$category' },
                { $project: { name: '$category.name', count: 1, totalQty: 1 } },
                { $sort: { count: -1 } },
            ]),
        ]);

        return {
            totalProducts,
            outOfStock,
            lowStock,
            totalQuantity: totalValue[0]?.totalQuantity || 0,
            totalImportValue: totalValue[0]?.totalImportValue || 0,
            totalSaleValue: totalValue[0]?.totalSaleValue || 0,
            byCategory,
        };
    }

    // ===== VARIANT MANAGEMENT =====

    async addVariant(productId, variantData) {
        const product = await modelProduct.findById(productId);
        if (!product) throw new NotFoundError('Sản phẩm không tồn tại');

        product.hasVariants = true;
        product.variants.push(variantData);
        await product.save();
        return product;
    }

    async updateVariant(productId, variantId, variantData) {
        const product = await modelProduct.findById(productId);
        if (!product) throw new NotFoundError('Sản phẩm không tồn tại');

        const variant = product.variants.id(variantId);
        if (!variant) throw new NotFoundError('Biến thể không tồn tại');

        Object.assign(variant, variantData);
        await product.save();
        return product;
    }

    async removeVariant(productId, variantId) {
        const product = await modelProduct.findById(productId);
        if (!product) throw new NotFoundError('Sản phẩm không tồn tại');

        product.variants.pull(variantId);
        if (product.variants.length === 0) product.hasVariants = false;
        await product.save();
        return product;
    }

    // ===== AI RECOMMENDATION READY =====

    async getRecommendedProducts(productId, limit = 8) {
        const product = await modelProduct.findById(productId);
        if (!product) throw new NotFoundError('Sản phẩm không tồn tại');

        // Tìm SP cùng category hoặc cùng brand, sắp theo popularity
        const recommended = await modelProduct
            .find({
                _id: { $ne: productId },
                status: 'active',
                $or: [
                    { category: product.category },
                    { brand: product.brand },
                    { tags: { $in: product.tags || [] } },
                ],
            })
            .sort({ soldCount: -1, rating: -1, viewCount: -1 })
            .limit(limit)
            .populate('category', 'name')
            .lean({ virtuals: true });

        return recommended;
    }
    // ===== BARCODE LOOKUP =====

    async findByBarcode(code) {
        const product = await modelProduct
            .findOne({
                $or: [
                    { barcode: code },
                    { sku: code },
                    { 'variants.barcode': code },
                    { 'variants.sku': code },
                ],
            })
            .populate('category', 'name')
            .populate('supplier', 'name code');
        if (!product) {
            throw new NotFoundError('Không tìm thấy sản phẩm với mã: ' + code);
        }
        return product;
    }
}

module.exports = new ProductService();
