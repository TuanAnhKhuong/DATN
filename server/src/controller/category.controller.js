const { OK, Created } = require('../core/success.response');
const CategoryService = require('../services/category.service');

class CategoryController {
    async create(req, res) {
        const category = await CategoryService.createCategory(req.body);
        new Created({ message: 'Tạo danh mục thành công', metadata: category }).send(res);
    }

    async getAll(req, res) {
        const categories = await CategoryService.getAllCategories(req.query);
        new OK({ message: 'success', metadata: categories }).send(res);
    }

    async getById(req, res) {
        const category = await CategoryService.getCategoryById(req.params.id);
        new OK({ message: 'success', metadata: category }).send(res);
    }

    async update(req, res) {
        const category = await CategoryService.updateCategory(req.params.id, req.body);
        new OK({ message: 'Cập nhật danh mục thành công', metadata: category }).send(res);
    }

    async delete(req, res) {
        const category = await CategoryService.deleteCategory(req.params.id);
        new OK({ message: 'Xóa danh mục thành công', metadata: category }).send(res);
    }
}

module.exports = new CategoryController();
