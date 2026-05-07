const modelCategory = require('../models/category.model');
const { BadRequestError, ConflictRequestError, NotFoundError } = require('../core/error.response');

class CategoryService {
    async createCategory(data) {
        const { name, description } = data;
        const existing = await modelCategory.findOne({ name });
        if (existing) {
            throw new ConflictRequestError('Danh mục đã tồn tại');
        }
        const category = await modelCategory.create({ name, description });
        return category;
    }

    async getAllCategories(query = {}) {
        const { search, isActive } = query;
        const filter = {};

        if (search) {
            filter.name = { $regex: search, $options: 'i' };
        }
        if (isActive !== undefined) {
            filter.isActive = isActive === 'true';
        }

        const categories = await modelCategory.find(filter).sort({ createdAt: -1 });
        return categories;
    }

    async getCategoryById(id) {
        const category = await modelCategory.findById(id);
        if (!category) {
            throw new NotFoundError('Danh mục không tồn tại');
        }
        return category;
    }

    async updateCategory(id, data) {
        const category = await modelCategory.findById(id);
        if (!category) {
            throw new NotFoundError('Danh mục không tồn tại');
        }

        // Kiểm tra trùng tên
        if (data.name && data.name !== category.name) {
            const existing = await modelCategory.findOne({ name: data.name });
            if (existing) {
                throw new ConflictRequestError('Tên danh mục đã tồn tại');
            }
        }

        Object.assign(category, data);
        await category.save();
        return category;
    }

    async deleteCategory(id) {
        const category = await modelCategory.findById(id);
        if (!category) {
            throw new NotFoundError('Danh mục không tồn tại');
        }

        // Kiểm tra có sản phẩm nào thuộc danh mục này không
        const modelProduct = require('../models/product.model');
        const productCount = await modelProduct.countDocuments({ category: id });
        if (productCount > 0) {
            throw new BadRequestError(`Không thể xóa. Danh mục đang có ${productCount} sản phẩm`);
        }

        await category.deleteOne();
        return category;
    }
}

module.exports = new CategoryService();
